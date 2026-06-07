import { StyleSheet } from "react-native";
import { row } from "../global";

const viewStyles = StyleSheet.create( {
  row: {
    ...row,
    alignItems: "center",
    backgroundColor: "#FAF8F1",
    borderColor: "#E6E9E4",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  margins: {
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 18,
  },
  top: {
    zIndex: 1,
    position: "absolute",
    right: 2,
    padding: 18,
  },
} );

const textStyles = StyleSheet.create( {
  inputField: {
    backgroundColor: "transparent",
    borderWidth: 0,
    color: "#111512",
    flex: 1,
    height: 40,
    marginLeft: 10,
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
    width: "auto",
  },
} );

const imageStyles = StyleSheet.create( {
  search: {
    height: 22,
    width: 21,
    resizeMode: "contain",
  },
  clear: {
    height: 13,
    width: 13,
    resizeMode: "contain",
  },
} );

export {
  textStyles,
  viewStyles,
  imageStyles,
};
