import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import i18n from "../../../i18n";
import { viewStyles, textStyles } from "../../../styles/camera/arCameraOverlay";
import icons from "../../../assets/icons";
import { setCameraHelpText } from "../../../utility/textHelpers";
import LoadingWheel from "../../UIComponents/LoadingWheel";
import ARCameraHeader from "./ARCameraHeader";
import GreenRectangle from "../../UIComponents/GreenRectangle";
import { colors } from "../../../styles/global";
import { useFetchUserSettings } from "../../../utility/customHooks/useFetchUserSettings";
import ToastAnimation from "../../UIComponents/ToastAnimation";
import StyledText from "../../UIComponents/StyledText";
import TouchableOpacityWithDebounce from "../../UIComponents/Buttons/TouchableOpacityWithDebounce";
import { useAppOrientation } from "../../Providers/AppOrientationProvider";
import { baseTextStyles } from "../../../styles/textStyles";
import GalleryButton from "./GalleryButton";
import Flash from "./Flash";
import CameraFlip from "./CameraFlip";
import CameraZoomPresets from "./CameraZoomPresets";
import FocusModeSwitch from "./FocusModeSwitch";
import FocusPeakingToggle from "./FocusPeakingToggle";
import HdrToggle from "./HdrToggle";
import ManualFocusSlider from "./ManualFocusSlider";
import FocusPeakingSensitivitySlider from "./FocusPeakingSensitivitySlider";
import StabilizationToggle from "./StabilizationToggle";
import Location from "./Location";
import type { TakePhotoOptions } from "react-native-vision-camera";
import ToastAnimationWithText from "../../UIComponents/ToastAnimationWithText";
import { TOAST } from "./ARCamera";
import type { BackCameraZoomPreset } from "./helpers/cameraDeviceHelpers";

interface Prediction {
  name: string;
  taxon_id: number;
  rank_level: number;
  rank?: string;
  combined_score: number;
  ancestor_ids: number[];
}

interface Props {
  takePicture: ( ) => void;
  prediction?: Prediction;
  pictureTaken: boolean;
  cameraLoaded: boolean;
  filterByTaxonId: ( taxonId: string | null, negativeFilter: boolean ) => void;
  setIsActive: ( arg0: boolean ) => void;
  flipCamera: ( ) => void;
  selectZoom: ( zoom: number ) => void;
  canSelectZoom: boolean;
  selectedZoom: number;
  zoomPresets: BackCameraZoomPreset[];
  toggleManualFocus: ( ) => void;
  manualFocusEnabled: boolean;
  manualFocusValue: number;
  setManualFocusValue: ( focusValue: number ) => void;
  supportsManualFocus: boolean;
  focusPeakingEnabled: boolean;
  toggleFocusPeaking: ( ) => void;
  focusPeakingSensitivity: number;
  setFocusPeakingSensitivity: ( sensitivity: number ) => void;
  digitalStabilizationEnabled: boolean;
  supportsDigitalStabilization: boolean;
  toggleDigitalStabilization: ( ) => void;
  photoHdrEnabled: boolean;
  supportsPhotoHdr: boolean;
  togglePhotoHdr: ( ) => void;
  toggleFlash: ( ) => void;
  hasFlash?: boolean;
  hasTorch?: boolean;
  torch: "off" | "on";
  takePhotoOptions: TakePhotoOptions;
  visibleToast: TOAST;
  toggleLocation: ( ) => void;
  useLocation: boolean;
  handleToastEnd: ( ) => void;
  saveForLater: ( ) => void;
  queueCount: number;
}

const isAndroid = Platform.OS === "android";

const ARCameraOverlay = ( {
  takePicture,
  prediction,
  pictureTaken,
  cameraLoaded,
  filterByTaxonId,
  setIsActive,
  flipCamera,
  selectZoom,
  canSelectZoom,
  selectedZoom,
  zoomPresets,
  toggleManualFocus,
  manualFocusEnabled,
  manualFocusValue,
  setManualFocusValue,
  supportsManualFocus,
  focusPeakingEnabled,
  toggleFocusPeaking,
  focusPeakingSensitivity,
  setFocusPeakingSensitivity,
  digitalStabilizationEnabled,
  supportsDigitalStabilization,
  toggleDigitalStabilization,
  photoHdrEnabled,
  supportsPhotoHdr,
  togglePhotoHdr,
  toggleFlash,
  hasFlash,
  hasTorch,
  torch,
  takePhotoOptions,
  visibleToast,
  toggleLocation,
  useLocation,
  handleToastEnd,
  saveForLater,
  queueCount,
}: Props ) => {
  const { isLandscape } = useAppOrientation( );
  const { navigate } = useNavigation( );
  const rankToRender = prediction?.rank;
  const helpText = setCameraHelpText( rankToRender );
  const userSettings = useFetchUserSettings( );
  const autoCapture = userSettings?.autoCapture;
  const [filterIndex, setFilterIndex] = useState<number | null>( null );

  const settings = useMemo( ( ) => ( [
    {
      negativeFilter: true,
      taxonId: null,
      text: i18n.t( "camera.filters_off" ),
      icon: icons.plantFilterOff,
      color: colors.cameraFilterGray,
    },
    {
      negativeFilter: false,
      taxonId: "47126",
      text: i18n.t( "camera.plant_filter" ),
      icon: icons.plantsFilter,
      color: null,
    },
    {
      negativeFilter: true,
      taxonId: "47126",
      text: i18n.t( "camera.non_plant_filter" ),
      icon: icons.nonPlantsFilter,
      color: colors.seekTeal,
    },
  ] ), [] );

  const toggleFilterIndex = ( ) => {
    if ( filterIndex === null ) {
      setFilterIndex( 1 );
    } else if ( filterIndex < 2 ) {
      setFilterIndex( filterIndex + 1 );
    } else {
      setFilterIndex( 0 );
    }
  };

  useEffect( ( ) => {
    let isCurrent = true;
    if ( filterIndex && isCurrent ) {
      filterByTaxonId( settings[filterIndex].taxonId, settings[filterIndex].negativeFilter );
    }
    return ( ) => {
      isCurrent = false;
    };
  }, [filterIndex, filterByTaxonId, settings] );

  useEffect( ( ) => {
    let isCurrent = true;
    if ( rankToRender === "species" && autoCapture && isCurrent && !pictureTaken ) {
      takePicture( );
    }
    return ( ) => {
      isCurrent = false;
    };
  }, [rankToRender, takePicture, autoCapture, pictureTaken] );

  const showFilterText = ( ) => {
    if ( filterIndex === 0 || filterIndex === null ) {
      return;
    }

    return (
      <View style={viewStyles.plantFilter}>
        <GreenRectangle text={settings[filterIndex].text} color={settings[filterIndex].color} />
      </View>
    );
  };

  const showCameraHelp = ( ) => navigate( "CameraHelp" );

  const setTaxonomicRankColorStyles = ( ) => {
    if ( isLandscape ) {
      if ( rankToRender === "species" ) {
        return [viewStyles.landscapeHelpBubble, viewStyles.landscapeHelpBubbleSpecies];
      } else {
        return viewStyles.landscapeHelpBubble;
      }
    }
    return viewStyles.helpBubble;
  };

  return (
    <>
      {( pictureTaken || !cameraLoaded ) && <LoadingWheel color={colors.white} />}
      <ARCameraHeader prediction={prediction} />
      <View
        style={
          !isLandscape
            ? viewStyles.secondaryCameraControlsContainer
            : viewStyles.secondaryCameraControlsContainerLandscape
        }
      >
        <CameraFlip
          flipCamera={flipCamera}
        />
        {/* Manual focus, focus peaking and stabilization are backed by
            Android-only native patches, so their controls are hidden on iOS */}
        {isAndroid && supportsManualFocus && (
          <FocusModeSwitch
            manualFocusEnabled={manualFocusEnabled}
            toggleManualFocus={toggleManualFocus}
          />
        )}
        {isAndroid && (
          <FocusPeakingToggle
            focusPeakingEnabled={focusPeakingEnabled}
            toggleFocusPeaking={toggleFocusPeaking}
          />
        )}
        {isAndroid && supportsDigitalStabilization && (
          <StabilizationToggle
            digitalStabilizationEnabled={digitalStabilizationEnabled}
            toggleDigitalStabilization={toggleDigitalStabilization}
          />
        )}
        {supportsPhotoHdr && (
          <HdrToggle
            photoHdrEnabled={photoHdrEnabled}
            togglePhotoHdr={togglePhotoHdr}
          />
        )}
        <Flash
          toggleFlash={toggleFlash}
          hasFlash={hasFlash}
          hasTorch={hasTorch}
          torch={torch}
          takePhotoOptions={takePhotoOptions}
        />
        <Location
          toggleLocation={toggleLocation}
          useLocation={useLocation}
        />
      </View>
      {isAndroid && visibleToast === TOAST.NONE && showFilterText( )}
      {( isAndroid && filterIndex === 0 ) && (
        <ToastAnimation
          testID="filterOffToast"
          visible={filterIndex === 0}
          styles={viewStyles.plantFilter}
          toastText={settings[filterIndex].text}
          rectangleColor={settings[filterIndex].color}
        />
      )}
      <ToastAnimationWithText
        testID="locationOnToast"
        visible={visibleToast === TOAST.LOCATION_ON}
        finishAnimation={handleToastEnd}
        styles={viewStyles.plantFilter}
        textStyles={[
          baseTextStyles.buttonSmall,
          textStyles.scanText,
          !isLandscape && textStyles.textShadow,
        ]}
        helpText={i18n.t( "camera.best_for_wild_organisms" )}
        toastText={i18n.t( "camera.using_location" )}
        rectangleColor={colors.plantsFilter}
      />
      <ToastAnimationWithText
        testID="locationOffToast"
        visible={visibleToast === TOAST.LOCATION_OFF}
        finishAnimation={handleToastEnd}
        styles={viewStyles.plantFilter}
        textStyles={[
          baseTextStyles.buttonSmall,
          textStyles.scanText,
          !isLandscape && textStyles.textShadow,
        ]}
        helpText={i18n.t( "camera.best_for_captive_organisms" )}
        toastText={i18n.t( "camera.not_using_location" )}
        rectangleColor={colors.plantsFilter}
      />
      <ToastAnimation
        testID="flashOnToast"
        visible={visibleToast === TOAST.FLASH_ON}
        finishAnimation={handleToastEnd}
        styles={viewStyles.plantFilter}
        toastText={i18n.t( "camera.flash_on" )}
        rectangleColor={colors.plantsFilter}
      />
      <ToastAnimation
        testID="flashOffToast"
        visible={visibleToast === TOAST.FLASH_OFF}
        finishAnimation={handleToastEnd}
        styles={viewStyles.plantFilter}
        toastText={i18n.t( "camera.flash_off" )}
        rectangleColor={colors.plantsFilter}
      />
      <ToastAnimation
        testID="savedForLaterToast"
        visible={visibleToast === TOAST.SAVED_FOR_LATER}
        finishAnimation={handleToastEnd}
        styles={viewStyles.plantFilter}
        toastText={i18n.t( "queue.saved_pending", { count: queueCount } )}
        rectangleColor={colors.seekGreen}
      />
      <View style={setTaxonomicRankColorStyles( )}>
        <StyledText style={[baseTextStyles.buttonSmall, textStyles.scanText, !isLandscape && textStyles.textShadow]}>{helpText}</StyledText>
      </View>
      {isAndroid && manualFocusEnabled && supportsManualFocus && (
        <View
          style={
            isLandscape
              ? viewStyles.manualFocusSliderContainerLandscape
              : viewStyles.manualFocusSliderContainer
          }
        >
          <ManualFocusSlider
            focusValue={manualFocusValue}
            setFocusValue={setManualFocusValue}
          />
        </View>
      )}
      {isAndroid && focusPeakingEnabled && (
        <View
          style={
            isLandscape
              ? viewStyles.peakingSensitivitySliderContainerLandscape
              : viewStyles.peakingSensitivitySliderContainer
          }
        >
          <FocusPeakingSensitivitySlider
            sensitivity={focusPeakingSensitivity}
            setSensitivity={setFocusPeakingSensitivity}
          />
        </View>
      )}
      {canSelectZoom && (
        <View
          style={
            isLandscape
              ? viewStyles.cameraZoomPresetsContainerLandscape
              : viewStyles.cameraZoomPresetsContainer
          }
        >
          <CameraZoomPresets
            presets={zoomPresets}
            selectedZoom={selectedZoom}
            selectZoom={selectZoom}
          />
        </View>
      )}

      <TouchableOpacityWithDebounce
        accessibilityLabel={i18n.t( "queue.save_for_later" )}
        accessible
        testID="saveForLaterButton"
        onPress={saveForLater}
        style={[
          viewStyles.saveForLaterButton,
          isLandscape
            ? viewStyles.saveForLaterButtonLandscape
            : viewStyles.saveForLaterButtonPortrait,
        ]}
        disabled={pictureTaken}
      >
        <Image tintColor={colors.white} source={icons.checklist} />
        {queueCount > 0 && (
          <View style={viewStyles.saveForLaterBadge}>
            <StyledText style={textStyles.saveForLaterBadgeText}>
              {queueCount}
            </StyledText>
          </View>
        )}
      </TouchableOpacityWithDebounce>

      <View style={
        isLandscape ? viewStyles.cameraControlsContainerLandscape : viewStyles.cameraControlsContainer
      }>
        <View style={viewStyles.leftControls}>
          {isAndroid && (
            <TouchableOpacity
              accessibilityLabel={filterIndex ? settings[filterIndex].text : settings[0].text}
              accessible
              onPress={toggleFilterIndex}
            >
              <Image source={filterIndex ? settings[filterIndex].icon : settings[0].icon} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityLabel={i18n.t( "accessibility.open_help" )}
            accessible
            onPress={showCameraHelp}
          >
            <Image source={icons.cameraHelp} />
          </TouchableOpacity>
        </View>

        <TouchableOpacityWithDebounce
          accessibilityLabel={i18n.t( "accessibility.take_photo" )}
          accessible
          testID="takePhotoButton"
          onPress={takePicture}
          style={viewStyles.shadow}
          disabled={pictureTaken}
        >
          <Image
            source={
              prediction?.rank === "species"
                ? icons.arCameraGreen
                : icons.arCameraButton
            }
          />
        </TouchableOpacityWithDebounce>

        <View style={viewStyles.rightControls}>
          <GalleryButton setIsActive={setIsActive} />
        </View>
      </View>
    </>
  );
};

export default ARCameraOverlay;
