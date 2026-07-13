import { StyleSheet } from "react-native";
import {
  center,
  row,
} from "../global";

const maxColumnWidth = 455;

const viewStyles = StyleSheet.create( {
  center,
  secondHeader: {
    marginTop: 23,
    marginBottom: 10,
  },
  marginSmall: {
    marginTop: 23,
  },
  marginOpenINat: {
    marginTop: 33,
  },
  row,
  container: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E9E4",
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    paddingTop: 18,
  },
  topMarginWithChallenge: {
    backgroundColor: "#FFFFFF",
    paddingTop: 18,
  },
  textContainer: {
    paddingHorizontal: 33,
  },
  headerPadding: {
    paddingLeft: 16,
  },
  landscapeContainerRestrictedWidth: {
    width: maxColumnWidth,
    alignSelf: "center",
  },
  marginBottom: {
    paddingBottom: 45,
  },
} );

const textStyles = StyleSheet.create( {
  linkText: {
    textDecorationLine: "underline",
    alignSelf: "center",
    paddingTop: 23,
    paddingBottom: 33,
  },
} );

export {
  viewStyles,
  textStyles,
};
