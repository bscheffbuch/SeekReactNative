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
import useCameraStyles from "./hooks/useCameraStyles";
import { useNavigation } from "@react-navigation/native";
import useActiveModelPack from "../../../utility/customHooks/useActiveModelPack";
import { localizeNumber } from "../../../utility/helpers";
import { useTheme } from "../../Providers/ThemeProvider";
import { makeThemedStyles } from "../../../styles/themedStyles";
import { withAlpha } from "../../../styles/dynamicColor";
import type { ThemeTokens } from "../../../styles/theme";
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
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
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
  gestureHud?: null | { mode: "focus" | "peak"; value: number };
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
    return i18n.t( "camera.focus_macro" );
  }
  if ( value > 0.95 ) {
    return i18n.t( "camera.focus_infinity" );
  }
  return `${( 0.1 + value * 2.9 ).toFixed( 1 )} m`;
};

const peakFmt = ( value: number ) => {
  if ( value < 0.34 ) {
    return i18n.t( "camera.sensitivity_low" );
  }
  if ( value < 0.67 ) {
    return i18n.t( "camera.sensitivity_medium" );
  }
  return i18n.t( "camera.sensitivity_high" );
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
}: GlassButtonProps ) => {
  const { viewStyles, textStyles } = useCameraStyles( );
  return (
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
};

const ModeTab = ( {
  active,
  icon,
  label,
  onPress,
  value,
}: ModeTabProps ) => {
  const { viewStyles, textStyles } = useCameraStyles( );
  const { cameraTheme } = useTheme( );
  const Icon = icon;
  const iconColor = active ? cameraTheme.colors.onSecondaryContainer : colors.white;
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

// Camera settings sheet (Material 3, as in the design canvas): segmented button
// with a check on the selected option, two-line list items with tonal icon discs
// and M3 switches, and tonal capture cards. Colors come from the camera theme.
const getSheetStyles = makeThemedStyles( ( t: ThemeTokens ) => ( {
  segment: {
    borderColor: t.colors.outline,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    height: 40,
    overflow: "hidden",
  },
  segmentItem: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  segmentDivider: {
    borderLeftColor: t.colors.outline,
    borderLeftWidth: 1,
  },
  segmentItemActive: {
    backgroundColor: t.colors.secondaryContainer,
  },
  segmentText: {
    color: t.colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  segmentTextActive: {
    color: t.colors.onSecondaryContainer,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    minHeight: 72,
    paddingVertical: 8,
  },
  iconDisc: {
    alignItems: "center",
    backgroundColor: t.colors.secondaryContainer,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: t.colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  rowSub: {
    color: t.colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
  switchTrack: {
    alignItems: "center",
    backgroundColor: t.colors.surfaceContainerHighest,
    borderColor: t.colors.outline,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: "row",
    height: 32,
    paddingHorizontal: 6,
    width: 52,
  },
  switchTrackOn: {
    backgroundColor: t.colors.primary,
    borderColor: t.colors.primary,
    justifyContent: "flex-end",
    paddingHorizontal: 2,
  },
  switchThumb: {
    backgroundColor: t.colors.outline,
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  switchThumbOn: {
    alignItems: "center",
    backgroundColor: t.colors.onPrimary,
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  card: {
    backgroundColor: t.colors.surfaceContainerHigh,
    borderRadius: 16,
    gap: 8,
    justifyContent: "space-between",
    minHeight: 96,
    padding: 12,
    width: "31.5%",
  },
  cardOn: {
    backgroundColor: t.colors.secondaryContainer,
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: t.colors.surfaceContainerHighest,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  cardIconOn: {
    backgroundColor: t.colors.primary,
  },
  cardTitle: {
    color: t.colors.text,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  cardTitleOn: {
    color: t.colors.onSecondaryContainer,
  },
  cardSub: {
    color: t.colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
  },
  cardSubOn: {
    color: t.colors.onSecondaryContainer,
  },
} ) );

const SettingSegment = ( {
  onChange,
  options,
  value,
}: SettingSegmentProps ) => {
  const { cameraTheme } = useTheme( );
  const styles = getSheetStyles( cameraTheme );
  return (
    <View accessibilityRole="radiogroup" style={styles.segment}>
      {options.map( ( option, index ) => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            activeOpacity={0.7}
            key={option.value}
            onPress={() => onChange( option.value )}
            style={[styles.segmentItem, index > 0 && styles.segmentDivider, active && styles.segmentItemActive]}
          >
            {active && <CheckIcon color={cameraTheme.colors.onSecondaryContainer} size={16} strokeWidth={2.6} />}
            <StyledText
              maxFontSizeMultiplier={1.1}
              numberOfLines={1}
              style={[styles.segmentText, active && styles.segmentTextActive]}
            >
              {option.label}
            </StyledText>
          </TouchableOpacity>
        );
      } )}
    </View>
  );
};

const SettingRow = ( {
  active,
  icon,
  label,
  onPress,
  sub,
  chevron = false,
}: SettingRowProps & { chevron?: boolean } ) => {
  const { cameraTheme } = useTheme( );
  const styles = getSheetStyles( cameraTheme );
  const Icon = icon;
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole={chevron ? "button" : "switch"}
      accessibilityState={chevron ? undefined : { checked: active }}
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.iconDisc}>
        <Icon color={cameraTheme.colors.onSecondaryContainer} size={20} strokeWidth={2} />
      </View>
      <View style={styles.rowCopy}>
        <StyledText maxFontSizeMultiplier={1.1} numberOfLines={1} style={styles.rowTitle}>
          {label}
        </StyledText>
        <StyledText maxFontSizeMultiplier={1.1} numberOfLines={1} style={styles.rowSub}>
          {sub}
        </StyledText>
      </View>
      {chevron ? (
        <ChevronRightIcon color={cameraTheme.colors.onSurfaceVariant} size={24} strokeWidth={2} />
      ) : (
        <View style={[styles.switchTrack, active && styles.switchTrackOn]}>
          <View style={active ? styles.switchThumbOn : styles.switchThumb}>
            {active && <CheckIcon color={cameraTheme.colors.primary} size={16} strokeWidth={3} />}
          </View>
        </View>
      )}
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
  const { cameraTheme } = useTheme( );
  const styles = getSheetStyles( cameraTheme );
  const Icon = icon;
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, active && styles.cardOn]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, active && styles.cardIconOn]}>
          <Icon color={active ? cameraTheme.colors.onPrimary : cameraTheme.colors.text} size={18} strokeWidth={2.2} />
        </View>
        {active && <CheckIcon color={cameraTheme.colors.primary} size={18} strokeWidth={2.8} />}
      </View>
      <View>
        <StyledText maxFontSizeMultiplier={1.1} numberOfLines={1} style={[styles.cardTitle, active && styles.cardTitleOn]}>
          {label}
        </StyledText>
        <StyledText maxFontSizeMultiplier={1.1} numberOfLines={1} style={[styles.cardSub, active && styles.cardSubOn]}>
          {active ? i18n.t( "camera.on" ) : sub}
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
  const { viewStyles } = useCameraStyles( );
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
  gestureHud = null,
}: Props ) => {
  const { viewStyles, textStyles } = useCameraStyles( );
  const { cameraTheme } = useTheme( );
  const m3Styles = getM3Styles( cameraTheme );
  const navigation = useNavigation( );
  const activeModelPack = useActiveModelPack( );
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
  // Controls can be tucked away; gestures on the viewfinder keep working.
  const [controlsHidden, setControlsHidden] = useState( false );
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
      shortText: i18n.t( "camera.filter_all" ),
      segmentIcon: SearchIcon,
      color: colors.cameraFilterGray,
    },
    {
      negativeFilter: false,
      taxonId: "47126",
      text: i18n.t( "camera.plant_filter" ),
      shortText: i18n.t( "camera.filter_plants" ),
      segmentIcon: LeafIcon,
      color: null,
    },
    {
      negativeFilter: true,
      taxonId: "47126",
      text: i18n.t( "camera.non_plant_filter" ),
      shortText: i18n.t( "camera.filter_non_plants" ),
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
        { value: 0, label: i18n.t( "camera.focus_macro" ) },
        { value: 0.5, label: "1.5 m" },
        { value: 1, label: i18n.t( "camera.focus_infinity" ) },
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
          { value: 0, label: i18n.t( "camera.sensitivity_low" ) },
          { value: 0.5, label: i18n.t( "camera.sensitivity_medium" ) },
          { value: 1, label: i18n.t( "camera.sensitivity_high" ) },
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
  const deckAccent = isSpecies ? cameraTheme.colors.primary : "rgba(255, 255, 255, 0.85)";
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
        rectangleColor={cameraTheme.colors.primary}
      />

      {gestureHud && (
        <View pointerEvents="none" style={m3Styles.hud}>
          <StyledText style={m3Styles.hudText}>
            {gestureHud.mode === "focus"
              ? `${i18n.t( "camera.focus" )} · ${focusFmt( gestureHud.value )}`
              : `${i18n.t( "camera.peak" )} · ${peakFmt( gestureHud.value )}`}
          </StyledText>
        </View>
      )}
      <View style={[viewStyles.bottomDeck, controlsHidden && m3Styles.deckHidden]}>
        <TouchableOpacity
          accessibilityLabel={i18n.t( controlsHidden ? "camera.show_controls" : "camera.hide_controls" )}
          accessibilityRole="button"
          accessibilityState={{ expanded: !controlsHidden }}
          hitSlop={{ top: 12, bottom: 8, left: 40, right: 40 }}
          onPress={() => setControlsHidden( hidden => !hidden )}
          style={m3Styles.handleTouch}
          testID="camera-controls-toggle"
        >
          <View style={m3Styles.handle} />
        </TouchableOpacity>
        {!controlsHidden && (
          <View style={viewStyles.coachingRow}>
            <StyledText
              maxFontSizeMultiplier={1.1}
              style={[textStyles.coachingText, !isLandscape && textStyles.textShadow]}
            >
              {helpText}
            </StyledText>
          </View>
        )}

        <View style={[viewStyles.modeControlsRow, controlsHidden && m3Styles.rowHidden]}>
          {!controlsHidden && (
          <GlassButton
            accessibilityLabel={i18n.t( "accessibility.flash" )}
            active={flashEnabled}
            disabled={flashDisabled}
            label={flashEnabled ? i18n.t( "camera.on" ) : i18n.t( "camera.off" )}
            onPress={toggleFlash}
            testID="flash-wheel-button"
          >
            <FlashIcon color={flashEnabled ? cameraTheme.colors.onSecondaryContainer : colors.white} size={23} strokeWidth={2.2} />
          </GlassButton>
          )}
          {controlsHidden ? (
            <TouchableOpacity
              accessibilityLabel={i18n.t( "camera.show_controls" )}
              accessibilityRole="button"
              onPress={() => setControlsHidden( false )}
              style={m3Styles.valuePill}
            >
              <StyledText numberOfLines={1} style={m3Styles.valuePillText}>
                {[
                  zoomFmt( selectedZoom ),
                  supportsManualFocus ? ( manualFocusEnabled ? focusFmt( manualFocusValue ) : i18n.t( "camera.auto" ) ) : null,
                  focusPeakingEnabled ? peakFmt( focusPeakingSensitivity ) : null,
                ].filter( Boolean ).join( "  ·  " )}
              </StyledText>
              <ChevronDownIcon color={cameraTheme.colors.onSurfaceVariant} size={18} strokeWidth={2.2} />
            </TouchableOpacity>
          ) : (
          <View style={viewStyles.modeTabs}>
            <ModeTab
              active={wheelMode === "zoom"}
              icon={CameraIcon}
              label={i18n.t( "camera.zoom" )}
              onPress={() => selectWheelMode( "zoom" )}
              value={zoomFmt( selectedZoom )}
            />
            {supportsManualFocus && (
              <ModeTab
                active={wheelMode === "focus"}
                icon={FocusIcon}
                label={i18n.t( "camera.focus" )}
                onPress={() => selectWheelMode( "focus" )}
                value={manualFocusEnabled ? focusFmt( manualFocusValue ) : i18n.t( "camera.auto" )}
              />
            )}
            {focusPeakingEnabled && (
              <ModeTab
                active={wheelMode === "peak"}
                icon={SlidersIcon}
                label={i18n.t( "camera.peak" )}
                onPress={() => selectWheelMode( "peak" )}
                value={peakFmt( focusPeakingSensitivity )}
              />
            )}
          </View>
          )}
          {!controlsHidden && (
          <GlassButton
            accessibilityLabel={i18n.t( "camera.settings" )}
            active={settingsOpen}
            badge={settingsBadgeCount}
            onPress={() => setSettingsOpen( true )}
            testID="camera-settings-sheet-button"
          >
            <SettingsIcon color={settingsOpen ? cameraTheme.colors.onSecondaryContainer : colors.white} size={23} strokeWidth={2.2} />
          </GlassButton>
          )}
        </View>

        {!controlsHidden && (
          <CameraJogWheel
            {...wheelConfig}
            onChange={updateWheelValue}
            testID="camera-jog-wheel"
          />
        )}

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
                    color={isSpecies ? cameraTheme.colors.onPrimary : colors.seekInk}
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
                  {i18n.t( "camera.settings" )}
                </StyledText>
                <TouchableOpacity
                  accessibilityLabel={i18n.t( "camera.close_settings" )}
                  accessibilityRole="button"
                  onPress={closeSettings}
                  style={viewStyles.sheetCloseButton}
                >
                  <XIcon color={cameraTheme.colors.onSurfaceVariant} size={24} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              bounces={false}
              contentContainerStyle={viewStyles.settingsSheetContent}
              showsVerticalScrollIndicator={false}
            >
              <StyledText style={textStyles.sectionLabel}>
                {i18n.t( "camera.what_to_identify" )}
              </StyledText>
              <SettingSegment
                onChange={setFilterIndex}
                options={filterOptions}
                value={filterIndex}
              />

              <StyledText style={textStyles.sectionLabel}>
                {i18n.t( "camera.general" )}
              </StyledText>
              <SettingRow
                active={false}
                chevron
                icon={LeafIcon}
                label={i18n.t( "settings.identification_model" )}
                onPress={() => {
                  closeSettings( );
                  navigation.navigate( "Settings" as never );
                }}
                sub={activeModelPack ? `${activeModelPack.name}${activeModelPack.taxa ? ` · ${localizeNumber( activeModelPack.taxa )}` : ""}` : ""}
              />
              <SettingRow
                active={queueMode}
                icon={QueueIcon}
                label={i18n.t( "camera.queue_mode" )}
                onPress={toggleQueueMode}
                sub={i18n.t( "camera.queue_mode_sub" )}
              />

              <StyledText style={textStyles.sectionLabel}>
                {i18n.t( "camera.capture" )}
              </StyledText>
              <View style={viewStyles.proTileGrid}>
                {supportsMacro && (
                  <ProTile
                    active={macroEnabled}
                    icon={LeafIcon}
                    label={i18n.t( "camera.macro" )}
                    onPress={toggleMacro}
                    sub={i18n.t( macroEnabled ? "camera.macro_on" : "camera.macro_sub" )}
                  />
                )}
                <ProTile
                  active={focusPeakingEnabled}
                  icon={FocusIcon}
                  label={i18n.t( "camera.focus_peaking" )}
                  onPress={toggleFocusPeaking}
                  sub={i18n.t( focusPeakingEnabled ? "camera.focus_peaking_on" : "camera.focus_peaking_sub" )}
                />
                {supportsPhotoHdr && (
                  <ProTile
                    active={photoHdrEnabled}
                    icon={MountainIcon}
                    label={i18n.t( "camera.hdr" )}
                    onPress={togglePhotoHdr}
                    sub={i18n.t( photoHdrEnabled ? "camera.hdr_on" : "camera.hdr_sub" )}
                  />
                )}
                {supportsDigitalStabilization && (
                  <ProTile
                    active={digitalStabilizationEnabled}
                    icon={SlidersIcon}
                    label={i18n.t( "camera.stabilize" )}
                    onPress={toggleDigitalStabilization}
                    sub={i18n.t( digitalStabilizationEnabled ? "camera.stabilize_on" : "camera.stabilize_sub" )}
                  />
                )}
                <ProTile
                  active={gridEnabled}
                  icon={GridIcon}
                  label={i18n.t( "camera.grid" )}
                  onPress={() => setGridEnabled( current => !current )}
                  sub={i18n.t( gridEnabled ? "camera.grid_on" : "camera.grid_sub" )}
                />
                <ProTile
                  active={useLocation}
                  icon={MapPinIcon}
                  label={i18n.t( "camera.save_location" )}
                  onPress={toggleLocation}
                  sub={i18n.t( useLocation ? "camera.save_location_on" : "camera.save_location_sub" )}
                />
              </View>
            </ScrollView>
          </Animated.View>
        </>
      )}
    </>
  );
};

const getM3Styles = makeThemedStyles( ( t: ThemeTokens ) => ( {
  handleTouch: {
    alignItems: "center",
    alignSelf: "center",
    height: 12,
    justifyContent: "center",
    marginTop: -6,
    width: 64,
  },
  handle: {
    backgroundColor: t.colors.outlineVariant,
    borderRadius: 2,
    height: 4,
    width: 32,
  },
  hud: {
    alignSelf: "center",
    backgroundColor: t.colors.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: "absolute",
    top: "38%",
    zIndex: 6,
  },
  hudText: {
    color: t.colors.onPrimaryContainer,
    fontSize: 15,
    fontWeight: "500",
  },
  // hidden controls: no deck panel, just the shutter row and a small value pill
  deckHidden: {
    backgroundColor: "transparent",
  },
  rowHidden: {
    justifyContent: "center",
  },
  valuePill: {
    alignItems: "center",
    backgroundColor: withAlpha( t.colors.surfaceContainerHigh, 0.7 ),
    borderRadius: 20,
    flex: 0,
    flexDirection: "row",
    gap: 8,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  valuePillText: {
    color: t.colors.text,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "500",
  },
} ) );

export default ARCameraOverlay;
