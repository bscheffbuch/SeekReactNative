import { StyleSheet } from "react-native";
import { colors } from "../global";

const viewStyles = StyleSheet.create( {
  enabledToggle: {
    backgroundColor: colors.white,
  },
  peakingSliderThumb: {
    borderColor: colors.focusPeakingYellow,
  },
  peakingSliderTrackFill: {
    backgroundColor: colors.focusPeakingYellow,
  },
  sliderContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
    height: 44,
    maxWidth: 292,
    paddingHorizontal: 14,
    width: "80%",
  },
  sliderThumb: {
    backgroundColor: colors.white,
    borderColor: colors.seekGreen,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    marginLeft: -10,
    position: "absolute",
    width: 20,
  },
  sliderTrack: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  sliderTrackFill: {
    backgroundColor: colors.seekGreen,
    borderRadius: 2,
    height: 4,
    position: "absolute",
  },
  zoomPresetButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    minWidth: 36,
    paddingHorizontal: 6,
  },
  zoomPresetButtonSelected: {
    backgroundColor: colors.white,
  },
  zoomPresetsContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: 24,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
} );

const textStyles = StyleSheet.create( {
  enabledToggleLabel: {
    color: colors.seekForestGreen,
  },
  focusModeLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  hdrToggleLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  peakingSliderLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    width: 36,
  },
  peakingToggleLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  sliderLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    width: 24,
  },
  sliderValueLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    width: 28,
  },
  stabilizationToggleLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  zoomPresetLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  zoomPresetLabelSelected: {
    color: colors.seekForestGreen,
  },
} );

export {
  viewStyles,
  textStyles,
};
