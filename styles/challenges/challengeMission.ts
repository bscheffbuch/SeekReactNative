import { StyleSheet } from "react-native";

const viewStyles = StyleSheet.create( {
  subBullets: {
    borderRadius: 3,
    height: 6,
    marginRight: 10,
    marginTop: 9,
    width: 6,
  },
  circleStyle: {
    height: 59,
    width: 59,
  },
  container: {
    marginBottom: 20,
    marginTop: 36,
  },
  marginTop: {
    marginTop: 6,
  },
  missionRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  textContainer: {
    flex: 1,
    paddingRight: 18,
  },
} );

const textStyles = StyleSheet.create( {
  bullets: {
    fontSize: 29,
    marginTop: 7,
    alignItems: "center",
    marginRight: 22,
  },
  greenText: {
    marginTop: 9,
    maxWidth: 274,
  },
  secondLevelBulletText: {
    marginTop: 6,
    maxWidth: 274,
  },
  text: {
    marginTop: 16,
    maxWidth: 274,
  },
} );


const imageStyles = StyleSheet.create( {
  checklist: {
    marginRight: 16,
    marginTop: 12,
  },
} );

export {
  textStyles,
  viewStyles,
  imageStyles,
};

