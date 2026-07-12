import { StyleSheet } from "react-native";
import { colors } from "../global";

// local shades that don't exist in the global palette; kept as named
// constants so the queue list matches its original design
const borderGray = "#eeeeee";
const selectedGreenTint = "#eef7f0";
const placeholderGray = "#dddddd";
const secondaryTextGray = "#666666";

const viewStyles = StyleSheet.create( {
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: borderGray,
  },
  rowSelected: {
    backgroundColor: selectedGreenTint,
  },
  rowPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnailWrapper: {
    width: 64,
    height: 64,
  },
  thumbnailPlaceholder: {
    backgroundColor: placeholderGray,
  },
  photoCountBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.seekTeal,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  info: {
    flex: 1,
    paddingHorizontal: 14,
  },
  deleteButton: {
    padding: 6,
  },
  actions: {
    marginTop: 24,
    alignItems: "center",
  },
  spacer: {
    height: 14,
  },
} );

const textStyles = StyleSheet.create( {
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: colors.seekForestGreen,
  },
  photoCountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  date: {
    color: colors.black,
  },
  location: {
    color: secondaryTextGray,
    marginTop: 2,
  },
  selectedLabel: {
    color: colors.seekTeal,
    marginTop: 2,
    fontWeight: "700",
  },
  loginHint: {
    color: secondaryTextGray,
    textAlign: "center",
    marginTop: 10,
  },
} );

const imageStyles = StyleSheet.create( {
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  deleteIcon: {
    width: 28,
    height: 28,
  },
} );

export {
  viewStyles,
  textStyles,
  imageStyles,
};
