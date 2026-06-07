import { StyleSheet } from "react-native";
import {
  colors,
  row,
  dimensions,
} from "./global";

const { width } = dimensions;

const viewStyles = StyleSheet.create( {
  card: {
    height: 112,
    justifyContent: "flex-start",
    marginHorizontal: 22,
  },
  container: {
    backgroundColor: "#F3F1E8",
    flex: 1,
  },
  containerWhite: {
    backgroundColor: "#F3F1E8",
  },
  divider: {
    backgroundColor: "#E6E9E4",
    height: 1,
    marginHorizontal: 18,
  },
  flex: {
    flex: 1,
  },
  greenDot: {
    backgroundColor: colors.seekiNatGreen,
    borderRadius: 11 / 2,
    height: 11,
    width: 11,
  },
  row,
  textContainer: {
    width: width - 161,
  },
} );

const textStyles = StyleSheet.create( {
  titleText: {
    marginBottom: 6,
  },
} );


const imageStyles = StyleSheet.create( {
  image: {
    height: 72,
    marginRight: 24,
    resizeMode: "contain",
    width: 72,
  },
} );

export {
  textStyles,
  viewStyles,
  imageStyles,
};
