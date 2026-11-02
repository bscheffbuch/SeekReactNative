import { StyleSheet, Dimensions } from "react-native";
import { center } from "./global";

const { height } = Dimensions.get( "window" );

const viewStyles = StyleSheet.create( {
  activeDot: {
    borderRadius: 4,
    width: 24,
  },
  button: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    minWidth: 140,
    paddingHorizontal: 28,
  },
  buttonLabel: {
    fontSize: 16,
    letterSpacing: 0.1,
  },
  buttonRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  center,
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    borderRadius: 4,
    height: 8,
    marginHorizontal: 4,
    width: 8,
  },
  imageCard: {
    alignItems: "center",
    borderRadius: 28,
    height: Math.min( 360, height * 0.42 ),
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  imageFill: {
    height: "100%",
    width: "100%",
  },
  page: {
    alignItems: "center",
    paddingHorizontal: 24,
    width: "100%",
  },
  pagination: {
    flexDirection: "row",
    marginBottom: 24,
    marginTop: 16,
  },
  textButton: {
    borderRadius: 20,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  textButtonLabel: {
    fontSize: 15,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    marginTop: 32,
    maxWidth: 340,
    textAlign: "center",
  },
} );

export {
  viewStyles,
};
