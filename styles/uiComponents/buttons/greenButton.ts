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
    borderRadius: 14,
    height: getFontScale() > 1 ? 64 : 48,
    justifyContent: "center",
    maxWidth: 317,
    shadowColor: colors.seekDeepGreen,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    width: dimensions.width < 500 ? 293 : 317,
    elevation: 2,
  } as const,
  loginHeight: {
    height: 52,
    marginHorizontal: dimensions.height > 570 ? 34 : 20,
  } as const,
} );

const textStyles = StyleSheet.create( {
  buttonText: {
    textAlign: "center",
  } as const,
} );

export {
  viewStyles,
  textStyles,
};
