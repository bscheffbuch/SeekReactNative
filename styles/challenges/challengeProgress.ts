import { StyleSheet } from "react-native";
import {
  row,
  dimensions,
} from "../global";

const { height, width } = dimensions;

const viewStyles = StyleSheet.create( {
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E9E4",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 112,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: "#142018",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  row,
  startButton: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    width: 64,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    width: height > 570 ? width - ( 110 * 2 ) : 170,
  },
} );

const textStyles = StyleSheet.create( {
  messageText: {
    color: "#707A72",
    fontSize: 12.5,
    lineHeight: 18,
  },
  startText: {
    color: "#14794F",
    fontSize: 12,
    textAlign: "center",
  },
  titleText: {
    color: "#111512",
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 1,
  },
} );

const imageStyles = StyleSheet.create( {
  challengeBadgeIcon: {
    height: 64,
    marginRight: 12,
    resizeMode: "contain",
    width: 64,
  },
} );

export {
  textStyles,
  viewStyles,
  imageStyles,
};
