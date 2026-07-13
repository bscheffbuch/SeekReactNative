import { StyleSheet, I18nManager } from "react-native";
import {
  colors,
  dimensions,
  row,
} from "../global";

const viewStyles = StyleSheet.create( {
  container: {
    backgroundColor: colors.seekCanvas,
    flex: 1,
  },
  footer: {
    backgroundColor: colors.seekSurface,
    borderTopColor: colors.seekBorder,
    borderTopWidth: 1,
    paddingBottom: dimensions.height > 670 ? 35 : 15,
    paddingTop: 15,
  },
  greenCircle: {
    backgroundColor: colors.seekPrimaryContainer,
    borderRadius: 281 / 2,
    height: 281,
    opacity: 0.33,
    width: 281,
  },
  header: {
    backgroundColor: colors.seekCanvas,
  },
  image: {
    padding: 5,
  },
  inputRow: {
    justifyContent: "space-between",
    marginBottom: 15,
    marginHorizontal: 23,
    marginTop: 20,
  },
  locationIcon: {
    bottom: 19,
    position: "absolute",
    right: 19,
  },
  map: {
    backgroundColor: colors.seekSurface,
    borderBottomColor: colors.seekBorder,
    borderBottomWidth: 1,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  margin: {
    marginTop: 15,
  },
  marginLarge: {
    marginTop: 20,
  },
  pinFixed: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  row,
  textContainer: {
    backgroundColor: colors.seekSurface,
    borderBottomColor: colors.seekBorder,
    borderBottomWidth: 1,
    justifyContent: "center",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  backButton: {
    left: 0,
    paddingVertical: 18,
    paddingHorizontal: 23,
    position: "absolute",
    transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
  },
} );

const textStyles = StyleSheet.create( {
  headerText: {
    alignSelf: "center",
    maxWidth: dimensions.width - 100,
  },
  text: {
    textAlign: "center",
    marginHorizontal: 20,
  },
  inputField: {
    backgroundColor: colors.seekSurface,
    borderColor: colors.seekBorder,
    borderRadius: 14,
    borderWidth: 1,
    height: 37,
    paddingBottom: 0,
    paddingLeft: 20,
    paddingTop: 0,
    width: "91%",
  },
} );

const imageStyles = StyleSheet.create( {
  white: {
    height: 19,
    resizeMode: "contain",
    tintColor: colors.seekDeepGreen,
    width: 14,
  },
  markerPin: {
    height: 33,
    width: 23,
    marginLeft: 14,
  },
} );

export {
  viewStyles,
  textStyles,
  imageStyles,
};
