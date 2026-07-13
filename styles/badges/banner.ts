import { StyleSheet } from "react-native";

const viewStyles = StyleSheet.create( {
  banner: {
    alignSelf: "center",
    backgroundColor: "#DEF0E7",
    borderRadius: 999,
    marginBottom: 18,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modal: {
    marginBottom: 26,
    marginTop: 32,
  },
} );

const textStyles = StyleSheet.create( {
  bannerText: {
    color: "#14794F",
    fontFamily: "Lato-Bold",
    fontSize: 13,
    lineHeight: 17,
    textAlign: "center",
  },
} );

export {
  textStyles,
  viewStyles,
};
