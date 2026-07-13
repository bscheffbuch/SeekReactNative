import { StyleSheet } from "react-native";
import {
  colors,
  dimensions,
} from "../global";

const { height } = dimensions;

const viewStyles = StyleSheet.create( {
  header: {
    alignItems: "center",
    left: 0,
    paddingHorizontal: 20,
    position: "absolute",
    right: 0,
    top: height > 700 ? 88 : 58,
    zIndex: 4,
  },
  predictionCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  predictionPill: {
    alignItems: "center",
    backgroundColor: "rgba(10, 14, 11, 0.62)",
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    maxWidth: "100%",
    paddingBottom: 9,
    paddingLeft: 17,
    paddingRight: 10,
    paddingTop: 9,
  },
  predictionPillSpecies: {
    borderColor: "rgba(68, 171, 85, 0.72)",
  },
  progressBubble: {
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: 19,
    borderWidth: 3,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  progressBubbleSpecies: {
    borderColor: colors.seekGreen,
  },
} );

const textStyles = StyleSheet.create( {
  predictionName: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 20,
  },
  progressText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  progressTextSpecies: {
    color: colors.seekGreen,
  },
  rankLabel: {
    color: colors.seekGold,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 12,
  },
  scientificName: {
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 15,
  },
} );

export {
  textStyles,
  viewStyles,
};
