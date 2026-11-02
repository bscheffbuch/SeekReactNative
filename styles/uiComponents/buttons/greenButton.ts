import { StyleSheet, PixelRatio } from "react-native";
import {
  colors,
  dimensions,
} from "../../global";

const { getFontScale } = PixelRatio;

const viewStyles = StyleSheet.create( {
  greenButton: {
    alignSelf: "center",
    backgroundColor: colors.seekDeepGreen,
    borderRadius: getFontScale() > 1 ? 32 : 24,
    height: getFontScale() > 1 ? 64 : 48,
    justifyContent: "center",
    maxWidth: 317,
    paddingHorizontal: 24,
    width: dimensions.width < 500 ? 293 : 317,
  } as const,
  loginHeight: {
    height: 52,
    marginHorizontal: dimensions.height > 570 ? 34 : 20,
  } as const,
} );

const textStyles = StyleSheet.create( {
  buttonText: {
    fontSize: 15,
    letterSpacing: 0.1,
    textAlign: "center",
  } as const,
} );

export {
  viewStyles,
  textStyles,
};
