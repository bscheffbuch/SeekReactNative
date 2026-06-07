import { StyleSheet, Platform } from "react-native";
import {
  center,
} from "../global";

export default StyleSheet.create( {
  center,
  container: {
    backgroundColor: "#F3F1E8",
    flex: 1,
  },
  emptyText: {
    color: "#707A72",
    paddingTop: 14,
    paddingBottom: 31,
    textAlign: "center",
  },
  flexGrow: {
    flexGrow: 1,
  },
  padding: {
    backgroundColor: "#F3F1E8",
    paddingBottom: Platform.OS === "android" ? 112 : 60,
  },
  hiddenSectionSeparator: {
    paddingBottom: 31,
  },
  sectionWithDataSeparator: {
    paddingBottom: 14,
  },
  bottomOfSectionPadding: {
    paddingBottom: 12,
  },
  text: {
    textAlign: "center",
  },
  whiteContainer: {
    backgroundColor: "#F3F1E8",
    flex: 1,
  },
} );
