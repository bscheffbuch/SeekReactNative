import { StyleSheet, Dimensions } from "react-native";
import { colors } from "../global";

const { height } = Dimensions.get( "window" );

const viewStyles = StyleSheet.create( {
  backButton: {
    left: 0,
    paddingHorizontal: 23,
    paddingVertical: 19,
    position: "absolute",
    top: height > 700 ? 31 : 0,
  },
  shadow: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  settingsButton: {
    right: 0,
    paddingHorizontal: 23,
    paddingVertical: 19,
    position: "absolute",
    top: height > 700 ? 31 : 0,
  },
  queueButton: {
    right: 18,
    position: "absolute",
    top: ( height > 700 ? 31 : 0 ) + 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderColor: colors.white,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  queueBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.seekGreen,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  camera: {
    zIndex: -1,
  },
  container: {
    alignItems: "center",
    backgroundColor: colors.black,
    flex: 1,
  },
} );

const imageStyles = StyleSheet.create( {
  settingsIcon: {
    tintColor: colors.white,
    height: 20,
    width: 20,
  },
} );

const textStyles = StyleSheet.create( {
  queueBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
} );

export {
  viewStyles,
  imageStyles,
  textStyles,
};
