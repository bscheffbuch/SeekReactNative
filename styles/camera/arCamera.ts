import { StyleSheet, Dimensions } from "react-native";
import { colors } from "../global";

const { height } = Dimensions.get( "window" );

const viewStyles = StyleSheet.create( {
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(10, 14, 11, 0.56)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    left: 16,
    position: "absolute",
    top: height > 700 ? 44 : 18,
    width: 44,
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
    alignItems: "center",
    backgroundColor: "rgba(10, 14, 11, 0.56)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 16,
    top: height > 700 ? 44 : 18,
    width: 44,
  },
  queueButton: {
    alignItems: "center",
    backgroundColor: "rgba(10, 14, 11, 0.58)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 48,
    justifyContent: "center",
    minWidth: 48,
    paddingHorizontal: 12,
    position: "absolute",
    right: 18,
    top: ( height > 700 ? 31 : 0 ) + 64,
  },
  queueBadge: {
    alignItems: "center",
    backgroundColor: colors.seekGold,
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
    minWidth: 22,
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
  helpIcon: {
    height: 28,
    width: 28,
  },
  settingsIcon: {
    tintColor: colors.white,
    height: 20,
    width: 20,
  },
} );

const textStyles = StyleSheet.create( {
  queueBadgeText: {
    color: colors.seekInk,
    fontSize: 13,
    fontWeight: "800",
  },
} );

export {
  viewStyles,
  imageStyles,
  textStyles,
};
