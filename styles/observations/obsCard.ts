import { StyleSheet } from "react-native";

import { row, dimensions } from "../global";

const viewStyles = StyleSheet.create( {
  card: {
    paddingHorizontal: 18,
    width: dimensions.width + 73 + 24,
    paddingVertical: 6,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#B33A3A",
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    marginLeft: 12,
    marginTop: 16,
    width: 54,
  },
  animatedView: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  row,
} );

export default viewStyles;
