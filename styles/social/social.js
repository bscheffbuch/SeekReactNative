import { StyleSheet, PixelRatio } from "react-native";
import { colors, center, fonts, dimensions, row, padding } from "../global";

const { getFontScale } = PixelRatio;


const viewStyles = StyleSheet.create( {
  center,
  header: {
    height: 56,
  },
  spaceBeforeButtons: {
    marginTop: 23,
  },
  spaceBetweenButtons: {
    marginTop: 23,
  },
  photoTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  roundedIndicator: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    height: 3,
    width: 138,
  },
  hiddenIndicator: {
    height: 3,
    width: 138,
  },
  tabDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  row,
  checkboxRow: {
    marginLeft: 12,
  },
  checkbox: {
    paddingHorizontal: 12,
    paddingVertical: 17,
  },
  cropScreenContainer: {
    flex: 1,
  },
  cropFooter: {
    height: 91,
    justifyContent: "center",
  },
  imageCropContainer: {
    flex: 1,
  },
  cropButton: {
    alignItems: "flex-end",
    padding: 12,
  },
  cropDisc: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.32)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  cropView: {
    height: dimensions.height - 55 - 91 - 46,
    backgroundColor: colors.black,
  },
  hiddenCropView: {
    flex: 1,
  },
  backButton: {
    left: 0,
    paddingVertical: 18,
    paddingHorizontal: 23,
    position: "absolute",
    zIndex: 1,
  },
  overlay: {
    opacity: 0.25,
  },
  centerCropButton: {
    justifyContent: "center",
  },
  greenButton: {
    alignSelf: "center",
    borderRadius: 24,
    height: getFontScale() > 1 ? 79 : 48,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    maxWidth: 317,
    width: dimensions.width < 500 ? 293 : 317,
  },
  whiteContainer: {
    flex: 1,
  },
  headerText: {
    alignSelf: "center",
    paddingTop: 18,
    position: "absolute",
  },
} );

const textStyles = StyleSheet.create( {
  photoSizeText: {
    color: colors.seekDeepGreen,
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0,
  },
  selectedPhotoSizeText: {
    fontFamily: fonts.semibold,
  },
  linkText: {
    alignSelf: "center",
    fontFamily: fonts.semibold,
    fontSize: 16,
    paddingVertical: 24,
  },
  optionsText: {
    // modalBanner
    color: colors.seekDeepGreen,
    fontFamily: fonts.semibold,
    fontSize: 19,
    letterSpacing: 0,
    marginTop: 18,
    marginLeft: 24,
  },
  speciesIdText: {
    fontFamily: fonts.book,
    fontSize: 16,
  },
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: 0,
    paddingTop: padding.iOSButtonPadding,
    textAlign: "center",
    marginLeft: 10,
  },
} );

const imageStyles = StyleSheet.create( {
  image: {
    backgroundColor: colors.black,
    width: dimensions.width,
    // containing the image shows an accurate watermark on the social screen
    resizeMode: "contain",
    height: dimensions.height,
  },
  squareImage: {
    width: dimensions.width,
    // containing the image shows an accurate watermark on the social screen
    resizeMode: "contain",
    height: dimensions.width,
    backgroundColor: colors.black,
  },
} );

export {
  textStyles,
  viewStyles,
  imageStyles,
};
