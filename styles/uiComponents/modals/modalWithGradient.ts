import { StyleSheet, Platform } from "react-native";
import {
  colors,
  row,
} from "../../global";

const viewStyles = StyleSheet.create( {
  backButton: {
    marginLeft: 33,
    marginRight: 29,
  },
  container: {
    alignSelf: "center",
    backgroundColor: colors.seekSurface,
    borderColor: colors.seekBorder,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    width: 337,
  },
  grayButton: {
    backgroundColor: colors.seekPrimaryContainer,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 5,
    position: "absolute",
    right: 17.5,
    top: 55,
  },
  header: {
    backgroundColor: colors.seekPrimaryContainer,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: 167,
    overflow: "visible",
  },
  headerTextContainer: {
    justifyContent: "flex-end",
    marginTop: 15,
  },
  imageCell: {
    borderRadius: 129 / 2,
    height: 129,
    width: 129,
  },
  images: {
    justifyContent: "center",
    marginHorizontal: 22,
    marginTop: 20,
  },
  innerContainer: {
    alignItems: "center",
  },
  marginLarge: {
    marginTop: 55,
  },
  marginLeft: {
    marginLeft: 17,
  },
  marginMedium: {
    marginTop: 32,
  },
  row,
} );

const textStyles = StyleSheet.create( {
  buttonText: {
    color: colors.seekInk,
    paddingTop: Platform.OS === "ios" ? 7 : 0,
    textAlign: "center",
  },
  grayButtonText: {
    fontSize: 11,
  },
} );

export {
  viewStyles,
  textStyles,
};
