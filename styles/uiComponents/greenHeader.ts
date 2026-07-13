import { StyleSheet, I18nManager } from "react-native";
import {
  center,
  colors,
  dimensions,
} from "../global";

const viewHeaderStyles = StyleSheet.create( {
  backButton: {
    left: 0,
    paddingVertical: 18,
    paddingHorizontal: 23,
    position: "absolute",
    transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
  },
  center,
  container: {
    backgroundColor: "#F3F1E8",
    borderBottomColor: "#E6E9E4",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingBottom: 18,
    paddingTop: 20.5,
  },
  help: {
    paddingBottom: 13,
    paddingHorizontal: 21,
    paddingTop: 13,
    position: "absolute",
    right: 0,
  },
} );

const textStyles = StyleSheet.create( {
  text: {
    color: colors.seekInk,
    maxWidth: dimensions.width - 100,
  },
} );

export {
  textStyles,
  viewHeaderStyles,
};
