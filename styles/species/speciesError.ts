import { StyleSheet } from "react-native";
import {
  colors,
  center,
  row,
  dimensions,
} from "../global";

const viewStyles = StyleSheet.create( {
  background: {
    backgroundColor: colors.seekCanvas,
  },
  center,
  errorContainer: {
    backgroundColor: colors.seekInk,
    borderRadius: 18,
    marginTop: 18,
    paddingHorizontal: 28,
    paddingVertical: 28,
  },
  row,
} );

const textStyles = StyleSheet.create( {
  errorText: {
    marginLeft: 25,
    maxWidth: dimensions.width - ( 28 * 2 ) - 25 - 47,
    textAlign: "center",
  },
  text: {
    marginHorizontal: 28,
    marginTop: 20,
    textAlign: "center",
  },
} );

export {
  textStyles,
  viewStyles,
};
