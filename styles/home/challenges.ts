import { StyleSheet } from "react-native";
import { colors } from "../global";

const viewStyles = StyleSheet.create( {
  challengeContainer: {
    backgroundColor: colors.seekInk,
    borderRadius: 18,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  container: {
    backgroundColor: "#F3F1E8",
  },
  header: {
    paddingBottom: 12,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  marginMedium: {
    marginTop: 28,
  },
  marginSmall: {
    marginTop: 22,
  },
  marginTop: {
    marginTop: 31,
  },
} );

const textStyles = StyleSheet.create( {
  viewText: {
    alignSelf: "center",
    paddingBottom: 22,
    paddingTop: 15,
  },
} );

export {
  viewStyles,
  textStyles,
};
