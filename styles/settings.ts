import { StyleSheet } from "react-native";
import {
  row,
  center,
  dimensions,
} from "./global";
import { baseTextStyles } from "./textStyles";

const { width } = dimensions;

const greenButton = {
  ...baseTextStyles.button,
  backgroundColor: "#FAF8F1",
  borderColor: "#E6E9E4",
  borderRadius: 14,
  borderWidth: 1,
  color: "#111512",
  paddingBottom: 11,
  paddingHorizontal: 18,
  textAlign: "center" as const,
  paddingTop: 12,
};

const buttonContainer = {
  paddingVertical: 19,
  alignItems: "center" as const,
  zIndex: -100,
};

const viewStyles = StyleSheet.create( {
  center,
  checkBox: {
    paddingRight: 10.3,
  },
  checkboxRow: {
    marginTop: 17,
  },
  leftMargin: {
    marginBottom: 5,
    marginLeft: 10,
  },
  margin: {
    marginTop: 18,
  },
  marginGreenButton: {
    marginTop: 19,
  },
  marginHorizontal: {
    justifyContent: "space-between",
    marginHorizontal: 16,
  },
  tabletContainer: {
    maxWidth: 455,
    alignSelf: "center",
  },
  marginMedium: {
    marginTop: 22,
  },
  marginSmall: {
    marginTop: 15,
  },
  marginTop: {
    marginTop: 16,
  },
  radioButtonSmallMargin: {
    paddingTop: 19 / 2,
  },
  radioMargin: {
    paddingVertical: 10,
    paddingLeft: 4,
  },
  donateMarginBottom: {
    paddingTop: 16,
  },
  radioButtonMarginBottom: {
    paddingTop: 16,
  },
  row,
  switch: {
    paddingVertical: 19 / 2,
    marginRight: 16,
  },
  inputIOS: greenButton,
  inputIOSContainer: buttonContainer,
  inputAndroid: greenButton,
  inputAndroidContainer: buttonContainer,
} );

const textStyles = StyleSheet.create( {
  seasonalityRadioButtonText: {
    maxWidth: width - ( 28 * 2 ) - 30 - 10.3,
    marginTop: -3,
  },
  autoCaptureText: {
    maxWidth: width - ( 28 * 2 ) - 30 - 10.3,
  },
} );

export {
  textStyles,
  viewStyles,
};
