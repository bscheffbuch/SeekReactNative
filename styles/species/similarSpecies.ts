import { StyleSheet, Platform } from "react-native";

import { colors } from "../global";

const viewStyles = StyleSheet.create( {
  bottomPadding: {
    backgroundColor: colors.seekCanvas,
    height: Platform.OS === "android" ? 17 : 60,
  },
  empty: {
    backgroundColor: colors.seekCanvas,
  },
  similarSpeciesContainer: {
    backgroundColor: colors.seekPrimaryContainer,
    height: 231,
  },
  similarSpeciesHeader: {
    marginBottom: 11,
    marginLeft: 28,
    marginTop: 45,
  },
} );

export default viewStyles;
