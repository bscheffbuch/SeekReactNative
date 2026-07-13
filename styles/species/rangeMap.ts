import { Dimensions, StyleSheet, Platform } from "react-native";
import { colors } from "../global";

const { width, height } = Dimensions.get( "screen" );

const viewStyles = StyleSheet.create( {
  legend: {
    backgroundColor: colors.seekSurface,
    borderColor: colors.seekBorder,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingBottom: ( Platform.OS === "ios" && height > 670 ) ? 23 : 13,
    paddingLeft: 22,
    paddingRight: 28,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  legendHeader: {
    backgroundColor: colors.seekPrimaryContainer,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: 56,
    width: "100%",
  },
  locationIcon: {
    bottom: 19,
    position: "absolute",
    right: 19,
  },
  map: {
    height: height - 75,
    width,
  },
  marginHorizontal: {
    marginHorizontal: 4.5,
  },
  marginLarge: {
    marginTop: 29,
  },
  marginSmall: {
    marginTop: 7,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
    marginHorizontal: 25,
    marginTop: 15,
  },
} );

const textStyles = StyleSheet.create( {
  text: {
    marginLeft: 21,
    marginTop: 3,
  },
  whiteText: {
    color: colors.seekInk,
    marginTop: 18,
    textAlign: "center",
  },
} );

export {
  textStyles,
  viewStyles,
};
