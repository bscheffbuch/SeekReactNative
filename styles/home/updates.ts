import { StyleSheet } from "react-native";
import { center, row } from "../global";

const viewStyles = StyleSheet.create( {
  center,
  container: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E9E4",
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    paddingBottom: 18,
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  row,
} );

const imageStyles = StyleSheet.create( {
  image: {
    height: 68,
    marginRight: 28,
    resizeMode: "contain",
    width: 68,
  },
} );

const textStyles = StyleSheet.create( {
  text: {
    marginTop: 11,
  },
  textWidth: {
    width: 215,
  },
} );

export {
  viewStyles,
  imageStyles,
  textStyles,
};
