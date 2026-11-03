import { StyleSheet, Dimensions } from "react-native";

const { height } = Dimensions.get( "window" );

export default StyleSheet.create( {
  card: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
    height: height / 6,
    marginHorizontal: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
  // M3 icon button (tonal) on the species row
  editIcon: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    width: 40,
    zIndex: 1,
  },
  // the post fields as one M3 filled card with inset dividers
  fieldsCard: {
    borderCurve: "continuous",
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  // M3 filled text field
  inputField: {
    borderBottomWidth: 1,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    margin: 16,
    minHeight: 88,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlignVertical: "top",
  },
  textContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
} );
