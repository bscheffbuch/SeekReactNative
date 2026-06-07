import { StyleSheet } from "react-native";
import {
  colors,
  row,
} from "../global";

const viewStyles = StyleSheet.create( {
  container: {
    backgroundColor: "#F3F1E8",
    paddingTop: 8,
  },
  header: {
    color: colors.seekInk,
    marginBottom: 22,
    marginLeft: 23,
    marginTop: 23,
  },
  marginBottom: {
    marginBottom: 23,
  },
  marginLeft: {
    marginLeft: 22,
  },
  paddingBottom: {
    paddingBottom: 15,
  },
  paddingTop: {
    paddingTop: 15,
  },
  row,
  speciesNearbyContainer: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E9E4",
    borderRadius: 18,
    borderWidth: 1,
    height: 223,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  speciesNearbyPadding: {
    backgroundColor: "#F3F1E8",
    paddingBottom: 20,
  },
  whiteButton: {
    backgroundColor: "#DEF0E7",
    borderRadius: 999,
    paddingBottom: 4,
    paddingHorizontal: 9,
    paddingTop: 4,
  },
  locationPickerButton: {
    paddingBottom: 15,
    marginLeft: 22,
  },
} );

const imageStyles = StyleSheet.create( {
  image: {
    height: 21,
    marginLeft: 10,
    marginRight: 13,
    resizeMode: "contain",
    tintColor: colors.seekDeepGreen,
    width: 16,
  },
} );

export {
  viewStyles,
  imageStyles,
};
