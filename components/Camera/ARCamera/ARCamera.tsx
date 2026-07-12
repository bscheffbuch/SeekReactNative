import React, {
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Image,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { useNavigation, useIsFocused, useFocusEffect } from "@react-navigation/native";
import { getManufacturerSync } from "react-native-device-info";
import Realm from "realm";
import isNumber from "lodash/isNumber";
import { useSharedValue } from "react-native-worklets-core";
import type { Prediction } from "vision-camera-plugin-inatvision";
import type {
  Camera,
  CameraDevice,
  PhotoFile,
  TakePhotoOptions,
} from "react-native-vision-camera";

import i18n from "../../../i18n";
import { viewStyles, imageStyles, textStyles } from "../../../styles/camera/arCamera";
import icons from "../../../assets/icons";
import StyledText from "../../UIComponents/StyledText";
import CameraError from "../CameraError";
import {
  checkForSystemVersion,
  handleLog,
  showCameraSaveFailureAlert,
} from "../../../utility/cameraHelpers";
import {
  checkCameraPermissions,
  checkLocationPermissions,
  checkSavePermissions,
} from "../../../utility/androidHelpers.android";
import { fetchUserLocation } from "../../../utility/locationHelpers";
import { savePostingSuccess } from "../../../utility/loginHelpers";
import { createTimestamp } from "../../../utility/dateHelpers";
import ARCameraOverlay from "./ARCameraOverlay";
import { resetRouter } from "../../../utility/navigationHelpers";
import { fetchImageLocationOrErrorCode } from "../../../utility/resultsHelpers";
import { checkIfCameraLaunched } from "../../../utility/helpers";
import { colors } from "../../../styles/global";
import Modal from "../../UIComponents/Modals/Modal";
import WarningModal from "../../Modals/WarningModal";
import { UserContext } from "../../UserContext";
import type { ErrorMessage, ReasonMessage } from "./FrameProcessorCamera";
import FrameProcessorCamera from "./FrameProcessorCamera";
import { log } from "../../../react-native-logs.config";
import { useCameraLocationPreference } from "../../Providers/CameraLocationPreferenceProvider";
import { useObservation } from "../../Providers/ObservationProvider";
import type { ObservationImage } from "../../Providers/ObservationProvider";
import { saveQueuedObservation, getQueuedCount } from "../../../utility/observationQueueHelpers";
import { LogLevels, logToApi } from "../../../utility/apiCalls";
import {
  getCameraDevice,
  useCameraDevices,
} from "./helpers/visionCameraWrapper";
import { useFetchUserSettings } from "../../../utility/customHooks/useFetchUserSettings";
import {
  useLocationPermission as useLocationPermissionCamera,
} from "./helpers/visionCameraWrapper";
import {
  DEFAULT_BACK_CAMERA_ZOOM,
  getBackCameraDeviceForZoom,
  getBackCameraZoomPresets,
  getBackCameraZoomValue,
  getNeutralRelativeBackCameraZoomValue,
  getPreferredVideoStabilizationModeForDevice,
} from "./helpers/cameraDeviceHelpers";
import type { BackCameraZoomPreset } from "./helpers/cameraDeviceHelpers";
import realmConfig from "../../../models/index";

const logger = log.extend( "ARCamera.js" );
const CAMERA_RECOVERY_DELAY_MS = 650;
const MAX_CAMERA_RECOVERY_ATTEMPTS = 5;
const DEFAULT_FOCUS_PEAKING_SENSITIVITY = 0.35;
// Camera2 can't keep up with manual focus updates at drag frequency; bridged
// calls are throttled to this interval with a trailing latest-wins call.
const MANUAL_FOCUS_THROTTLE_MS = 80;
// Camera ids beyond "0"/"1" are vendor-specific, so the optimized-logical-camera
// ranking (id "20") must only apply on Samsung devices.
const isSamsungDevice = Platform.OS === "android"
  && getManufacturerSync( ).toLowerCase( ).includes( "samsung" );

type CameraViewportResolution = "540p" | "720p" | "1080p" | "1440p" | "2160p";

const CAMERA_VIEWPORT_RESOLUTIONS: {
  label: CameraViewportResolution;
  width: number;
  height: number;
}[] = [
  { label: "540p", width: 960, height: 540 },
  { label: "720p", width: 1280, height: 720 },
  { label: "1080p", width: 1920, height: 1080 },
  { label: "1440p", width: 2560, height: 1440 },
  { label: "2160p", width: 3840, height: 2160 },
];

interface State {
  allPredictions: Prediction[];
  error: string | null;
  errorEvent: string | null;
  taxonId: string | null;
  negativeFilter: boolean;
}

const initialState: State = {
  allPredictions: [],
  error: null,
  errorEvent: null,
  negativeFilter: false,
  taxonId: null,
};

enum ACTION {
  RESET_PREDICTIONS = "RESET_PREDICTIONS",
  SET_PREDICTIONS = "SET_PREDICTIONS",
  PHOTO_TAKEN = "PHOTO_TAKEN",
  RESET_STATE = "RESET_STATE",
  FILTER_TAXON = "FILTER_TAXON",
  ERROR = "ERROR"
}

export enum TOAST {
  NONE = "NONE",
  FLASH_OFF = "FLASH_OFF",
  FLASH_ON = "FLASH_ON",
  LOCATION_OFF = "LOCATION_OFF",
  LOCATION_ON = "LOCATION_ON",
  SAVED_FOR_LATER = "SAVED_FOR_LATER",
}

type Action = { type: ACTION.RESET_PREDICTIONS }
  | { type: ACTION.SET_PREDICTIONS; predictions: Prediction[] }
  | { type: ACTION.RESET_STATE }
  | { type: ACTION.FILTER_TAXON; taxonId: string | null; negativeFilter: boolean }
  | { type: ACTION.ERROR; error: string | null; errorEvent?: string };

interface HandledPhoto extends PhotoFile {
  predictions: Prediction[];
  uri: string;
}

const ARCamera = ( ) => {
  useEffect( () => {
    logger.debug( "Uses vision camera" );
  }, [] );

  const isFocused = useIsFocused( );
  const navigation = useNavigation( );
  const camera = useRef<Camera>( null );
  const { startObservationWithImage, setObservation } = useObservation();
  const [isActive, setIsActive] = useState( true );
  const [isCaptureInProgress, setIsCaptureInProgress] = useState( false );
  const [queueCount, setQueueCount] = useState( 0 );

  const [cameraPosition, setCameraPosition] = useState<"front" | "back">( "back" );
  const [backCameraZoom, setBackCameraZoom] = useState( DEFAULT_BACK_CAMERA_ZOOM );
  const [manualFocusEnabled, setManualFocusEnabled] = useState( false );
  const [manualFocusValue, setManualFocusValue] = useState( 0.5 );
  const manualFocusValueRef = useRef( manualFocusValue );
  const manualFocusEnabledRef = useRef( manualFocusEnabled );
  const manualFocusGenerationRef = useRef( 0 );
  const manualFocusRequestIdRef = useRef( 0 );
  const cameraRecoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>( null );
  const cameraRecoveryAttemptsRef = useRef( 0 );
  const [cameraRecoveryCycle, setCameraRecoveryCycle] = useState( 0 );
  const [cameraRecovering, setCameraRecovering] = useState( false );
  const [focusPeakingEnabled, setFocusPeakingEnabled] = useState( false );
  const [focusPeakingSensitivity, setFocusPeakingSensitivity] = useState( DEFAULT_FOCUS_PEAKING_SENSITIVITY );
  const [digitalStabilizationEnabled, setDigitalStabilizationEnabled] = useState( false );
  const [photoHdrEnabled, setPhotoHdrEnabled] = useState( false );
  const [torch, setTorch] = useState<"off" | "on">( "off" );
  const cameraDevices = useCameraDevices();
  const backCameraDevices = useMemo( () => (
    cameraDevices.filter( ( cameraDevice: CameraDevice ) => cameraDevice.position === "back" )
  ), [cameraDevices] );
  const backDevice = useMemo( () => (
    getBackCameraDeviceForZoom( backCameraDevices, backCameraZoom, isSamsungDevice )
  ), [backCameraDevices, backCameraZoom] );
  const frontDevice = useMemo( () => (
    getCameraDevice( cameraDevices, "front" )
  ), [cameraDevices] );
  const backCameraZoomPresets: BackCameraZoomPreset[] = useMemo( () => (
    getBackCameraZoomPresets( backCameraDevices )
  ), [backCameraDevices] );

  let device = cameraPosition === "back" ? backDevice : frontDevice;
  // If there is no back camera, use the front camera
  if ( !backDevice ) {
    device = frontDevice;
  }

  const hasFlash = device?.hasFlash;
  const hasTorch = device?.hasTorch;
  const supportsPhotoHdr = device?.formats.some( deviceFormat => deviceFormat.supportsPhotoHdr ) === true;
  const supportsManualFocus = device?.supportsFocus === true;
  const supportsDigitalStabilization = getPreferredVideoStabilizationModeForDevice( device ) !== undefined;
  const initialPhotoOptions = {
    // We had this set to true in Seek but received many reports of it not respecting OS-wide sound
    // level and scared away wildlife. So maybe better to just disable it.
    enableShutterSound: false,
    ...( hasFlash && { flash: "off" } as const ),
  } as const;
  const [takePhotoOptions, setTakePhotoOptions] = useState<TakePhotoOptions>( initialPhotoOptions );
  const [visibleToast, setVisibleToast] = useState( TOAST.NONE );
  const fetchedUserSettings = useFetchUserSettings( );
  // ARCamera stays mounted while blurred, so useFetchUserSettings (which reads
  // once on mount) would keep serving stale values after a visit to Settings.
  // Settings are therefore re-read on every focus of this screen.
  const [refetchedUserSettings, setRefetchedUserSettings] = useState<{
    cameraViewportResolution?: string;
    photoQualityBalance?: string;
    confidenceThreshold?: number;
  } | null>( null );
  const userSettings = refetchedUserSettings ?? fetchedUserSettings;
  const viewportResolution = CAMERA_VIEWPORT_RESOLUTIONS.find(
    resolution => resolution.label === userSettings?.cameraViewportResolution
  ) || CAMERA_VIEWPORT_RESOLUTIONS[1];
  const photoQualityBalance = ( userSettings?.photoQualityBalance as "speed" | "balanced" | "quality" | undefined ) || "balanced";

  useEffect( () => {
    const selectedZoomAvailable = backCameraZoomPresets.some(
      preset => Math.abs( preset.zoom - backCameraZoom ) < 0.05
    );
    if ( !selectedZoomAvailable && backCameraZoomPresets.length > 0 ) {
      const defaultPreset = backCameraZoomPresets.find(
        preset => preset.zoom === DEFAULT_BACK_CAMERA_ZOOM
      ) || backCameraZoomPresets[0];
      setBackCameraZoom( defaultPreset.zoom );
    }
  }, [backCameraZoom, backCameraZoomPresets] );

  useEffect( () => {
    if ( !hasTorch && torch === "on" ) {
      setTorch( "off" );
    }
  }, [hasTorch, torch] );

  useEffect( () => {
    setTakePhotoOptions( previousOptions => {
      if ( hasFlash && !previousOptions.flash ) {
        return {
          ...previousOptions,
          flash: "off",
        };
      }
      if ( !hasFlash && previousOptions.flash ) {
        const optionsWithoutFlash = { ...previousOptions };
        delete optionsWithoutFlash.flash;
        return optionsWithoutFlash;
      }
      return previousOptions;
    } );
  }, [hasFlash] );
  
  const location = useLocationPermissionCamera();
  const { hasPermission } = location;
  const { userDisabledLocation, setUserDisabledLocation } = useCameraLocationPreference();
  const useLocation = hasPermission && !userDisabledLocation;

  const toggleLocation = () => {
    if ( !hasPermission ) {
      return;
    }
    setUserDisabledLocation( ( prev ) => !prev );
    // Always show status when button is pressed
    setVisibleToast( useLocation ? TOAST.LOCATION_OFF : TOAST.LOCATION_ON );
  };

  const handleToastEnd = useCallback( () => {
    setVisibleToast( TOAST.NONE );
  }, [] );

  // determines whether or not to fetch untruncated coords or precise coords for posting to iNat
  const { login } = useContext( UserContext );

  const pictureTaken = useSharedValue( false );

  const [state, dispatch] = useReducer( ( currentState: State, action: Action ) => {
    switch ( action.type ) {
      case ACTION.RESET_PREDICTIONS:
        return { ...currentState, allPredictions: [] };
      case ACTION.SET_PREDICTIONS:
        return { ...currentState, allPredictions: action.predictions };
      case ACTION.RESET_STATE:
        // eslint-disable-next-line react-hooks/react-compiler
        pictureTaken.value = false;
        return {
          ...currentState,
          error: null,
          allPredictions: [],
        };
      case ACTION.FILTER_TAXON:
        pictureTaken.value = false;
        return {
          ...currentState,
          negativeFilter: action.negativeFilter,
          taxonId: action.taxonId,
          error: null,
          allPredictions: [],
        };
      case ACTION.ERROR:
        return { ...currentState, error: action.error, errorEvent: action.errorEvent ?? null };
      default:
        throw new Error( );
    }
  }, initialState );

  const {
    allPredictions,
    error,
    errorEvent,
    negativeFilter,
    taxonId,
  } = state;

  // As of react-native-worklets-core v1.3.3 there is a discrepancy in the way objects are returned from
  // worklets. The "object" returned is not possible to be used with ...spread syntax or Object.assign which
  // we are using in other places that reference these prediction objects here after thy are attached to a
  // taken photo.
  const sortedPredictions = allPredictions
    .map( ( p: Prediction ) => ( {
      name: p.name,
      rank_level: p.rank_level,
      combined_score: p.combined_score,
      taxon_id: p.taxon_id,
      ancestor_ids: p.ancestor_ids,
      rank: p.rank,
    } as Prediction ) )
    .sort( ( a, b ) => b.rank_level - a.rank_level );
  const lowestRankPrediction = sortedPredictions[sortedPredictions.length - 1];

  const [showModal, setShowModal] = useState( false );
  const cameraLoaded = useSharedValue( false );
  const speciesTimeoutSet = useSharedValue( false );
  const frozenSpeciesScore = useSharedValue( 0 );
  const speciesTimeoutId = useRef<ReturnType<typeof setTimeout> | null>( null );

  useEffect( () => () => {
    if ( speciesTimeoutId.current ) {
      clearTimeout( speciesTimeoutId.current );
      speciesTimeoutId.current = null;
    }
  }, [] );

  const flipCamera = () => {
    const newPosition = cameraPosition === "back" ? "front" : "back";
    setCameraPosition( newPosition );
  };

  const selectBackCameraZoom = useCallback( ( zoom: number ) => {
    if ( cameraPosition !== "back" ) {
      setCameraPosition( "back" );
    }
    setBackCameraZoom( zoom );
  }, [cameraPosition] );

  const canSelectZoom = cameraPosition === "back" && backCameraZoomPresets.length > 1;
  // On iOS multi-cam devices zoom factor 1 selects the ultra-wide lens, so zoom
  // presets are mapped relative to device.neutralZoom (preset 1x -> neutralZoom)
  // to keep the default view correct. Android keeps the existing mapping.
  const cameraZoom = device && cameraPosition === "back"
    ? ( Platform.OS === "ios"
      ? getNeutralRelativeBackCameraZoomValue( device, backCameraZoom )
      : getBackCameraZoomValue( device, backCameraZoom ) )
    : device?.neutralZoom;

  manualFocusEnabledRef.current = manualFocusEnabled;

  const isSupersededManualFocusError = ( focusError: unknown ) => {
    const message = focusError instanceof Error
      ? focusError.message
      : String( focusError );
    return message.includes( "Camera2CameraControl was updated with new options" )
      || message.includes( "OperationCanceledException" );
  };

  const clearCameraRecoveryTimeout = useCallback( () => {
    if ( cameraRecoveryTimeoutRef.current ) {
      clearTimeout( cameraRecoveryTimeoutRef.current );
      cameraRecoveryTimeoutRef.current = null;
    }
  }, [] );

  const manualFocusThrottleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>( null );
  const lastManualFocusSentAtRef = useRef( 0 );
  const pendingManualFocusValueRef = useRef<number | null>( null );

  const clearManualFocusThrottle = useCallback( () => {
    if ( manualFocusThrottleTimeoutRef.current ) {
      clearTimeout( manualFocusThrottleTimeoutRef.current );
      manualFocusThrottleTimeoutRef.current = null;
    }
    pendingManualFocusValueRef.current = null;
  }, [] );

  const resetCameraFocus = useCallback( () => {
    manualFocusGenerationRef.current += 1;
    manualFocusRequestIdRef.current += 1;
    manualFocusValueRef.current = 0.5;
    clearManualFocusThrottle();
    setManualFocusValue( 0.5 );
    camera.current?.resetFocus?.().catch( focusError => logger.warn( focusError ) );
  }, [clearManualFocusThrottle] );

  const sendManualFocus = useCallback( ( focusValue: number ) => {
    if ( !manualFocusEnabledRef.current || !camera.current?.setManualFocus ) {
      return;
    }

    lastManualFocusSentAtRef.current = Date.now();
    const generation = manualFocusGenerationRef.current;
    const requestId = manualFocusRequestIdRef.current + 1;
    manualFocusRequestIdRef.current = requestId;
    camera.current.setManualFocus( focusValue )
      .catch( focusError => {
        if (
          generation === manualFocusGenerationRef.current
          && requestId === manualFocusRequestIdRef.current
          && manualFocusEnabledRef.current
          && !isSupersededManualFocusError( focusError )
        ) {
          logger.warn( focusError );
        }
      } );
  }, [] );

  // Throttles the bridged setManualFocus calls during slider drags; the latest
  // value always wins via a trailing call.
  const queueManualFocus = useCallback( ( focusValue: number ) => {
    pendingManualFocusValueRef.current = focusValue;
    if ( manualFocusThrottleTimeoutRef.current ) {
      // A trailing call is already scheduled and will pick up the latest value
      return;
    }

    const elapsed = Date.now() - lastManualFocusSentAtRef.current;
    if ( elapsed >= MANUAL_FOCUS_THROTTLE_MS ) {
      pendingManualFocusValueRef.current = null;
      sendManualFocus( focusValue );
      return;
    }

    manualFocusThrottleTimeoutRef.current = setTimeout( () => {
      manualFocusThrottleTimeoutRef.current = null;
      const pendingFocusValue = pendingManualFocusValueRef.current;
      pendingManualFocusValueRef.current = null;
      if ( pendingFocusValue != null ) {
        sendManualFocus( pendingFocusValue );
      }
    }, MANUAL_FOCUS_THROTTLE_MS - elapsed );
  }, [sendManualFocus] );

  useEffect( () => () => {
    clearCameraRecoveryTimeout();
    clearManualFocusThrottle();
  }, [clearCameraRecoveryTimeout, clearManualFocusThrottle] );

  const toggleManualFocus = useCallback( () => {
    setManualFocusEnabled( currentManualFocusEnabled => {
      const nextManualFocusEnabled = !currentManualFocusEnabled;
      if ( !nextManualFocusEnabled ) {
        manualFocusEnabledRef.current = false;
        resetCameraFocus();
      } else {
        manualFocusEnabledRef.current = true;
        queueManualFocus( manualFocusValueRef.current );
      }
      return nextManualFocusEnabled;
    } );
  }, [queueManualFocus, resetCameraFocus] );

  const updateManualFocusValue = useCallback( ( focusValue: number ) => {
    manualFocusValueRef.current = focusValue;
    setManualFocusValue( focusValue );
    if ( manualFocusEnabled ) {
      queueManualFocus( focusValue );
    }
  }, [manualFocusEnabled, queueManualFocus] );

  useEffect( () => {
    if ( !supportsManualFocus && manualFocusEnabled ) {
      setManualFocusEnabled( false );
      return;
    }
    if ( manualFocusEnabled ) {
      queueManualFocus( manualFocusValueRef.current );
    } else {
      resetCameraFocus();
    }
  }, [device?.id, manualFocusEnabled, queueManualFocus, resetCameraFocus, supportsManualFocus] );

  const toggleFocusPeaking = useCallback( () => {
    setFocusPeakingEnabled( currentFocusPeakingEnabled => !currentFocusPeakingEnabled );
  }, [] );

  const updateFocusPeakingSensitivity = useCallback( ( sensitivity: number ) => {
    setFocusPeakingSensitivity( Math.min( Math.max( sensitivity, 0 ), 1 ) );
  }, [] );

  const toggleDigitalStabilization = useCallback( () => {
    setDigitalStabilizationEnabled( currentDigitalStabilizationEnabled => !currentDigitalStabilizationEnabled );
  }, [] );

  const togglePhotoHdr = useCallback( () => {
    setPhotoHdrEnabled( currentPhotoHdrEnabled => !currentPhotoHdrEnabled );
  }, [] );

  const toggleFlash = ( ) => {
    if ( hasTorch ) {
      setTorch( currentTorch => {
        const nextTorch = currentTorch === "on" ? "off" : "on";
        setVisibleToast( nextTorch === "on" ? TOAST.FLASH_ON : TOAST.FLASH_OFF );
        return nextTorch;
      } );
      return;
    }

    setTakePhotoOptions( previousOptions => {
      const nextFlash = previousOptions.flash === "on" ? "off" : "on";
      setVisibleToast( nextFlash === "on" ? TOAST.FLASH_ON : TOAST.FLASH_OFF );
      return {
        ...previousOptions,
        flash: nextFlash,
      };
    } );
  };

  const updateError = useCallback( ( err: string | null, errEvent?: string ) => {
    // don't update error on first camera load
    if ( err === null && error === null ) {
      return;
    }
    dispatch( { type: ACTION.ERROR, error: err, errorEvent: errEvent } );
  }, [error] );

  const handleRecoverableCameraError = useCallback( ( reason?: string ) => {
    if ( cameraRecoveryTimeoutRef.current ) {
      return;
    }

    const nextAttempt = cameraRecoveryAttemptsRef.current + 1;
    if ( nextAttempt > MAX_CAMERA_RECOVERY_ATTEMPTS ) {
      updateError( "camera", reason );
      return;
    }

    cameraRecoveryAttemptsRef.current = nextAttempt;
    setCameraRecovering( true );
    cameraRecoveryTimeoutRef.current = setTimeout( () => {
      cameraRecoveryTimeoutRef.current = null;
      setCameraRecoveryCycle( cycle => cycle + 1 );
      setCameraRecovering( false );
      updateError( null );
    }, CAMERA_RECOVERY_DELAY_MS * nextAttempt );
  }, [updateError] );

  const handleCameraStarted = useCallback( () => {
    cameraRecoveryAttemptsRef.current = 0;
    setCameraRecovering( false );
    clearCameraRecoveryTimeout();
    updateError( null );
  }, [clearCameraRecoveryTimeout, updateError] );

  const navigateToResults = useCallback( async ( uri: string, predictions: Prediction[] ) => {
    const userImage = {
      time: createTimestamp( ), // add current time to AR camera photos
      uri,
      predictions,
    };

    // AR camera photos don't come with a location
    // especially when user has location permissions off
    // this is also needed for ancestor screen, species nearby
    const { image, errorCode } = await fetchImageLocationOrErrorCode( userImage, login );
    const hasCoordinates = isNumber( image?.latitude ) && isNumber( image?.longitude );
    logToApi( {
      level: LogLevels.INFO,
      message: `hasCoordinates ${hasCoordinates}`,
      context: "takePhoto",
    } ).catch( ( logError ) => logger.error( "logToApi failed:", logError ) );
    const rankLevel = image?.predictions.sort( ( a, b ) => a.rank_level - b.rank_level )[0]?.rank_level || 100;
    logToApi( {
      level: LogLevels.INFO,
      message: `rankLevel ${rankLevel}`,
      context: "takePhoto rankLevel",
    } ).catch( ( logError ) => logger.error( "logToApi failed:", logError ) );
    logger.debug( "fetchImageLocationOrErrorCode resolved" );
    const imageWithMetadata: ObservationImage = {
      ...image,
      errorCode,
      arCamera: true,
      latitude: image.latitude ?? null,
      longitude: image.longitude ?? null,
    };
    startObservationWithImage( imageWithMetadata, () => {
      navigation.navigate( "Drawer", {
        screen: "Match",
      } );
    } );
  }, [startObservationWithImage, navigation, login] );

  const handleCameraRollSaveError = useCallback( async ( uri: string, predictions: Prediction[], e: unknown ) => {
    // react-native-cameraroll does not yet have granular detail about read vs. write permissions
    // but there's a pull request for it as of March 2021

    await showCameraSaveFailureAlert( e, uri );
    navigateToResults( uri, predictions );
  }, [navigateToResults] );

  const savePhoto = useCallback( async ( photo: HandledPhoto ) => {
    // One quirk of CameraRoll is that if you want to write to an album, you
    // need readwrite permission, but since version 2.17.0 we don't want to
    // ask for that anymore, and use *add only* permission only.
    CameraRoll.save( photo.uri, { } )
      .then( ( uri: string ) => {
        logger.debug( "CameraRoll.save resolved" );
        // A placeholder uri means we don't know the real URI, probably b/c we
        // only had write permission so we were able to write the photo to the
        // camera roll but not read anything about it. Keep in mind this is just
        // a hack around a bug in CameraRoll. See our fork of @react-native-camera-roll
        const uriForResults = ( uri && !uri.match( /placeholder/ ) ) ? uri : photo.uri;
        navigateToResults( uriForResults, photo.predictions );
      } )
      .catch( ( e ) => handleCameraRollSaveError( photo.uri, photo.predictions, e ) );
  }, [handleCameraRollSaveError, navigateToResults] );

  const filterByTaxonId = useCallback( ( id: string | null, filter: boolean ) => {
    dispatch( { type: ACTION.FILTER_TAXON, taxonId: id, negativeFilter: filter } );
  }, [] );

  const handleTaxaDetected = ( event: { predictions: Prediction[] } ) => {
    const { predictions } = event;

    if ( pictureTaken.value ) {
      return;
    }
    if ( predictions && !cameraLoaded.value ) {
      cameraLoaded.value = true;
    }

    // Find species prediction
    const speciesPredictions = predictions.filter( p => p.rank === "species" );
    const topSpeciesScore = speciesPredictions.reduce(
      ( max, p ) => Math.max( max, p.combined_score || 0 ),
      0
    );

    // don't bother with trying to set predictions if a species timeout is in place,
    // unless a new result comes in with notably higher confidence than the frozen one
    if ( speciesTimeoutSet.value ) {
      if ( topSpeciesScore > frozenSpeciesScore.value + 10 ) {
        // interrupt the freeze early for the more confident result
        if ( speciesTimeoutId.current ) {
          clearTimeout( speciesTimeoutId.current );
          speciesTimeoutId.current = null;
        }
        speciesTimeoutSet.value = false;
      } else {
        return;
      }
    }

    // not looking at kingdom or phylum as we are currently not displaying results for those ranks
    const wantedRanks = ["species", "genus", "family", "order", "class"];
    let wantedPredictions = predictions.filter( p => (
      typeof p.rank === "string" && wantedRanks.includes( p.rank )
    ) );
    const unwantedTaxa = [1044608, 1044607, 973699, 152504, 1128037];
    wantedPredictions = wantedPredictions.filter( p => !unwantedTaxa.includes( p.taxon_id ) );

    dispatch( { type: ACTION.SET_PREDICTIONS, predictions: wantedPredictions } );

    if ( speciesPredictions.length > 0 ) {
      // this block keeps the last species seen displayed for 1 second
      speciesTimeoutSet.value = true;
      frozenSpeciesScore.value = topSpeciesScore;
      if ( speciesTimeoutId.current ) {
        clearTimeout( speciesTimeoutId.current );
      }
      speciesTimeoutId.current = setTimeout( () => {
        speciesTimeoutSet.value = false;
        speciesTimeoutId.current = null;
      }, 1000 );
    }
  };

  const handleCameraError = ( event: ErrorMessage ) => {
    const permissions = "Camera Input Failed: This app is not authorized to use Back Camera.";
    // iOS camera permissions error is handled by handleCameraError, not permission missing
    if ( error === "device" ) {
      // do nothing if there is already a device error
      return;
    }

    if ( event.nativeEvent.error === permissions ) {
      updateError( "permissions" );
    } else {
      updateError( "camera", event.nativeEvent.error );
    }
  };

  const handleClassifierError = ( event: ErrorMessage ) => {
    if ( event.nativeEvent && event.nativeEvent.error ) {
      updateError( "classifier", event.nativeEvent.error );
    } else {
      updateError( "classifier" );
    }
  };

  const handleDeviceNotSupported = ( event: ReasonMessage ) => {
    if ( event.nativeEvent && event.nativeEvent.reason ) {
      updateError( "device", event.nativeEvent.reason );
    } else {
      updateError( "device", checkForSystemVersion( ) );
    }
  };

  const handleCaptureError = useCallback( ( event: ReasonMessage ) => {
    setIsCaptureInProgress( false );
    pictureTaken.value = false;
    if ( event.nativeEvent && event.nativeEvent.reason ) {
      updateError( "take", event.nativeEvent.reason );
    } else {
      updateError( "take" );
    }
  }, [pictureTaken, updateError] );

  const handleNativeShutter = useCallback( () => {
    pictureTaken.value = true;
    setIsCaptureInProgress( true );
  }, [pictureTaken] );

  const requestAndroidSavePermissions = useCallback( ( photo: HandledPhoto ) => {
    const checkPermissions = async ( ) => {
      const result = await checkSavePermissions( );
      logger.debug( `checkSavePermission resolved with: ${result}` );

      if ( result === "gallery" ) {
        savePhoto( photo );
      } else {
        savePhoto( photo );
      }
    };
    // on Android, this permission check will pop up every time; on iOS it only pops up first time a user opens camera
    checkPermissions( );
  }, [savePhoto] );

  const visionCameraTakePhoto = useCallback( async ( callback: ( photo: HandledPhoto ) => void | Promise<void> ) => {
    if ( !camera.current ) {
      return;
    }

    // Local copy of all predictions, so we can pass them to the photo after taking it
    const predictions: Prediction[] = [...sortedPredictions];

    camera.current.takePhoto( takePhotoOptions ).then( async ( photo ) => {
      // pauseAfterCapture: true, would pause the classifier after taking a photo in legacy camera
      // setting the camera as inactive here is the closest thing to that, although there is a small delay visible
      // TODO: if the delay is too frustrating to users we would need to patch this into react-native-vision-camera directly
      setIsActive( false );
      const uri = Platform.OS === "android" && !photo.path.startsWith( "file://" )
        ? `file://${photo.path}`
        : photo.path;
      // Use last prediction as the prediction for the photo, in legacy camera this was given by the classifier callback
      const handledPhoto: HandledPhoto = {
        ...photo,
        predictions,
        uri,
      };
      // Photo:
      /*
        {
          "height": 2268,
          "isRawPhoto": false,
          "metadata": {"Orientation": 6, "{Exif}": {"ApertureValue": 1.16, "BrightnessValue": 2.15, "ColorSpace": 1, "DateTimeDigitized": "2023:02:24 16:20:13", "DateTimeOriginal": "2023:02:24 16:20:13", "ExifVersion": "0220", "ExposureBiasValue": 0, "ExposureMode": 0, "ExposureProgram": 2, "ExposureTime": 0.02, "FNumber": 1.5, "Flash": 0, "FocalLenIn35mmFilm": 26, "FocalLength": 4.3, "ISOSpeedRatings": [Array], "LensMake": null, "LensModel": null, "LensSpecification": [Array], "MeteringMode": 2, "OffsetTime": null, "OffsetTimeDigitized": null, "OffsetTimeOriginal": null, "PixelXDimension": 4032, "PixelYDimension": 2268, "SceneType": 1, "SensingMethod": 1, "ShutterSpeedValue": 5.64, "SubjectArea": [Array], "SubsecTimeDigitized": "0669", "SubsecTimeOriginal": "0669", "WhiteBalance": 0}, "{TIFF}": {"DateTime": "2023:02:24 16:20:13", "Make": "samsung", "Model": "SM-G960F", "ResolutionUnit": 2, "Software": "G960FXXUHFVG4", "XResolution": 72, "YResolution": 72}},
          "path": "/data/user/0/org.inaturalist.seek/cache/mrousavy4533849973631201605.jpg",
          "width": 4032
        }
      */
      /*
        {
          "deviceOrientation": 6,
          "height": 2268,
          "isRawPhoto": false,
          "metadata": {"Orientation": 6, "{Exif}": {"ApertureValue": 1.16, "BrightnessValue": 1.95, "ColorSpace": 1, "DateTimeDigitized": "2023:05:25 17:58:49", "DateTimeOriginal": "2023:05:25 17:58:49", "ExifVersion": "0220", "ExposureBiasValue": 0, "ExposureMode": 0, "ExposureProgram": 2, "ExposureTime": 0.02, "FNumber": 1.5, "Flash": 0, "FocalLenIn35mmFilm": 26, "FocalLength": 4.3, "ISOSpeedRatings": [Array], "LensMake": null, "LensModel": null, "LensSpecification": [Array], "MeteringMode": 2, "OffsetTime": null, "OffsetTimeDigitized": null, "OffsetTimeOriginal": null, "PixelXDimension": 4032, "PixelYDimension": 2268, "SceneType": 1, "SensingMethod": 1, "ShutterSpeedValue": 5.64, "SubjectArea": [Array], "SubsecTimeDigitized": "0257", "SubsecTimeOriginal": "0257", "WhiteBalance": 0}, "{TIFF}": {"DateTime": "2023:05:25 17:58:49", "Make": "samsung", "Model": "SM-G960F", "ResolutionUnit": 2, "Software": "G960FXXUHFVG4", "XResolution": 72, "YResolution": 72}},
          "path": "/data/user/0/org.inaturalist.seek/cache/mrousavy4494367485443724594.jpg",
          "pictureOrientation": 6,
          "predictions": [
            {"ancestor_ids": [Array], "name": "Liliopsida", "rank": 50, "combined_score": 93.01357269287109, "taxon_id": 47163},
            {"ancestor_ids": [Array], "name": "Asparagales", "rank": 40, "combined_score": 92.16688275337219, "taxon_id": 47218},
            {"ancestor_ids": [Array], "name": "Iridaceae", "rank": 30, "combined_score": 91.24458432197571, "taxon_id": 47781},
            {"ancestor_ids": [Array], "name": "Iris", "rank": 20, "combined_score": 87.44127750396729, "taxon_id": 47780}
          ],
          "uri": "/data/user/0/org.inaturalist.seek/cache/mrousavy4494367485443724594.jpg",
          "width": 4032
        }
      */

      // TODO: this callback only ever uses photo.uri and photo.predictions, so we can just pass those directly
      callback( handledPhoto );
    } )
    .catch( ( e ) => {
      logToApi( {
        level: LogLevels.ERROR,
        context: "ARCamera.tsx",
        message: e.message,
        errorType: e.constructor?.name,
        backtrace: e.stack,
      } );
      handleCaptureError( { nativeEvent: { reason: e } } );
    } );
  }, [sortedPredictions, handleCaptureError, takePhotoOptions] );

  const takePicture = useCallback( async () => {
    pictureTaken.value = true;
    setIsCaptureInProgress( true );

    if ( Platform.OS === "ios" ) {
      await visionCameraTakePhoto( ( photo: HandledPhoto ) => savePhoto( photo ) );
    } else if ( Platform.OS === "android" ) {
      await visionCameraTakePhoto( ( photo: HandledPhoto ) => requestAndroidSavePermissions( photo ) );
    }
  }, [
    savePhoto,
    requestAndroidSavePermissions,
    visionCameraTakePhoto,
    pictureTaken,
  ] );

  // Queue drafts always store full-precision coordinates; truncation for
  // logged-out users only applies at display/upload time, not at persistence.
  const fetchSaveForLaterCoords = useCallback( async ( ): Promise<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  }> => {
    const emptyCoords = { latitude: null, longitude: null, accuracy: null };
    try {
      if ( Platform.OS === "android" ) {
        const permissionAndroid = await checkLocationPermissions( );
        if ( permissionAndroid !== true ) {
          return emptyCoords;
        }
      }
      return await fetchUserLocation( );
    } catch ( locationError ) {
      logger.debug( "saveForLater location unavailable:", locationError );
      return emptyCoords;
    }
  }, [] );

  // "Save for Later": persist the photo + current GPS + timestamp to the local
  // observation queue without running classification, then stay on the camera.
  const saveForLaterToQueue = useCallback( async ( uri: string ) => {
    try {
      const time = createTimestamp( );
      const coords = await fetchSaveForLaterCoords( );

      await saveQueuedObservation( coords, time, uri );

      const count = await getQueuedCount( );
      setQueueCount( count );
      setVisibleToast( TOAST.SAVED_FOR_LATER );
    } catch ( e ) {
      logger.error( "saveForLaterToQueue failed:", e );
      logToApi( {
        level: LogLevels.ERROR,
        context: "saveForLaterToQueue",
        message: e instanceof Error ? e.message : String( e ),
        backtrace: e instanceof Error ? e.stack : undefined,
      } ).catch( ( logError ) => logger.error( "logToApi failed:", logError ) );
    }
    // Always restore the camera state (the catch above swallows any error),
    // even when persisting the draft failed; otherwise the preview stays
    // frozen until the screen is re-entered.
    setIsActive( true );
    setIsCaptureInProgress( false );
    pictureTaken.value = false;
    dispatch( { type: ACTION.RESET_STATE } );
  }, [fetchSaveForLaterCoords, pictureTaken] );

  const saveForLaterPhoto = useCallback( ( photo: HandledPhoto ) => {
    // keep a copy in the user's camera roll, like a normal capture
    CameraRoll.save( photo.uri, { } ).catch( ( e ) => logger.warn( e ) );
    saveForLaterToQueue( photo.uri ).catch( ( e ) => logger.error( "saveForLaterToQueue rejected:", e ) );
  }, [saveForLaterToQueue] );

  const takePictureForLater = useCallback( async ( ) => {
    pictureTaken.value = true;
    setIsCaptureInProgress( true );
    await visionCameraTakePhoto( ( photo: HandledPhoto ) => saveForLaterPhoto( photo ) );
  }, [visionCameraTakePhoto, saveForLaterPhoto, pictureTaken] );

  const resetState = ( ) => {
    setIsCaptureInProgress( false );
    dispatch( { type: ACTION.RESET_STATE } );
  };

  const requestAndroidPermissions = useCallback( ( ) => {
    if ( Platform.OS === "android" ) {
      checkCameraPermissions( ).then( ( result ) => {
        if ( result === "permissions" ) {
          updateError( "permissions" );
        }
        updateError( null );
      } ).catch( e => console.log( e, "couldn't get camera permissions" ) );
    }
  }, [updateError] );

  const closeModal = useCallback( ( ) => setShowModal( false ), [] );

  // ARCamera stays mounted while blurred, so settings changed on the Settings
  // screen are re-read here on every focus (useFetchUserSettings only reads
  // once on mount and its API exposes no refetch).
  const refetchUserSettings = useCallback( async ( ) => {
    try {
      const realm = await Realm.open( realmConfig );
      const settings = realm.objects( "UserSettingsRealm" )[0] as unknown as {
        cameraViewportResolution?: string;
        photoQualityBalance?: string;
        confidenceThreshold?: number;
      } | undefined;
      if ( settings ) {
        // copy the fields used here instead of storing the live Realm object
        setRefetchedUserSettings( {
          cameraViewportResolution: settings.cameraViewportResolution,
          photoQualityBalance: settings.photoQualityBalance,
          confidenceThreshold: settings.confidenceThreshold,
        } );
      }
    } catch ( e ) {
      logger.warn( "could not refetch user settings:", e );
    }
  }, [] );

  useEffect( ( ) => {
    const checkForFirstCameraLaunch = async ( ) => {
      const isFirstLaunch = await checkIfCameraLaunched( );
      if ( isFirstLaunch ) {
        setShowModal( true );
      }
    };

    const unsubscribe = navigation.addListener( "focus", ( ) => {
      setObservation( null );
      // reset when camera loads, not when leaving page, for quicker transition
      resetState( );
      checkForFirstCameraLaunch( );
      requestAndroidPermissions( );
      refetchUserSettings( );
      getQueuedCount( ).then( setQueueCount ).catch( ( e ) => logger.warn( e ) );
    } );

    return unsubscribe;
  }, [navigation, refetchUserSettings, requestAndroidPermissions, setObservation] );

  useFocusEffect(
    useCallback( ( ) => {
      let active = true;

      if ( active ) {
        // reset user ability to post to iNat from Match Screen
        savePostingSuccess( false );
      }

      return ( ) => {
        active = false;
      };
    }, [] )
  );

  const navHome = ( ) => resetRouter( navigation );
  const navToSettings = () =>
    navigation.navigate( "Drawer", {
      screen: "Settings",
    } );
  const navToQueue = () =>
    navigation.navigate( "Drawer", {
      screen: "QueuedObservations",
    } );


  const confidenceThresholdNumber = ( typeof userSettings?.confidenceThreshold === "number" )
    ? userSettings.confidenceThreshold
    : 50;

  if ( !isFocused ) {
    // this is necessary for camera to load properly in iOS
    // if removed, it means a user will see a frozen camera preview the second
    // time they try to navigate to the camera (like, after the match screen)
    return null;
  }

  const renderCamera = () => {
    if ( !device ) {
      return null;
    }
    return (
      <FrameProcessorCamera
        key={cameraRecoveryCycle}
        cameraRef={camera}
        device={device}
        confidenceThreshold={confidenceThresholdNumber}
        onCameraError={handleCameraError}
        onCameraStarted={handleCameraStarted}
        // onCameraPermissionMissing was an empty callback
        onClassifierError={handleClassifierError}
        onDeviceNotSupported={handleDeviceNotSupported}
        onRecoverableCameraError={handleRecoverableCameraError}
        onCaptureError={handleCaptureError}
        onTaxaDetected={handleTaxaDetected}
        onLog={handleLog}
        // taxaDetectionInterval is set directly on the camera component with frameProcessorFps
        filterByTaxonId={taxonId}
        negativeFilter={negativeFilter}
        // type is replaced with logic in FrameProcessorCamera
        isActive={isActive && !cameraRecovering}
        manualFocusEnabled={manualFocusEnabled}
        digitalStabilizationEnabled={digitalStabilizationEnabled}
        focusPeakingEnabled={focusPeakingEnabled}
        focusPeakingSensitivity={focusPeakingSensitivity}
        viewportResolution={viewportResolution}
        photoQualityBalance={photoQualityBalance}
        photoHdrEnabled={photoHdrEnabled}
        torch={torch}
        zoom={cameraZoom || device.neutralZoom}
        useLocation={useLocation}
        hasPermission={hasPermission}
        onCaptureStarted={handleNativeShutter}
      />
    );
  };

  return (
    <View style={viewStyles.container}>
      {renderCamera()}
      <Modal
        showModal={showModal}
        closeModal={closeModal}
        modal={<WarningModal closeModal={closeModal} />}
      />
      {error ? (
        <CameraError error={error} errorEvent={errorEvent} />
      ) : (
        <ARCameraOverlay
          prediction={lowestRankPrediction}
          pictureTaken={isCaptureInProgress || pictureTaken.value}
          takePicture={takePicture}
          cameraLoaded={cameraLoaded.value}
          filterByTaxonId={filterByTaxonId}
          setIsActive={setIsActive}
          flipCamera={flipCamera}
          selectZoom={selectBackCameraZoom}
          canSelectZoom={canSelectZoom}
          selectedZoom={backCameraZoom}
          zoomPresets={backCameraZoomPresets}
          toggleManualFocus={toggleManualFocus}
          manualFocusEnabled={manualFocusEnabled}
          manualFocusValue={manualFocusValue}
          setManualFocusValue={updateManualFocusValue}
          supportsManualFocus={supportsManualFocus}
          focusPeakingEnabled={focusPeakingEnabled}
          toggleFocusPeaking={toggleFocusPeaking}
          focusPeakingSensitivity={focusPeakingSensitivity}
          setFocusPeakingSensitivity={updateFocusPeakingSensitivity}
          digitalStabilizationEnabled={digitalStabilizationEnabled}
          supportsDigitalStabilization={supportsDigitalStabilization}
          toggleDigitalStabilization={toggleDigitalStabilization}
          photoHdrEnabled={photoHdrEnabled && supportsPhotoHdr}
          supportsPhotoHdr={supportsPhotoHdr}
          togglePhotoHdr={togglePhotoHdr}
          hasFlash={hasFlash}
          hasTorch={hasTorch}
          torch={torch}
          takePhotoOptions={takePhotoOptions}
          toggleFlash={toggleFlash}
          visibleToast={visibleToast}
          toggleLocation={toggleLocation}
          useLocation={useLocation}
          handleToastEnd={handleToastEnd}
          saveForLater={takePictureForLater}
          queueCount={queueCount}
        />
      )}
      <TouchableOpacity
        accessibilityLabel={i18n.t( "accessibility.back" )}
        accessible
        onPress={navHome}
        style={[viewStyles.backButton, viewStyles.shadow]}
      >
        <Image source={icons.closeWhite} />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel={i18n.t( "menu.settings" )}
        accessible
        onPress={navToSettings}
        style={[viewStyles.settingsButton, viewStyles.shadow]}
      >
        <Image
          tintColor={colors.white}
          style={imageStyles.settingsIcon}
          source={icons.menuSettings}
        />
      </TouchableOpacity>
      {queueCount > 0 && (
        <TouchableOpacity
          accessibilityLabel={i18n.t( "queue.view_queue" )}
          accessible
          testID="queueIndicator"
          onPress={navToQueue}
          style={[viewStyles.queueButton, viewStyles.shadow]}
        >
          <Image
            tintColor={colors.white}
            style={imageStyles.settingsIcon}
            source={icons.checklist}
          />
          <View style={viewStyles.queueBadge}>
            <StyledText style={textStyles.queueBadgeText}>
              {queueCount}
            </StyledText>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ARCamera;
