import { StyleSheet } from "react-native";

const viewStyles = StyleSheet.create( {
  backButton: {
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    position: "absolute",
    zIndex: 2,
  },
  challengeDetails: {
    paddingTop: 16,
  },
  // 48dp M3 icon button
  iconDisc: {
    alignItems: "center",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  iconDiscScrim: {
    backgroundColor: "rgba(0, 0, 0, 0.32)",
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
} );

export {
  viewStyles,
};
