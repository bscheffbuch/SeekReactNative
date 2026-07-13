import { StyleSheet } from "react-native";

const viewStyles = StyleSheet.create( {
  back: {
    padding: 18,
    position: "absolute",
    right: 23 - 18,
    top: 0,
  },
  bottom: {
    backgroundColor: "#F3F1E8",
    height: 60,
  },
  container: {
    backgroundColor: "#F3F1E8",
    flex: 1,
  },
  header: {
    backgroundColor: "#F3F1E8",
    borderBottomColor: "#E6E9E4",
    borderBottomWidth: 1,
    height: 55,
  },
} );

const textStyles = StyleSheet.create( {
  text: {
    alignSelf: "center",
    top: 19,
  },
} );

export {
  viewStyles,
  textStyles,
};
