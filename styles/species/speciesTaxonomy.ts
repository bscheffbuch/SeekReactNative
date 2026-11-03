import { StyleSheet } from "react-native";

import { row } from "../global";

const viewStyles = StyleSheet.create( {
  bullet: {
    borderRadius: 5,
    height: 10,
    marginRight: 18,
    width: 10,
  },
  marginTop: {
    marginTop: 7,
  },
  row,
} );

const textStyles = StyleSheet.create( {
  taxonomyText: {
    maxWidth: 200,
  },
} );

export {
  textStyles,
  viewStyles,
};
