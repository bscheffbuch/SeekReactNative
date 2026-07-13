import { StyleSheet, Platform } from "react-native";

const viewStyles = StyleSheet.create( {
  padding: {
    backgroundColor: "#F3F1E8",
    paddingBottom: Platform.OS === "android" ? 112 : 60,
  },
} );

export default viewStyles;
