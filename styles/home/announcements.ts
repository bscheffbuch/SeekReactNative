import { StyleSheet } from "react-native";

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
  marginGreenButtonLarge: {
    marginTop: 33,
  },
  marginBottom: {
    marginTop: 48,
  },
} );

const textStyles = StyleSheet.create( {
  header: {
    paddingBottom: 12,
    paddingLeft: 0,
  },
} );

export { viewStyles, textStyles };
