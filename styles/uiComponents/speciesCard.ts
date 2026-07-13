import { StyleSheet } from "react-native";
import {
  row,
  dimensions,
} from "../global";

const viewStyles = StyleSheet.create( {
  image: {
    borderRadius: 8,
    height: 76,
    marginRight: 14,
    width: 76,
  },
  notTouchable: {
    width: 276,
  },
  row: {
    ...row,
    alignItems: "center",
  },
  speciesNameContainer: {
    flex: 1,
    maxWidth: 220,
    minWidth: 0,
  },
  touchableArea: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E9E4",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 96,
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: dimensions.width - 36,
  },
} );

const textStyles = StyleSheet.create( {
  commonNameText: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 17,
    lineHeight: 22,
  },
  scientificNameHeaderText: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 17,
    lineHeight: 22,
  },
  scientificNameText: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
} );

export {
  viewStyles,
  textStyles,
};
