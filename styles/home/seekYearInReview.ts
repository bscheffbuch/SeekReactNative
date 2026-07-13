import { StyleSheet } from "react-native";

const maxColumnWidth = 455;

const viewStyles = StyleSheet.create( {
  whiteContainer: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E9E4",
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  textContainer: {
    paddingTop: 21,
  },
  landscapeContainerRestrictedWidth: {
    width: maxColumnWidth,
    alignSelf: "center",
  },
  marginGreenButtonLarge: {
    marginTop: 33,
  },
  marginBottom: {
    marginTop: 48,
  },
} );

const textStyles = StyleSheet.create( {
  header: {
    paddingLeft: 0,
  },
} );

export { viewStyles, textStyles };
