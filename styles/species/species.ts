import { StyleSheet } from "react-native";
import { colors, row, dimensions } from "../global";

const backgroundHeight = dimensions.height;
const bottomPadding = 100;

const viewStyles = StyleSheet.create( {
  backButton: {
    left: 0,
    paddingBottom: 18,
    paddingHorizontal: 23,
    paddingTop: 23,
    position: "absolute",
    zIndex: 1,
  },
  background: {
    backgroundColor: "#F3F1E8",
    minHeight: backgroundHeight,
  },
  landscapeBackground: {
    backgroundColor: "#F3F1E8",
    paddingBottom: bottomPadding,
  },
  bottomPadding: {
    paddingBottom: bottomPadding,
  },
  twoColumnContainer: {
    backgroundColor: "#F3F1E8",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  checkmark: {
    marginRight: 10,
  },
  greenBanner: {
    backgroundColor: "#DEF0E7",
  },
  headerMargins: {
    marginBottom: 11,
    marginTop: 45,
  },
  marginSmall: {
    marginTop: 21,
  },
  row,
  rowMargin: {
    marginTop: 28,
  },
  textContainer: {
    marginHorizontal: 28,
  },
  largerTextContainer: {
    marginHorizontal: 32,
  },
  selectedPressableArea: {
    backgroundColor: "rgb(176, 196, 222)",
    alignSelf: "flex-start",
  },
  topRibbon: {
    backgroundColor: "#DEF0E7",
    paddingTop: 2,
  },
} );

const textStyles = StyleSheet.create( {
  commonNameText: {
    marginTop: 23,
    marginHorizontal: 28,
  },
  humanText: {
    marginTop: 45,
    textAlign: "center",
  },
  iconicTaxaText: {
    backgroundColor: "#DEF0E7",
    color: colors.seekDeepGreen,
    paddingLeft: 28,
    paddingVertical: 12,
  },
  largerPadding: {
    paddingLeft: 32,
  },
  linkText: {
    paddingTop: 10,
    textDecorationLine: "underline",
  },
} );

export {
  viewStyles,
  textStyles,
};
