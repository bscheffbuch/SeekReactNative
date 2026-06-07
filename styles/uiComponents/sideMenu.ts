import { StyleSheet } from "react-native";

import { colors } from "../global";

const viewStyles = StyleSheet.create( {
  container: {
    backgroundColor: colors.seekCanvas,
    flex: 1,
    flexGrow: 1,
    justifyContent: "center",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.seekBorder,
  },
  menuItem: {
    paddingVertical: 21,
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
  },
} );

const imageStyles = StyleSheet.create( {
  icon: {
    height: 25,
    marginHorizontal: 25,
    resizeMode: "contain",
    tintColor: colors.seekDeepGreen,
    width: 27,
  },
  seekLogo: {
    alignSelf: "center",
    height: 79,
    marginVertical: 62 - 21,
    resizeMode: "contain",
    width: 223,
  },
} );

const textStyles = StyleSheet.create( {
  text: {
    color: colors.seekInk,
    flex: 1,
    paddingEnd: 4,
  },
} );

export {
  textStyles,
  imageStyles,
  viewStyles,
};
