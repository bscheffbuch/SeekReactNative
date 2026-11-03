import { StyleSheet, Platform } from "react-native";
import { colors, row } from "../global";

const viewStyles = StyleSheet.create( {
  container: {
    backgroundColor: colors.seekCanvas,
    flex: 1,
  },
  margin: {
    marginTop: 19,
  },
  gap: {
    width: 8,
  },
  iconDisc: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  paragraph: {
    marginBottom: 16,
  },
  row,
  textContainer: {
    backgroundColor: colors.seekCanvas,
    marginHorizontal: 16,
    marginTop: 24,
  },
} );

const textStyles = StyleSheet.create( {
  headerText: {
    justifyContent: "center",
    flexShrink: 1,
    marginLeft: 16,
    paddingTop: Platform.OS === "ios" ? 6 : 0,
  },
  italicText: {
    marginHorizontal: 20,
    textAlign: "center",
  },
  text: {
    marginBottom: 35,
    marginTop: 16,
  },
} );

export {
  textStyles,
  viewStyles,
};
