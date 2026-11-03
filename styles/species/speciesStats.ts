import { StyleSheet } from "react-native";

const spaceBelowTags = 6;

const viewStyles = StyleSheet.create( {
  tag: {
    borderCurve: "continuous",
    borderRadius: 8,
    flexDirection: "row",
    marginBottom: spaceBelowTags,
    marginRight: 10,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 28,
  },
  tagAndSeenDate: {
    marginBottom: 26 - spaceBelowTags,
  },
  noTags: {
    marginTop: 29,
  },
} );

const textStyles = StyleSheet.create( {
  tagText: {
    paddingHorizontal: 12,
  },
} );

export {
  viewStyles,
  textStyles,
};
