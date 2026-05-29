import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type {
  CameraDevice,
  CameraRuntimeError,
  FormatFilter,
  Orientation,
} from "react-native-vision-camera";
import { useSharedValue, Worklets } from "react-native-worklets-core";

import {
  useIsForeground,
  useTruncatedUserCoords,
} from "../../../utility/customHooks";
import InatVision from "./helpers/visionPluginWrapper";
import { dirModel, dirGeomodel, dirTaxonomy } from "../../../utility/dirStorage";
import usePatchedRunAsync from "../../../utility/visionCameraPatches";

import {
  Camera,
  useCameraFormat,
  useFrameProcessor,
} from "./helpers/visionCameraWrapper";
import FocusSquare from "./FocusSquare";
import FocusPeakingOverlay from "./FocusPeakingOverlay";
import type { PeakingPoint } from "./FocusPeakingOverlay";
import useFocusTap from "./hooks/useFocusTap";
import { LogLevels, logToApi } from "../../../utility/apiCalls";
import {
  getPreferredVideoStabilizationMode,
} from "./helpers/cameraDeviceHelpers";
import { getFocusPeakingPoints } from "./helpers/focusPeakingPlugin";

export interface ErrorMessage {
  nativeEvent: {
    error?: string;
  };
}
export interface ReasonMessage {
  nativeEvent: {
    reason?: string;
  };
}
export interface LogMessage {
  nativeEvent: {
    log: string;
  };
}

interface Props {
  cameraRef: React.RefObject<Camera | null>;
  device: CameraDevice;
  confidenceThreshold: number;
  filterByTaxonId: string | null;
  negativeFilter: boolean;
  onTaxaDetected: ( result: InatVision.Result ) => void;
  onCameraError: ( error: ErrorMessage ) => void;
  onCameraStarted: ( ) => void;
  onDeviceNotSupported: ( error: ReasonMessage ) => void;
  onRecoverableCameraError: ( reason?: string ) => void;
  onClassifierError: ( error: ErrorMessage ) => void;
  onCaptureError: ( error: ReasonMessage ) => void;
  onLog: ( event: LogMessage ) => void;
  isActive: boolean;
  manualFocusEnabled: boolean;
  digitalStabilizationEnabled: boolean;
  focusPeakingEnabled: boolean;
  focusPeakingSensitivity: number;
  viewportResolution: {
    width: number;
    height: number;
    label: string;
  };
  photoHdrEnabled: boolean;
  torch: "off" | "on";
  zoom: number;
  useLocation: boolean;
  hasPermission: boolean;
  onCaptureStarted: ( ) => void;
  photoQualityBalance?: "speed" | "balanced" | "quality";
}

const PEAKING_SAMPLE_INTERVAL_MS = 33;
const PEAKING_MAX_SEGMENTS = 1200;
const PEAKING_MIN_THRESHOLD = 5;
const PEAKING_MAX_THRESHOLD = 34;
const PEAKING_SCAN_STRIDE = 2;
const PEAKING_MIN_RUN_LENGTH = 1;
const USE_NATIVE_FOCUS_PEAKING = Platform.OS === "android";

const orientationToDegrees = ( orientation: Orientation ): number => {
  "worklet";

  switch ( orientation ) {
    case "portrait":
      return 0;
    case "landscape-left":
      return 90;
    case "portrait-upside-down":
      return 180;
    case "landscape-right":
      return 270;
    default:
      return 0;
  }
};

const degreesToOrientation = ( degrees: number ): Orientation => {
  "worklet";

  const clampedDegrees = ( degrees + 360 ) % 360;
  if ( clampedDegrees >= 315 || clampedDegrees <= 45 ) {
    return "portrait";
  }
  if ( clampedDegrees > 45 && clampedDegrees <= 135 ) {
    return "landscape-left";
  }
  if ( clampedDegrees > 135 && clampedDegrees <= 225 ) {
    return "portrait-upside-down";
  }
  return "landscape-right";
};

const getRelativeOrientation = (
  frameOrientation: Orientation,
  previewOrientation: Orientation
): Orientation => {
  "worklet";

  return degreesToOrientation(
    orientationToDegrees( frameOrientation ) - orientationToDegrees( previewOrientation )
  );
};

const rotateNormalizedPoint = (
  x: number,
  y: number,
  orientation: Orientation,
  isMirrored: boolean
): { x: number; y: number } => {
  "worklet";

  let rotatedX = x;
  let rotatedY = y;

  switch ( orientation ) {
    case "landscape-left":
      rotatedX = y;
      rotatedY = 1 - x;
      break;
    case "landscape-right":
      rotatedX = 1 - y;
      rotatedY = x;
      break;
    case "portrait-upside-down":
      rotatedX = 1 - x;
      rotatedY = 1 - y;
      break;
    case "portrait":
    default:
      break;
  }

  return {
    x: isMirrored ? 1 - rotatedX : rotatedX,
    y: rotatedY,
  };
};

const getRotatedFrameSize = (
  frameWidth: number,
  frameHeight: number,
  orientation: Orientation
) => {
  "worklet";

  if ( orientation === "landscape-left" || orientation === "landscape-right" ) {
    return { width: frameHeight, height: frameWidth };
  }
  return { width: frameWidth, height: frameHeight };
};

const mapNormalizedPointToCoveredPreview = (
  x: number,
  y: number,
  sourceWidth: number,
  sourceHeight: number,
  previewWidth: number,
  previewHeight: number
): { x: number; y: number } => {
  "worklet";

  const safeSourceWidth = Math.max( sourceWidth, 1 );
  const safeSourceHeight = Math.max( sourceHeight, 1 );
  const safePreviewWidth = Math.max( previewWidth, 1 );
  const safePreviewHeight = Math.max( previewHeight, 1 );
  const scale = Math.max(
    safePreviewWidth / safeSourceWidth,
    safePreviewHeight / safeSourceHeight
  );
  const renderedWidth = safeSourceWidth * scale;
  const renderedHeight = safeSourceHeight * scale;
  const offsetX = ( renderedWidth - safePreviewWidth ) / 2;
  const offsetY = ( renderedHeight - safePreviewHeight ) / 2;

  return {
    x: ( ( x * renderedWidth ) - offsetX ) / safePreviewWidth,
    y: ( ( y * renderedHeight ) - offsetY ) / safePreviewHeight,
  };
};

const appendPeakingSegmentToPath = ( point: PeakingPoint ): string => {
  "worklet";

  const left = point.x * 1000;
  const top = point.y * 1000;
  const right = ( point.x + point.width ) * 1000;
  const bottom = ( point.y + point.height ) * 1000;

  if ( point.width >= point.height ) {
    const y = ( top + bottom ) / 2;
    return `M${left.toFixed( 1 )} ${y.toFixed( 1 )}H${right.toFixed( 1 )}`;
  }

  const x = ( left + right ) / 2;
  return `M${x.toFixed( 1 )} ${top.toFixed( 1 )}V${bottom.toFixed( 1 )}`;
};

const normalizePeakingPointsForPreviewPath = (
  points: PeakingPoint[],
  frameWidth: number,
  frameHeight: number,
  frameOrientation: Orientation,
  previewOrientation: Orientation,
  isMirrored: boolean,
  previewWidth: number,
  previewHeight: number
): string => {
  "worklet";

  const relativeOrientation = getRelativeOrientation( frameOrientation, previewOrientation );
  const rotatedFrameSize = getRotatedFrameSize( frameWidth, frameHeight, relativeOrientation );
  let path = "";

  for ( let index = 0; index < points.length; index += 1 ) {
    const point = points[index];
    const right = point.x + point.width;
    const bottom = point.y + point.height;
    const rotatedTopLeft = rotateNormalizedPoint( point.x, point.y, relativeOrientation, isMirrored );
    const rotatedTopRight = rotateNormalizedPoint( right, point.y, relativeOrientation, isMirrored );
    const rotatedBottomLeft = rotateNormalizedPoint( point.x, bottom, relativeOrientation, isMirrored );
    const rotatedBottomRight = rotateNormalizedPoint( right, bottom, relativeOrientation, isMirrored );
    const rotatedLeft = Math.min(
      rotatedTopLeft.x,
      rotatedTopRight.x,
      rotatedBottomLeft.x,
      rotatedBottomRight.x
    );
    const rotatedTop = Math.min(
      rotatedTopLeft.y,
      rotatedTopRight.y,
      rotatedBottomLeft.y,
      rotatedBottomRight.y
    );
    const rotatedRight = Math.max(
      rotatedTopLeft.x,
      rotatedTopRight.x,
      rotatedBottomLeft.x,
      rotatedBottomRight.x
    );
    const rotatedBottom = Math.max(
      rotatedTopLeft.y,
      rotatedTopRight.y,
      rotatedBottomLeft.y,
      rotatedBottomRight.y
    );
    const mappedTopLeft = mapNormalizedPointToCoveredPreview(
      rotatedLeft,
      rotatedTop,
      rotatedFrameSize.width,
      rotatedFrameSize.height,
      previewWidth,
      previewHeight
    );
    const mappedBottomRight = mapNormalizedPointToCoveredPreview(
      rotatedRight,
      rotatedBottom,
      rotatedFrameSize.width,
      rotatedFrameSize.height,
      previewWidth,
      previewHeight
    );
    const clippedLeft = Math.max( mappedTopLeft.x, 0 );
    const clippedTop = Math.max( mappedTopLeft.y, 0 );
    const clippedRight = Math.min( mappedBottomRight.x, 1 );
    const clippedBottom = Math.min( mappedBottomRight.y, 1 );
    const clippedWidth = clippedRight - clippedLeft;
    const clippedHeight = clippedBottom - clippedTop;

    if ( clippedWidth > 0 && clippedHeight > 0 ) {
      path += appendPeakingSegmentToPath( {
        x: clippedLeft,
        y: clippedTop,
        width: clippedWidth,
        height: clippedHeight,
        strength: point.strength,
      } );
    }
  }

  return path;
};

const FrameProcessorCamera = ( props: Props ) => {
  const {
    cameraRef,
    device,
    confidenceThreshold,
    filterByTaxonId,
    negativeFilter,
    onTaxaDetected,
    onCameraError,
    onCameraStarted,
    onDeviceNotSupported,
    onRecoverableCameraError,
    onClassifierError,
    onCaptureError,
    onLog,
    isActive,
    manualFocusEnabled,
    digitalStabilizationEnabled,
    focusPeakingEnabled,
    focusPeakingSensitivity,
    viewportResolution,
    photoHdrEnabled,
    torch,
    zoom,
    useLocation,
    hasPermission,
    onCaptureStarted,
    photoQualityBalance = "balanced",
  } = props;

  const navigation = useNavigation( );
  const isFocused = useIsFocused( );
  const isForeground = useIsForeground( );

  const coords = useTruncatedUserCoords( hasPermission );

  const framesProcessingTime = useRef<number[]>( [] );

  const [cameraPermissionStatus, setCameraPermissionStatus] = useState( "not-determined" );
  const requestCameraPermission = useCallback( async () => {
    // Checking camera permission status, if granted set it and return
    const status = Camera.getCameraPermissionStatus();
    if ( status === "granted" ) {
      setCameraPermissionStatus( status );
      return;
    }
    console.log( "Requesting camera permission..." );
    const permission = await Camera.requestCameraPermission();
    console.log( `Camera permission status: ${permission}` );

    if ( permission === "denied" ) {
      // If the user has not granted permission we have to show an error message
      // This string is returned from the legacy camera when the user has not granted the needed permissions
      // and expected by HOC to be received and reacted to
      const returnError: { nativeEvent: { error?: string } } = {
        nativeEvent: {
          error:
            "Camera Input Failed: This app is not authorized to use Back Camera.",
        },
      };
      onCameraError( returnError );
    }
    setCameraPermissionStatus( permission );
  }, [onCameraError] );

  useEffect( () => {
    if ( cameraPermissionStatus === "not-determined" ) {
      requestCameraPermission();
    }
  }, [cameraPermissionStatus, requestCameraPermission] );

  // Currently, we are asking for camera permission on focus of the screen, that results in one render
  // of the camera before permission is granted. This is to keep track and to throw error after the first error only.
  const [permissionCount, setPermissionCount] = useState( 0 );

  // Select the camera format based on the screen aspect ratio on ai camera as it is full-screen
  const screen = Dimensions.get( "screen" );
  const [previewLayout, setPreviewLayout] = useState( {
    width: screen.width,
    height: screen.height,
  } );
  const videoAspectRatio = screen.height / screen.width;
  const photoAspectRatio = screen.height / screen.width;
  const supportsPhotoHdr = device.formats.some( deviceFormat => deviceFormat.supportsPhotoHdr );
  const cameraFormatFilters = useMemo<FormatFilter[]>( () => [
    ...( photoHdrEnabled && supportsPhotoHdr
      ? [{ photoHdr: true }]
      : [] ),
    { videoResolution: { width: viewportResolution.width, height: viewportResolution.height } },
    { videoAspectRatio },
    { photoAspectRatio },
    { photoResolution: "max" as const },
    { autoFocusSystem: "phase-detection" },
  ], [photoAspectRatio, photoHdrEnabled, supportsPhotoHdr, videoAspectRatio, viewportResolution.height, viewportResolution.width] );
  const preferredFormat = useCameraFormat( device, cameraFormatFilters );
  const format = preferredFormat;
  const photoHdr = photoHdrEnabled && format?.supportsPhotoHdr === true;
  const formatStabilizationMode = getPreferredVideoStabilizationMode( format );
  const videoStabilizationMode = digitalStabilizationEnabled
    ? formatStabilizationMode
    : undefined;
  const useOverlayFocusPeaking = focusPeakingEnabled && !USE_NATIVE_FOCUS_PEAKING;
  const peakingThreshold = Math.round(
    PEAKING_MAX_THRESHOLD - (
      ( PEAKING_MAX_THRESHOLD - PEAKING_MIN_THRESHOLD ) * Math.min( Math.max( focusPeakingSensitivity, 0 ), 1 )
    )
  );

  useEffect( () => {
    onLog( {
      nativeEvent: {
        log: [
          `Camera device ${device.id}`,
          `format ${format ? `${format.videoWidth}x${format.videoHeight}` : "none"}`,
          `viewport ${viewportResolution.label}`,
          `stabilization ${videoStabilizationMode || "off"}`,
          `peaking ${USE_NATIVE_FOCUS_PEAKING ? "native-preview-shader" : `overlay threshold ${peakingThreshold}`}`,
        ].join( " | " ),
      },
    } );
  }, [
    device.id,
    format,
    onLog,
    peakingThreshold,
    viewportResolution.label,
    videoStabilizationMode,
  ] );

  // Set the exposure to the middle of the min and max exposure
  const exposure = ( device.maxExposure + device.minExposure ) / 2;

  useEffect( () => {
    const unsubscribeFocus = navigation.addListener( "focus", () => {
      InatVision.resetStoredResults();
    } );

    return unsubscribeFocus;
  }, [navigation] );

  useEffect( () => {
    const unsubscribeBlur = navigation.addListener( "blur", () => {
      InatVision.resetStoredResults();
    } );

    return unsubscribeBlur;
  }, [navigation] );

  useEffect( () => {
    if ( Platform.OS === "android" ) {
      InatVision.addLogListener( ( event: { log: string } ) => {
        const returnEvent = {
          nativeEvent: event,
        };
        onLog( returnEvent );
      } );
    }

    return () => {
      InatVision.removeLogListener();
    };
  }, [onLog] );

  const {
    animatedStyle,
    tapToFocus,
    tappedCoordinates,
  } = useFocusTap( props.cameraRef, device.supportsFocus && !manualFocusEnabled );

  const lastClassificationTimestamp = useSharedValue( 0 );
  const lastPeakingTimestamp = useSharedValue( 0 );
  const previewOrientation = useSharedValue<Orientation>( "portrait" );
  const fps = 1;
  const handleResult = Worklets.createRunOnJS( ( result: InatVision.Result, timeTaken: number ) => {
    framesProcessingTime.current.push( timeTaken );
    if ( framesProcessingTime.current.length >= 10 ) {
      const avgTime = framesProcessingTime.current.reduce( ( a, b ) => a + b, 0 ) / 10;
      framesProcessingTime.current = [];
      onLog( {
        nativeEvent: {
          log: `Average frame processing time over 10 frames: ${avgTime}ms`,
        },
      } );
    }
    onTaxaDetected( result );
  } );

  const handleError = Worklets.createRunOnJS( ( error: ErrorMessage ) => {
    onClassifierError( error );
  } );

  const peakingPathRef = useRef<any>( null );
  const handlePeakingPath = Worklets.createRunOnJS( ( path: string ) => {
    peakingPathRef.current?.setNativeProps( { d: path } );
  } );
  useEffect( () => {
    if ( !useOverlayFocusPeaking ) {
      peakingPathRef.current?.setNativeProps( { d: "" } );
    }
  }, [useOverlayFocusPeaking] );

  const patchedRunAsync = usePatchedRunAsync();
  const hasUserLocation = coords?.latitude != null && coords?.longitude != null;
  const useGeomodel = useLocation && hasUserLocation;
  // The vision-plugin has a function to look up the location of the user in a h3 gridded world
  // unfortunately, I was not able to run this new function in the worklets directly,
  // so we need to do this here before calling the frame processor hook.
  // For predictions from file this function runs in the vision-plugin code directly.
  const geoModelCellLocation = hasUserLocation
    ? InatVision.getCellLocation( coords )
    : null;
  const frameProcessor = useFrameProcessor(
    ( frame: any ) => {
      "worklet";

      // Reminder: this is a worklet, running on a C++ thread. Make sure to check the
      // react-native-worklets-core documentation for what is supported in those worklets.
      // If there is no lastTimestamp, i.e. the first time this runs do not compare
      const timestamp = Date.now();
      if ( useOverlayFocusPeaking ) {
        const timeSinceLastPeakingFrame = timestamp - lastPeakingTimestamp.value;
        if ( timeSinceLastPeakingFrame >= PEAKING_SAMPLE_INTERVAL_MS ) {
          // eslint-disable-next-line react-hooks/react-compiler
          lastPeakingTimestamp.value = timestamp;
          try {
            const rawPeakingPoints = getFocusPeakingPoints( frame, {
              scanStride: PEAKING_SCAN_STRIDE,
              minRunLength: PEAKING_MIN_RUN_LENGTH,
              threshold: peakingThreshold,
              maxSegments: PEAKING_MAX_SEGMENTS,
            } );
            handlePeakingPath( normalizePeakingPointsForPreviewPath(
              rawPeakingPoints,
              frame.width,
              frame.height,
              frame.orientation,
              previewOrientation.value,
              frame.isMirrored,
              previewLayout.width,
              previewLayout.height
            ) );
          } catch {
            handlePeakingPath( "" );
          }
        }
      }

      const timeSinceLastFrame = timestamp - lastClassificationTimestamp.value;
      if ( timeSinceLastFrame < 1000 / fps ) {
        return;
      }
      lastClassificationTimestamp.value = timestamp;
      patchedRunAsync( frame, () => {
        "worklet";
        try {
          const timeBefore = Date.now();
          const result = InatVision.inatVision( frame, {
            version: "2.13",
            modelPath: dirModel,
            taxonomyPath: dirTaxonomy,
            confidenceThreshold,
            filterByTaxonId,
            negativeFilter,
            useGeomodel,
            geomodelPath: dirGeomodel,
            location: {
              latitude: geoModelCellLocation?.latitude ?? 0,
              longitude: geoModelCellLocation?.longitude ?? 0,
              elevation: geoModelCellLocation?.elevation,
            },
          } );
          const timeAfter = Date.now();
          const timeTaken = timeAfter - timeBefore;
          handleResult( result, timeTaken );
        } catch ( classifierError ) {
          const message = classifierError instanceof Error
            ? classifierError.message
            : String( classifierError );
          // Currently the native side throws RuntimeException but that doesn't seem to arrive here over he bridge
          console.log( `Error: ${message}` );
          const returnError = {
            nativeEvent: { error: message },
          };
          handleError( returnError );
        }
      } );
      // ref={camera} was only used for takePictureAsync()
      // Johannes: I did a read though of the native code that is triggered when using ref.current.takePictureAsync()
      // and to me it seems everything should be handled by vision-camera itself. However, there is also some Exif and device orientation stuff going on.
      // related code that would need to be tested if it all is saved as expected.
    },
    [
      patchedRunAsync,
      confidenceThreshold,
      filterByTaxonId,
      negativeFilter,
      lastClassificationTimestamp,
      lastPeakingTimestamp,
      fps,
      hasUserLocation,
      geoModelCellLocation,
      useGeomodel,
      useOverlayFocusPeaking,
      peakingThreshold,
      handlePeakingPath,
      previewOrientation,
      previewLayout.height,
      previewLayout.width,
    ]
  );

  const onError = useCallback(
    ( error: CameraRuntimeError ) => {
      console.log( "error", error );
      logToApi( {
        level: LogLevels.ERROR,
        context: "FrameProcessorCamera.tsx",
        message: error.message,
        errorType: error.constructor?.name,
        backtrace: error.stack,
      } );
      let returnString: string = error.code;
      // If there is no error code, log the error and return because we don't know what to do with it
      if ( !error.code ) {
        console.log( "Camera runtime error without error code:" );
        console.log( "error", error );
        return;
      }
      if ( error.code === "device/camera-already-in-use" || error.code === "system/max-cameras-in-use" ) {
        onRecoverableCameraError( error.code );
        return;
      }

      // If it is a "device/" error, return the error code
      if ( error.code.includes( "device/" ) ) {
        const returnReason: { nativeEvent: { reason?: string } } = {
          nativeEvent: { reason: error.code },
        };
        onDeviceNotSupported( returnReason );
        return;
      }

      if ( error.code.includes( "capture/" ) ) {
        const returnReason: { nativeEvent: { reason?: string } } = {
          nativeEvent: { reason: error.code },
        };
        onCaptureError( returnReason );
        return;
      }

      // If the error code is "frame-processor/unavailable" handle the error as classifier error
      if ( returnString === "frame-processor/unavailable" ) {
        const returnError: { nativeEvent: { error?: string } } = {
          nativeEvent: { error: error.code },
        };
        onClassifierError( returnError );
        return;
      }

      // If the error code is "permission/" return the legacy code for permission errors
      if ( error.code.includes( "permission/" ) ) {
        if ( error.code === "permission/camera-permission-denied" ) {
          // Currently, we are asking for camera permission on focus of the screen, that results in one render
          // of the camera before permission is granted. If the permission is denied, this error happens twice,
          // so we are ignoring the first one.
          if ( permissionCount === 0 ) {
            setPermissionCount( permissionCount + 1 );
            return;
          }
        }
        // This string is returned from the legacy camera when the user has not granted the needed permissions
        // and expected by HOC to be received and reacted to
        const permissions =
          "Camera Input Failed: This app is not authorized to use Back Camera.";
        returnString = permissions;
      }

      const returnError: { nativeEvent: { error?: string } } = {
        nativeEvent: { error: returnString },
      };
      onCameraError( returnError );
    },
    [
      permissionCount,
      onCameraError,
      onDeviceNotSupported,
      onRecoverableCameraError,
      onClassifierError,
      onCaptureError,
    ]
  );

  const active = isActive && isFocused && isForeground;
  const handlePreviewOrientationChanged = useCallback( ( nextPreviewOrientation: Orientation ) => {
    previewOrientation.value = nextPreviewOrientation;
  }, [previewOrientation] );
  const handlePreviewLayout = useCallback( ( event: LayoutChangeEvent ) => {
    const { width, height } = event.nativeEvent.layout;
    setPreviewLayout( currentLayout => {
      if ( Math.abs( currentLayout.width - width ) < 1 && Math.abs( currentLayout.height - height ) < 1 ) {
        return currentLayout;
      }

      return { width, height };
    } );
  }, [] );

  return (
    device && cameraPermissionStatus === "granted" && (
      <View onLayout={handlePreviewLayout} style={StyleSheet.absoluteFill}>
        <GestureDetector gesture={Gesture.Simultaneous( tapToFocus )}>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            format={format}
            exposure={exposure}
            isActive={active}
            photo={true}
            video={formatStabilizationMode != null}
            photoHdr={photoHdr}
            torch={torch}
            enableZoomGesture
            zoom={zoom}
            frameProcessor={frameProcessor}
            pixelFormat="yuv"
            enableBufferCompression={false}
            onError={onError}
            onStarted={onCameraStarted}
            onShutter={onCaptureStarted}
            outputOrientation="device"
            photoQualityBalance={photoQualityBalance}
            videoStabilizationMode={videoStabilizationMode}
            focusPeakingEnabled={USE_NATIVE_FOCUS_PEAKING}
            focusPeakingActive={USE_NATIVE_FOCUS_PEAKING && focusPeakingEnabled}
            focusPeakingSensitivity={focusPeakingSensitivity}
            enableLocation={hasPermission}
            onPreviewOrientationChanged={handlePreviewOrientationChanged}
            androidPreviewViewType="surface-view"
          />
        </GestureDetector>
        <FocusSquare
          animatedStyle={animatedStyle}
          tappedCoordinates={tappedCoordinates}
        />
        <FocusPeakingOverlay
          pathRef={peakingPathRef}
          visible={useOverlayFocusPeaking}
        />
      </View>
    )
  );
};

export default FrameProcessorCamera;
