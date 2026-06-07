import {
  StyleSheet,
  Platform,
} from "react-native";
import {
  colors,
  row,
  dimensions,
} from "../global";

const viewStyles = StyleSheet.create( {
  button: {
    paddingBottom: dimensions.height > 570 ? 24 : 17,
    paddingTop: dimensions.height > 570 ? 28 : 26,
  },
  header: {
    backgroundColor: colors.seekPrimaryContainer,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: 67,
    justifyContent: "center",
    width: "100%",
  },
  margin: {
    marginTop: 28,
  },
  marginSmall: {
    marginTop: dimensions.height > 570 ? 18 : 26,
  },
  marginTop: {
    marginTop: dimensions.height > 570 ? 26 : 24,
  },
  row,
  checkbox: {
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    marginRight: 12,
    width: 24,
  },
  reminderRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: dimensions.height > 570 ? 20 : 14,
    paddingHorizontal: 26,
    width: "100%",
  },
} );

const textStyles = StyleSheet.create( {
  headerText: {
    color: colors.seekInk,
    paddingTop: Platform.OS === "ios" ? 9 : 0,
    textAlign: "center",
  },
  text: {
    maxWidth: 206,
  },
  wideText: {
    maxWidth: 270,
    textAlign: "center",
  },
  reminderText: {
    flex: 1,
  },
} );

const imageStyles = StyleSheet.create( {
  image: {
    height: 40,
    marginRight: 22,
    resizeMode: "contain",
    width: 40,
  },
} );

export {
  viewStyles,
  textStyles,
  imageStyles,
};
