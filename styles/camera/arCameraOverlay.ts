import { StyleSheet } from "react-native";
import { colors } from "../global";
import { darkTheme } from "../theme";
import type { ThemeTokens } from "../theme";
import { withAlpha } from "../dynamicColor";

// Built from the camera theme (dark variant of the active scheme, static or
// Material You) so the camera follows the app's single accent color.
const buildCameraOverlayStyles = ( c: ThemeTokens["colors"] ) => {
  const viewStyles = StyleSheet.create( {
    bottomDeck: {
      backgroundColor: withAlpha( c.canvas, 0.92 ),
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      bottom: 0,
      gap: 11,
      left: 0,
      paddingBottom: 20,
      paddingHorizontal: 14,
      paddingTop: 14,
      position: "absolute",
      right: 0,
      zIndex: 5,
    },
    captureRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 6,
      paddingTop: 2,
    },
    coachingRow: {
      alignItems: "center",
      minHeight: 22,
    },
    galleryBadge: {
      alignItems: "center",
      backgroundColor: c.primary,
      borderColor: "rgba(10, 14, 11, 0.75)",
      borderRadius: 10,
      borderWidth: 1,
      height: 20,
      justifyContent: "center",
      minWidth: 20,
      paddingHorizontal: 5,
      position: "absolute",
      right: -2,
      top: -2,
    },
    galleryButton: {
      alignItems: "center",
      backgroundColor: "rgba(16, 20, 17, 0.58)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 26,
      borderWidth: 1,
      height: 52,
      justifyContent: "center",
      padding: 14,
      width: 52,
    },
    gallerySlot: {
      height: 56,
      justifyContent: "center",
      width: 56,
    },
    glassBadge: {
      alignItems: "center",
      backgroundColor: c.primary,
      borderColor: "rgba(10, 14, 11, 0.75)",
      borderRadius: 9,
      borderWidth: 1,
      height: 18,
      justifyContent: "center",
      minWidth: 18,
      paddingHorizontal: 4,
      position: "absolute",
      right: -2,
      top: -2,
    },
    glassButtonColumn: {
      alignItems: "center",
      gap: 3,
      minWidth: 52,
    },
    glassCircle: {
      alignItems: "center",
      backgroundColor: c.surfaceContainerHigh,
      borderColor: "transparent",
      borderRadius: 24,
      borderWidth: 1,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    glassCircleActive: {
      backgroundColor: c.secondaryContainer,
      borderColor: "transparent",
    },
    glassCircleDisabled: {
      opacity: 0.45,
    },
    glassIcon: {
      height: 22,
      width: 22,
    },
    gridLine: {
      backgroundColor: "rgba(255, 255, 255, 0.38)",
      position: "absolute",
    },
    gridLineHorizontalOne: {
      height: 1,
      left: 0,
      right: 0,
      top: "33.333%",
    },
    gridLineHorizontalTwo: {
      height: 1,
      left: 0,
      right: 0,
      top: "66.666%",
    },
    gridLineVerticalOne: {
      bottom: 0,
      left: "33.333%",
      top: 0,
      width: 1,
    },
    gridLineVerticalTwo: {
      bottom: 0,
      left: "66.666%",
      top: 0,
      width: 1,
    },
    gridOverlay: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.58,
      zIndex: 2,
    },
    modeControlsRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    modeTab: {
      alignItems: "center",
      backgroundColor: "transparent",
      borderColor: c.outline,
      borderRadius: 24,
      borderWidth: 1,
      flex: 1,
      gap: 1,
      height: 48,
      justifyContent: "center",
      minWidth: 0,
      paddingHorizontal: 4,
    },
    modeTabActive: {
      backgroundColor: c.secondaryContainer,
      borderColor: c.secondaryContainer,
    },
    modeTabs: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
    },
    modeTabTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 5,
    },
    plantFilter: {
      alignItems: "center",
      bottom: 306,
      gap: 12,
      left: 0,
      position: "absolute",
      right: 0,
    },
    progressChildren: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    progressRing: {
      position: "absolute",
    },
    proTile: {
      alignItems: "stretch",
      backgroundColor: "rgba(255, 255, 255, 0.045)",
      borderColor: "rgba(255, 255, 255, 0.09)",
      borderRadius: 16,
      borderWidth: 1.5,
      gap: 8,
      paddingBottom: 10,
      paddingHorizontal: 12,
      paddingTop: 11,
      width: "48.5%",
    },
    proTileActive: {
      backgroundColor: c.secondaryContainer,
      borderColor: c.secondaryContainer,
    },
    proTileDot: {
      borderColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: 5,
      borderWidth: 1.5,
      height: 10,
      width: 10,
    },
    proTileDotActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    proTileGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "space-between",
    },
    proTileIcon: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 17,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    proTileIconActive: {
      backgroundColor: c.primary,
    },
    proTileIconRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    scanReticle: {
      height: 152,
      left: "50%",
      marginLeft: -76,
      marginTop: -76,
      position: "absolute",
      top: "37%",
      width: 152,
      zIndex: 2,
    },
    scanReticleRing: {
      borderColor: "rgba(255, 255, 255, 0.55)",
      borderRadius: 76,
      borderWidth: 2.5,
      height: 152,
      width: 152,
    },
    scanReticleRingSpecies: {
      borderColor: c.primary,
      borderRadius: 24,
    },
    settingCopy: {
      flex: 1,
      minWidth: 0,
    },
    settingIconBox: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 18,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    settingIconBoxActive: {
      backgroundColor: c.primary,
    },
    settingRow: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.045)",
      borderColor: "rgba(255, 255, 255, 0.09)",
      borderRadius: 16,
      borderWidth: 1.5,
      flexDirection: "row",
      gap: 13,
      paddingHorizontal: 13,
      paddingVertical: 11,
    },
    settingRowActive: {
      borderColor: c.secondaryContainer,
    },
    settingSegment: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      padding: 4,
    },
    settingSegmentItem: {
      alignItems: "center",
      borderRadius: 11,
      flex: 1,
      flexDirection: "row",
      gap: 6,
      height: 42,
      justifyContent: "center",
      minWidth: 0,
      paddingHorizontal: 4,
    },
    settingSegmentItemActive: {
      backgroundColor: c.secondaryContainer,
    },
    settingsScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.34)",
      zIndex: 6,
    },
    settingsSheet: {
      backgroundColor: c.surfaceContainerLow,
      borderColor: c.surfaceContainerLow,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 0,
      bottom: 0,
      left: 0,
      maxHeight: "86%",
      paddingHorizontal: 20,
      paddingTop: 12,
      position: "absolute",
      right: 0,
      zIndex: 7,
    },
    settingsSheetContent: {
      gap: 4,
      paddingBottom: 24,
    },
    settingSwitch: {
      backgroundColor: "rgba(255, 255, 255, 0.22)",
      borderRadius: 13,
      height: 26,
      justifyContent: "center",
      paddingHorizontal: 2.5,
      width: 44,
    },
    settingSwitchActive: {
      backgroundColor: c.primary,
    },
    settingSwitchKnob: {
      backgroundColor: colors.white,
      borderRadius: 10.5,
      height: 21,
      width: 21,
    },
    settingSwitchKnobActive: {
      alignSelf: "flex-end",
    },
    shadow: {
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 1,
      shadowRadius: 3,
    },
    sheetCloseButton: {
      alignItems: "center",
      backgroundColor: "transparent",
      borderRadius: 24,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    sheetDragZone: {
      paddingTop: 2,
    },
    sheetHandle: {
      alignSelf: "center",
      backgroundColor: c.outlineVariant,
      borderRadius: 2,
      height: 4,
      marginBottom: 12,
      marginTop: 10,
      width: 32,
    },
    sheetHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    shutterButton: {
      alignItems: "center",
      height: 80,
      justifyContent: "center",
      width: 80,
    },
    shutterButtonDisabled: {
      opacity: 0.78,
    },
    shutterIcon: {
      height: 38,
      resizeMode: "contain",
      width: 38,
    },
    shutterInner: {
      alignItems: "center",
      backgroundColor: colors.white,
      borderRadius: 30,
      height: 60,
      justifyContent: "center",
      width: 60,
    },
    shutterInnerActive: {
      backgroundColor: c.primary,
    },
    shutterInnerQueue: {
      borderRadius: 30,
    },
  } );

  const textStyles = StyleSheet.create( {
    coachingText: {
      color: colors.white,
      fontSize: 13.5,
      fontWeight: "500",
      textAlign: "center",
    },
    glassBadgeText: {
      color: colors.white,
      fontSize: 10.5,
      fontWeight: "500",
      textAlign: "center",
    },
    glassLabel: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 9,
      fontWeight: "500",
      letterSpacing: 0,
      textAlign: "center",
    },
    glassLabelActive: {
      color: c.onSecondaryContainer,
    },
    modeIcon: {
      color: colors.white,
      fontSize: 12,
      fontWeight: "500",
    },
    modeLabel: {
      color: colors.white,
      fontSize: 12.5,
      fontWeight: "500",
    },
    modeTextActive: {
      color: c.onSecondaryContainer,
    },
    modeValue: {
      color: "rgba(255, 255, 255, 0.6)",
      fontSize: 10.5,
      fontWeight: "500",
    },
    proTileIconText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: "500",
    },
    proTileIconTextActive: {
      color: c.onPrimary,
    },
    proTileSub: {
      color: "rgba(255, 255, 255, 0.52)",
      fontSize: 11,
      fontWeight: "500",
      marginTop: 2,
    },
    proTileTitle: {
      color: colors.white,
      fontSize: 14,
      fontWeight: "500",
    },
    scanText: {
      textAlign: "center",
    },
    sectionLabel: {
      color: c.primary,
      fontSize: 14,
      fontWeight: "500",
      letterSpacing: 0.1,
      lineHeight: 20,
      marginBottom: 8,
      marginTop: 16,
    },
    settingIcon: {
      color: colors.white,
      fontSize: 12,
      fontWeight: "500",
    },
    settingIconActive: {
      color: c.onPrimary,
    },
    settingSegmentIcon: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 12,
      fontWeight: "500",
    },
    settingSegmentText: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 12.5,
      fontWeight: "500",
    },
    settingSegmentTextActive: {
      color: c.onSecondaryContainer,
    },
    settingSub: {
      color: "rgba(255, 255, 255, 0.55)",
      fontSize: 11.5,
      fontWeight: "500",
      marginTop: 1,
    },
    settingTitle: {
      color: colors.white,
      fontSize: 14.5,
      fontWeight: "500",
    },
    sheetTitle: {
      color: c.text,
      fontSize: 22,
      fontWeight: "400",
      lineHeight: 28,
    },
    shutterPlus: {
      color: colors.white,
      fontSize: 31,
      fontWeight: "500",
      lineHeight: 36,
      textAlign: "center",
    },
    textShadow: {
      textShadowColor: colors.textShadow,
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 3,
    },
  } );

  const imageStyles = StyleSheet.create( {
    gallery: {
      height: 24,
      width: 24,
    },
  } );
  return { viewStyles, textStyles, imageStyles };
};

const cache = new WeakMap<ThemeTokens, ReturnType<typeof buildCameraOverlayStyles>>( );
const getCameraOverlayStyles = ( theme: ThemeTokens ) => {
  let styles = cache.get( theme );
  if ( !styles ) {
    styles = buildCameraOverlayStyles( theme.colors );
    cache.set( theme, styles );
  }
  return styles;
};

const { viewStyles, textStyles, imageStyles } = getCameraOverlayStyles( darkTheme );

export {
  getCameraOverlayStyles,
  viewStyles,
  textStyles,
  imageStyles,
};
