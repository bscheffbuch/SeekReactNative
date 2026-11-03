import { StyleSheet, Platform } from "react-native";
import {
  colors,
  dimensions,
} from "../global";


const viewStyles = StyleSheet.create( {
  backButton: {
    left: 23,
    paddingBottom: 18,
    paddingTop: 18,
  },
  card: {
    marginBottom: 18,
    marginLeft: 24,
  },
  container: {
    backgroundColor: "#F3F1E8",
    flex: 1,
  },
  whiteContainer: {
    backgroundColor: "#F3F1E8",
  },
  header: {
    backgroundColor: "#F3F1E8",
    height: 55,
  },
  headerMargins: {
    marginTop: 27,
    marginLeft: 24,
    marginBottom: 18,
  },
  photoContainer: {
    alignItems: "center",
    backgroundColor: colors.black,
    height: 155,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  // M3 search bar
  searchPill: {
    alignItems: "center",
    borderRadius: 28,
    flexDirection: "row",
    height: 56,
    paddingHorizontal: 16,
  },
  suggestionsTopMargin: {
    marginTop: 23,
  },
} );

const textStyles = StyleSheet.create( {
  topHeader: {
    alignSelf: "center",
    paddingTop: Platform.OS === "android" ? 18 : 20,
    position: "absolute",
  },
  inputField: {
    flex: 1,
    height: 56,
    marginLeft: 12,
    paddingBottom: 0,
    paddingTop: 0,
  },
} );

const imageStyles = StyleSheet.create( {
  image: {
    height: 155,
    resizeMode: "contain",
    width: dimensions.width,
  },
} );

export {
  viewStyles,
  textStyles,
  imageStyles,
};
