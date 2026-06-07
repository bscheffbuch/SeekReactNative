import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Animated,
  PanResponder,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import i18n from "../../../i18n";
import { viewStyles, textStyles } from "../../../styles/camera/arCameraOverlay";
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
import CameraFlip from "./CameraFlip";
import CameraJogWheel from "./CameraJogWheel";
import type { TakePhotoOptions } from "react-native-vision-camera";
import ToastAnimationWithText from "../../UIComponents/ToastAnimationWithText";
import { TOAST } from "./ARCamera";
import type { BackCameraZoomPreset } from "./helpers/cameraDeviceHelpers";
import {
  CameraIcon,
  EyeIcon,
  FlashIcon,
  FocusIcon,
  GridIcon,
  LeafIcon,
  MapPinIcon,
  MountainIcon,
  PlusIcon,
  QueueIcon,
  SearchIcon,
  SettingsIcon,
  SlidersIcon,
  XIcon,
} from "../../UIComponents/AppIcons";
import type { GlyphIcon } from "../../UIComponents/AppIcons";

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
  supportsMacro: boolean;
  macroEnabled: boolean;
  toggleMacro: ( ) => void;
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
  queueMode: boolean;
  toggleQueueMode: ( ) => void;
  navToQueue: ( ) => void;
}

interface GlassButtonProps {
  accessibilityLabel: string;
  active?: boolean;
  badge?: number;
  children: React.ReactNode;
  disabled?: boolean;
  label?: string;
  onLongPress?: ( ) => void;
  onPress: ( ) => void;
  testID?: string;
}

interface ModeTabProps {
  active: boolean;
  icon: GlyphIcon;
  label: string;
  onPress: ( ) => void;
  value: string;
}

interface SettingSegmentOption {
  icon: GlyphIcon;
  label: string;
  value: number;
}

interface SettingSegmentProps {
  onChange: ( value: number ) => void;
  options: SettingSegmentOption[];
  value: number;
}

interface SettingRowProps {
  active: boolean;
  icon: GlyphIcon;
  label: string;
  onPress: ( ) => void;
  sub: string;
}

interface ProTileProps extends SettingRowProps {}

interface ProgressRingProps {
  children: React.ReactNode;
  color: string;
  progress: number;
  size: number;
  stroke: number;
  trackColor?: string;
}

type WheelMode = "zoom" | "focus" | "peak";

const isAndroid = Platform.OS === "android";
const RANK_LIST = ["kingdom", "phylum", "class", "order", "family", "genus", "species"];
const HELP_TEXT = [
  "Point Seek at a plant, animal or fungus",
  "Getting warmer - keep it in frame",
  "Move a little closer",
  "Hold steady...",
  "Almost there",
  "So close - we can nearly name it",
  "We know what this is!",
];

const clamp = ( value: number, min: number, max: number ) => (
  Math.min( Math.max( value, min ), max )
);

const zoomFmt = ( value: number ) => {
  if ( value < 1 ) {
    return `.${Math.round( value * 10 )}x`;
  }
  if ( Math.abs( value - Math.round( value ) ) < 0.05 ) {
    return `${Math.round( value )}x`;
  }
  return `${value.toFixed( 1 )}x`;
};

const focusFmt = ( value: number ) => {
  if ( value < 0.05 ) {
    return "Macro";
  }
  if ( value > 0.95 ) {
    return "Inf";
  }
  return `${( 0.1 + value * 2.9 ).toFixed( 1 )} m`;
};

const peakFmt = ( value: number ) => {
  if ( value < 0.34 ) {
    return "Low";
  }
  if ( value < 0.67 ) {
    return "Med";
  }
  return "High";
};

const GlassButton = ( {
  accessibilityLabel,
  active,
  badge = 0,
  children,
  disabled,
  label,
  onLongPress,
  onPress,
  testID,
}: GlassButtonProps ) => (
  <TouchableOpacity
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    accessibilityState={{ disabled, selected: active }}
    activeOpacity={0.62}
    disabled={disabled}
    onLongPress={onLongPress}
    onPress={onPress}
    style={viewStyles.glassButtonColumn}
    testID={testID}
  >
    <View
      style={[
        viewStyles.glassCircle,
        active && viewStyles.glassCircleActive,
        disabled && viewStyles.glassCircleDisabled,
      ]}
    >
      {children}
      {badge > 0 && (
        <View style={viewStyles.glassBadge}>
          <StyledText style={textStyles.glassBadgeText}>
            {badge}
          </StyledText>
        </View>
      )}
    </View>
    {label && (
      <StyledText
        maxFontSizeMultiplier={1.1}
        numberOfLines={1}
        style={[
          textStyles.glassLabel,
          active && textStyles.glassLabelActive,
        ]}
      >
        {label}
      </StyledText>
    )}
  </TouchableOpacity>
);

const ModeTab = ( {
  active,
  icon,
  label,
  onPress,
  value,
}: ModeTabProps ) => {
  const Icon = icon;
  const iconColor = active ? colors.seekInk : colors.white;
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        viewStyles.modeTab,
        active && viewStyles.modeTabActive,
      ]}
    >
      <View style={viewStyles.modeTabTitleRow}>
        <Icon color={iconColor} size={14} strokeWidth={2.2} />
        <StyledText
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          style={[textStyles.modeLabel, active && textStyles.modeTextActive]}
        >
          {label}
        </StyledText>
      </View>
      <StyledText
        maxFontSizeMultiplier={1.1}
        numberOfLines={1}
        style={[textStyles.modeValue, active && textStyles.modeTextActive]}
      >
        {value}
      </StyledText>
    </TouchableOpacity>
  );
};

const SettingSegment = ( {
  onChange,
  options,
  value,
}: SettingSegmentProps ) => (
  <View style={viewStyles.settingSegment}>
    {options.map( option => {
      const active = option.value === value;
      const Icon = option.icon;
      return (
        <TouchableOpacity
          accessibilityLabel={option.label}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          activeOpacity={0.7}
          key={option.value}
          onPress={() => onChange( option.value )}
          style={[
            viewStyles.settingSegmentItem,
            active && viewStyles.settingSegmentItemActive,
          ]}
        >
          <Icon color={active ? colors.seekInk : colors.white} size={14} strokeWidth={2.2} />
          <StyledText
            maxFontSizeMultiplier={1.1}
            numberOfLines={1}
            style={[
              textStyles.settingSegmentText,
              active && textStyles.settingSegmentTextActive,
            ]}
          >
            {option.label}
          </StyledText>
        </TouchableOpacity>
      );
    } )}
  </View>
);

const SettingRow = ( {
  active,
  icon,
  label,
  onPress,
  sub,
}: SettingRowProps ) => {
  const Icon = icon;
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      activeOpacity={0.7}
      onPress={onPress}
      style={[viewStyles.settingRow, active && viewStyles.settingRowActive]}
    >
      <View style={[viewStyles.settingIconBox, active && viewStyles.settingIconBoxActive]}>
        <Icon color={active ? colors.seekInk : colors.white} size={18} strokeWidth={2.2} />
      </View>
      <View style={viewStyles.settingCopy}>
        <StyledText
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          style={textStyles.settingTitle}
        >
          {label}
        </StyledText>
        <StyledText
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          style={textStyles.settingSub}
        >
          {sub}
        </StyledText>
      </View>
      <View style={[viewStyles.settingSwitch, active && viewStyles.settingSwitchActive]}>
        <View style={[viewStyles.settingSwitchKnob, active && viewStyles.settingSwitchKnobActive]} />
      </View>
    </TouchableOpacity>
  );
};

const ProTile = ( {
  active,
  icon,
  label,
  onPress,
  sub,
}: ProTileProps ) => {
  const Icon = icon;
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      activeOpacity={0.7}
      onPress={onPress}
      style={[viewStyles.proTile, active && viewStyles.proTileActive]}
    >
      <View style={viewStyles.proTileIconRow}>
        <View style={[viewStyles.proTileIcon, active && viewStyles.proTileIconActive]}>
          <Icon color={active ? colors.seekInk : colors.white} size={18} strokeWidth={2.2} />
        </View>
        <View style={[viewStyles.proTileDot, active && viewStyles.proTileDotActive]} />
      </View>
      <View>
        <StyledText
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          style={textStyles.proTileTitle}
        >
          {label}
        </StyledText>
        <StyledText
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          style={textStyles.proTileSub}
        >
          {sub}
        </StyledText>
      </View>
    </TouchableOpacity>
  );
};

const ProgressRing = ( {
  children,
  color,
  progress,
  size,
  stroke,
  trackColor = "rgba(255, 255, 255, 0.3)",
}: ProgressRingProps ) => {
  const radius = ( size - stroke ) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * ( 1 - clamp( progress, 0, 1 ) );
  return (
    <View style={{ height: size, width: size }}>
      <Svg height={size} style={viewStyles.progressRing} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke={color}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={stroke}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={viewStyles.progressChildren}>
        {children}
      </View>
    </View>
  );
};

const ARCameraOverlay = ( {
  takePicture,
  prediction,
  pictureTaken,
  cameraLoaded,
  filterByTaxonId,
  setIsActive,
  flipCamera,
  selectZoom,
  selectedZoom,
  zoomPresets,
  toggleManualFocus,
  manualFocusEnabled,
  manualFocusValue,
  setManualFocusValue,
  supportsManualFocus,
  supportsMacro,
  macroEnabled,
  toggleMacro,
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
  queueMode,
  toggleQueueMode,
  navToQueue,
}: Props ) => {
  const { isLandscape } = useAppOrientation( );
  const rankToRender = prediction?.rank;
  const rankIndex = rankToRender ? RANK_LIST.indexOf( rankToRender ) : -1;
  const rankProgress = rankIndex >= 0
    ? ( rankIndex + 1 ) / RANK_LIST.length
    : 0;
  const isSpecies = rankToRender === "species";
  const helpText = HELP_TEXT[rankIndex >= 0 ? rankIndex : 0];
  const userSettings = useFetchUserSettings( );
  const autoCapture = userSettings?.autoCapture;
  const [filterIndex, setFilterIndex] = useState( 0 );
  const [settingsOpen, setSettingsOpen] = useState( false );
  const [wheelMode, setWheelMode] = useState<WheelMode>( "zoom" );
  const [gridEnabled, setGridEnabled] = useState( false );
  const settingsTranslateY = React.useRef( new Animated.Value( 0 ) ).current;
  const closeSettings = useCallback( () => {
    Animated.timing( settingsTranslateY, {
      toValue: 520,
      duration: 170,
      useNativeDriver: true,
    } ).start( () => {
      settingsTranslateY.setValue( 0 );
      setSettingsOpen( false );
    } );
  }, [settingsTranslateY] );
  const settingsSheetPanResponder = useMemo( () => PanResponder.create( {
    onMoveShouldSetPanResponder: ( _event, gestureState ) => (
      gestureState.dy > 4 && Math.abs( gestureState.dx ) < 36
    ),
    onMoveShouldSetPanResponderCapture: ( _event, gestureState ) => (
      gestureState.dy > 4 && Math.abs( gestureState.dx ) < 36
    ),
    onPanResponderMove: ( _event, gestureState ) => {
      settingsTranslateY.setValue( Math.max( 0, gestureState.dy ) );
    },
    onPanResponderRelease: ( _event, gestureState ) => {
      if ( gestureState.dy > 52 || gestureState.vy > 0.7 ) {
        closeSettings( );
      } else {
        Animated.spring( settingsTranslateY, {
          toValue: 0,
          damping: 18,
          stiffness: 220,
          mass: 0.8,
          useNativeDriver: true,
        } ).start( );
      }
    },
  } ), [closeSettings, settingsTranslateY] );

  const filterSettings = useMemo( ( ) => ( [
    {
      negativeFilter: true,
      taxonId: null,
      text: i18n.t( "camera.filters_off" ),
      shortText: "All life",
      segmentIcon: SearchIcon,
      color: colors.cameraFilterGray,
    },
    {
      negativeFilter: false,
      taxonId: "47126",
      text: i18n.t( "camera.plant_filter" ),
      shortText: "Plants",
      segmentIcon: LeafIcon,
      color: null,
    },
    {
      negativeFilter: true,
      taxonId: "47126",
      text: i18n.t( "camera.non_plant_filter" ),
      shortText: "Animals",
      segmentIcon: EyeIcon,
      color: colors.seekTeal,
    },
  ] ), [] );

  useEffect( () => {
    filterByTaxonId( filterSettings[filterIndex].taxonId, filterSettings[filterIndex].negativeFilter );
  }, [filterIndex, filterByTaxonId, filterSettings] );

  useEffect( () => {
    if ( !focusPeakingEnabled && wheelMode === "peak" ) {
      setWheelMode( "zoom" );
    }
  }, [focusPeakingEnabled, wheelMode] );

  useEffect( () => {
    if ( settingsOpen ) {
      settingsTranslateY.setValue( 0 );
    }
  }, [settingsOpen, settingsTranslateY] );

  useEffect( () => {
    if ( wheelMode === "focus" && supportsManualFocus && !manualFocusEnabled ) {
      toggleManualFocus( );
    }
  }, [manualFocusEnabled, supportsManualFocus, toggleManualFocus, wheelMode] );

  useEffect( ( ) => {
    let isCurrent = true;
    if ( isSpecies && autoCapture && isCurrent && !pictureTaken && !queueMode ) {
      takePicture( );
    }
    return ( ) => {
      isCurrent = false;
    };
  }, [isSpecies, takePicture, autoCapture, pictureTaken, queueMode] );

  const showFilterText = ( ) => {
    if ( filterIndex === 0 ) {
      return null;
    }

    return (
      <View style={viewStyles.plantFilter}>
        <GreenRectangle text={filterSettings[filterIndex].text} color={filterSettings[filterIndex].color} />
      </View>
    );
  };

  const selectWheelMode = useCallback( ( nextMode: WheelMode ) => {
    if ( nextMode === "focus" && !supportsManualFocus ) {
      return;
    }
    if ( nextMode === "peak" && !focusPeakingEnabled ) {
      return;
    }
    setWheelMode( nextMode );
  }, [focusPeakingEnabled, supportsManualFocus] );

  const updateWheelValue = useCallback( ( value: number ) => {
    if ( wheelMode === "focus" ) {
      setManualFocusValue( Number( value.toFixed( 2 ) ) );
    } else if ( wheelMode === "peak" ) {
      setFocusPeakingSensitivity( Number( value.toFixed( 2 ) ) );
    } else {
      selectZoom( Number( value.toFixed( 1 ) ) );
    }
  }, [selectZoom, setFocusPeakingSensitivity, setManualFocusValue, wheelMode] );

  const zoomMax = Math.max( 8, ...zoomPresets.map( preset => preset.zoom ) );
  const wheelConfig = wheelMode === "focus"
    ? {
      accessibilityLabel: i18n.t( "accessibility.manual_focus" ),
      format: focusFmt,
      majors: [
        { value: 0, label: "Macro" },
        { value: 0.5, label: "1.5 m" },
        { value: 1, label: "Inf" },
      ],
      max: 1,
      min: 0,
      minorStep: 0.05,
      pxPerUnit: 300,
      value: manualFocusValue,
    }
    : wheelMode === "peak"
      ? {
        accessibilityLabel: i18n.t( "accessibility.focus_peaking_sensitivity" ),
        format: peakFmt,
        majors: [
          { value: 0, label: "Low" },
          { value: 0.5, label: "Med" },
          { value: 1, label: "High" },
        ],
        max: 1,
        min: 0,
        minorStep: 0.05,
        pxPerUnit: 300,
        value: focusPeakingSensitivity,
      }
      : {
        accessibilityLabel: i18n.t( "accessibility.switch_lens" ),
        format: zoomFmt,
        majors: [
          { value: 0.5, label: ".5x" },
          { value: 1, label: "1x" },
          { value: 2, label: "2x" },
          { value: 4, label: "4x" },
          { value: 8, label: "8x" },
        ].filter( major => major.value <= zoomMax ),
        max: zoomMax,
        min: 0.5,
        minorStep: 0.1,
        pxPerUnit: 46,
        value: selectedZoom,
      };

  const flashEnabled = hasTorch
    ? torch === "on"
    : takePhotoOptions.flash === "on";
  const flashDisabled = !hasFlash && !hasTorch;
  const settingsBadgeCount = [
    macroEnabled,
    focusPeakingEnabled,
    gridEnabled,
    queueMode,
    filterIndex !== 0,
  ].filter( Boolean ).length;
  const deckAccent = isSpecies ? colors.seekGreen : colors.seekGold;
  const shutterDisabled = !isSpecies && !queueMode;
  const shutterAction = queueMode ? saveForLater : takePicture;
  const filterOptions = filterSettings.map( setting => ( {
    icon: setting.segmentIcon,
    label: setting.shortText,
    value: filterSettings.indexOf( setting ),
  } ) );

  return (
    <>
      {( pictureTaken || !cameraLoaded ) && <LoadingWheel color={colors.white} />}
      <ARCameraHeader prediction={prediction} />
      {gridEnabled && (
        <View pointerEvents="none" style={viewStyles.gridOverlay}>
          <View style={[viewStyles.gridLine, viewStyles.gridLineVerticalOne]} />
          <View style={[viewStyles.gridLine, viewStyles.gridLineVerticalTwo]} />
          <View style={[viewStyles.gridLine, viewStyles.gridLineHorizontalOne]} />
          <View style={[viewStyles.gridLine, viewStyles.gridLineHorizontalTwo]} />
        </View>
      )}
      <View pointerEvents="none" style={viewStyles.scanReticle}>
        <View
          style={[
            viewStyles.scanReticleRing,
            isSpecies && viewStyles.scanReticleRingSpecies,
          ]}
        />
      </View>
      {isAndroid && visibleToast === TOAST.NONE && showFilterText( )}
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

      <View style={viewStyles.bottomDeck}>
        <View style={viewStyles.coachingRow}>
          <StyledText
            maxFontSizeMultiplier={1.1}
            style={[textStyles.coachingText, !isLandscape && textStyles.textShadow]}
          >
            {helpText}
          </StyledText>
        </View>

        <View style={viewStyles.modeControlsRow}>
          <GlassButton
            accessibilityLabel={i18n.t( "accessibility.flash" )}
            active={flashEnabled}
            disabled={flashDisabled}
            label={flashEnabled ? i18n.t( "camera.on" ) : i18n.t( "camera.off" )}
            onPress={toggleFlash}
            testID="flash-wheel-button"
          >
            <FlashIcon color={flashEnabled ? colors.seekInk : colors.white} size={23} strokeWidth={2.2} />
          </GlassButton>
          <View style={viewStyles.modeTabs}>
            <ModeTab
              active={wheelMode === "zoom"}
              icon={CameraIcon}
              label="Zoom"
              onPress={() => selectWheelMode( "zoom" )}
              value={zoomFmt( selectedZoom )}
            />
            {supportsManualFocus && (
              <ModeTab
                active={wheelMode === "focus"}
                icon={FocusIcon}
                label="Focus"
                onPress={() => selectWheelMode( "focus" )}
                value={manualFocusEnabled ? focusFmt( manualFocusValue ) : "Auto"}
              />
            )}
            {focusPeakingEnabled && (
              <ModeTab
                active={wheelMode === "peak"}
                icon={SlidersIcon}
                label="Peak"
                onPress={() => selectWheelMode( "peak" )}
                value={peakFmt( focusPeakingSensitivity )}
              />
            )}
          </View>
          <GlassButton
            accessibilityLabel="Camera settings"
            active={settingsOpen}
            badge={settingsBadgeCount}
            onPress={() => setSettingsOpen( true )}
            testID="camera-settings-sheet-button"
          >
            <SettingsIcon color={settingsOpen ? colors.seekInk : colors.white} size={23} strokeWidth={2.2} />
          </GlassButton>
        </View>

        <CameraJogWheel
          {...wheelConfig}
          onChange={updateWheelValue}
          testID="camera-jog-wheel"
        />

        <View style={viewStyles.captureRow}>
          <View style={viewStyles.gallerySlot}>
            <GalleryButton setIsActive={setIsActive} />
            {queueCount > 0 && (
              <TouchableOpacity
                accessibilityLabel={i18n.t( "queue.view_queue" )}
                accessibilityRole="button"
                onPress={navToQueue}
                style={viewStyles.galleryBadge}
              >
                <StyledText style={textStyles.glassBadgeText}>
                  {queueCount}
                </StyledText>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacityWithDebounce
            accessibilityLabel={
              queueMode
                ? i18n.t( "queue.save_for_later" )
                : i18n.t( "accessibility.take_photo" )
            }
            accessible
            disabled={( pictureTaken && !queueMode ) || shutterDisabled}
            onPress={shutterAction}
            style={[
              viewStyles.shutterButton,
              shutterDisabled && viewStyles.shutterButtonDisabled,
            ]}
            testID="takePhotoButton"
          >
            <ProgressRing
              color={deckAccent}
              progress={rankProgress}
              size={80}
              stroke={5}
            >
              <View
                style={[
                  viewStyles.shutterInner,
                  ( isSpecies || queueMode ) && viewStyles.shutterInnerActive,
                  queueMode && viewStyles.shutterInnerQueue,
                ]}
              >
                {queueMode ? (
                  <PlusIcon color={colors.white} size={34} strokeWidth={2.5} />
                ) : (
                  <CameraIcon
                    color={isSpecies ? colors.white : colors.seekInk}
                    size={34}
                    strokeWidth={2.25}
                  />
                )}
              </View>
            </ProgressRing>
          </TouchableOpacityWithDebounce>

          <CameraFlip flipCamera={flipCamera} />
        </View>
      </View>

      {settingsOpen && (
        <>
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeSettings}
            style={viewStyles.settingsScrim}
          />
          <Animated.View
            style={[
              viewStyles.settingsSheet,
              { transform: [{ translateY: settingsTranslateY }] },
            ]}
            {...settingsSheetPanResponder.panHandlers}
          >
            <View
              style={viewStyles.sheetDragZone}
            >
              <View style={viewStyles.sheetHandle} />
              <View style={viewStyles.sheetHeader}>
                <StyledText style={textStyles.sheetTitle}>
                  Camera settings
                </StyledText>
                <TouchableOpacity
                  accessibilityLabel="Close camera settings"
                  accessibilityRole="button"
                  onPress={closeSettings}
                  style={viewStyles.sheetCloseButton}
                >
                  <XIcon color={colors.white} size={22} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              bounces={false}
              contentContainerStyle={viewStyles.settingsSheetContent}
              showsVerticalScrollIndicator={false}
            >
              <StyledText style={textStyles.sectionLabel}>
                What to identify
              </StyledText>
              <SettingSegment
                onChange={setFilterIndex}
                options={filterOptions}
                value={filterIndex}
              />

              <StyledText style={textStyles.sectionLabel}>
                Saving
              </StyledText>
              <SettingRow
                active={queueMode}
                icon={QueueIcon}
                label="Queue mode"
                onPress={toggleQueueMode}
                sub="Keep shooting; save a burst at once"
              />

              <StyledText style={textStyles.sectionLabel}>
                Capture
              </StyledText>
              <View style={viewStyles.proTileGrid}>
                {supportsMacro && (
                  <ProTile
                    active={macroEnabled}
                    icon={LeafIcon}
                    label="Macro"
                    onPress={toggleMacro}
                    sub={macroEnabled ? "On - close-up focus" : "Close-up focus"}
                  />
                )}
                <ProTile
                  active={focusPeakingEnabled}
                  icon={FocusIcon}
                  label="Focus peaking"
                  onPress={toggleFocusPeaking}
                  sub={focusPeakingEnabled ? "On - adds wheel tab" : "Highlight sharp edges"}
                />
                {supportsPhotoHdr && (
                  <ProTile
                    active={photoHdrEnabled}
                    icon={MountainIcon}
                    label="HDR"
                    onPress={togglePhotoHdr}
                    sub={photoHdrEnabled ? "On - high dynamic range" : "High dynamic range"}
                  />
                )}
                {supportsDigitalStabilization && (
                  <ProTile
                    active={digitalStabilizationEnabled}
                    icon={SlidersIcon}
                    label="Stabilize"
                    onPress={toggleDigitalStabilization}
                    sub={digitalStabilizationEnabled ? "On - less motion blur" : "Reduce motion blur"}
                  />
                )}
                <ProTile
                  active={gridEnabled}
                  icon={GridIcon}
                  label="Grid"
                  onPress={() => setGridEnabled( current => !current )}
                  sub={gridEnabled ? "On - rule of thirds" : "Composition guide"}
                />
                <ProTile
                  active={useLocation}
                  icon={MapPinIcon}
                  label="Save location"
                  onPress={toggleLocation}
                  sub={useLocation ? "On - tag where found" : "Tag where you find it"}
                />
              </View>
            </ScrollView>
          </Animated.View>
        </>
      )}
    </>
  );
};

export default ARCameraOverlay;
