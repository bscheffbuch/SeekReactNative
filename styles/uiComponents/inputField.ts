import { StyleSheet } from "react-native";
import { colors, dimensions } from "../global";

const textStyles = StyleSheet.create( {
  inputField: {
    backgroundColor: colors.seekSurface,
    borderColor: colors.seekBorder,
    borderRadius: 14,
    borderWidth: 1,
    height: 37,
    marginHorizontal: dimensions.height > 570 ? 34 : 20,
    paddingHorizontal: 15,
  },
} );

export default textStyles;
