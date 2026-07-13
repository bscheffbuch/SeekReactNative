import { StyleSheet } from "react-native";
import { colors, dimensions } from "../../global";

const viewStyles = StyleSheet.create( {
  innerContainer: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.seekSurface,
    borderColor: colors.seekBorder,
    borderRadius: 22,
    borderWidth: 1,
    maxHeight: 558,
    maxWidth: 366,
    shadowColor: colors.seekShadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    width: dimensions.width > 350
      ? dimensions.width - dimensions.width * 0.1
      : dimensions.width,
    // this creates margins on smaller screen sizes
  },
} );

export default viewStyles;
