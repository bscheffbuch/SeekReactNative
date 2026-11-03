import { StyleSheet, I18nManager } from "react-native";


const viewStyles = StyleSheet.create( {
  leftArrow: {
    left: 0,
    paddingLeft: 5,
    paddingRight: 20,
    paddingVertical: 20,
    position: "absolute",
    top: 1010,
    zIndex: 1,
  },
  rightArrow: {
    paddingLeft: 20,
    paddingRight: 5,
    paddingVertical: 20,
    position: "absolute",
    right: 0,
    top: 1010,
    zIndex: 1,
  },
  // scrim disc so the arrow reads on any photo
  arrowDisc: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.32)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  rotate: {
    transform: [{ rotate: I18nManager.isRTL ? "0deg" : "180deg" }],
  },
  rotateRTL: {
    transform: [{ rotate: I18nManager.isRTL ? "180deg" : "0deg" }],
  },
  speciesLeftArrow: {
    top: 100,
  },
  speciesPhotoContainer: {
    backgroundColor: "#0F1511",
  },
  speciesRightArrow: {
    top: 100,
  },
  yearInReviewArrow: {
    top: 70,
  },
  bigContainer: {
    height: 375,
  },
  smallContainer: {
    height: 250,
  },
} );

export default viewStyles;
