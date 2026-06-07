import { StyleSheet } from "react-native";
import {
  colors,
} from "../../global";

const maxColumnWidth = 455;

const viewStyles = StyleSheet.create( {
  whiteContainer: {
    backgroundColor: colors.seekSurface,
    borderColor: colors.seekBorder,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: colors.seekShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  marginGreenButton: {
    marginTop: 22,
  },
  marginGreenButtonLarge: {
    marginTop: 33,
  },
  marginBottom: {
    marginTop: 12,
  },
  textContainer: {
    paddingTop: 10,
  },
  paddingAboveText: {
    paddingTop: 10,
  },
  landscapeContainerRestrictedWidth: {
    width: maxColumnWidth,
    alignSelf: "center",
  },
} );

const textStyles = StyleSheet.create( {
  header: {
    paddingLeft: 0,
  },
} );

export {
  textStyles,
  viewStyles,
};
