import { StyleSheet } from "react-native";
import { colors } from "../global";

const viewStyles = StyleSheet.create( {
  back: {
    padding: 18,
    position: "absolute",
    right: 23 - 18,
    top: 0,
  },
  bottom: {
    backgroundColor: colors.seekCanvas,
    height: 60,
  },
  container: {
    backgroundColor: colors.seekCanvas,
    flex: 1,
  },
  header: {
    backgroundColor: colors.seekCanvas,
    borderBottomColor: colors.seekBorder,
    borderBottomWidth: 1,
    height: 55,
  },
  whiteContainer: {
    backgroundColor: colors.seekCanvas,
    flexGrow: 1,
  },
  selectedPressableArea: {
    backgroundColor: "rgb(176, 196, 222)",
  },
} );

const textStyles = StyleSheet.create( {
  text: {
    alignSelf: "center",
    top: 19,
  },
  blackText: {
    paddingHorizontal: 24,
    paddingTop: 24,
    textAlign: "center",
  },
  donateText: {
    top: 19,
    paddingHorizontal: 24,
    marginVertical: 14,
    paddingVertical: 10,
    alignSelf: "center",
    textAlign: "center",
  },
} );

export {
  viewStyles,
  textStyles,
};
