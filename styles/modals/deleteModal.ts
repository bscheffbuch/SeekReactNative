import { StyleSheet } from "react-native";
import {
  colors,
  row,
} from "../global";

const viewStyles = StyleSheet.create( {
  flagBackButton: {
    marginLeft: 33,
    marginRight: 29,
  },
  flagHeader: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: 62,
    width: "100%",
  },
  flagTextContainer: {
    justifyContent: "flex-end",
    marginTop: 15,
  },
  margin: {
    marginTop: 27,
  },
  marginLarge: {
    marginTop: 32,
  },
  marginSmall: {
    marginTop: 16,
  },
  row,
} );

const textStyles = StyleSheet.create( {
  buttonText: {
    color: colors.seekInk,
    marginRight: 15,
    paddingTop: 9,
    textAlign: "center",
  },
  text: {
    textAlign: "center",
    width: 292,
  },
} );

export {
  textStyles,
  viewStyles,
};
