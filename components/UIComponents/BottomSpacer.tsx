import * as React from "react";
import { View, Platform } from "react-native";

import styles from "../../styles/uiComponents/topSpacer";
import { useTheme } from "../Providers/ThemeProvider";

// iOS overscroll filler below the content: same color as the screen
const BottomSpacer = ( ) => {
  const { theme } = useTheme( );
  if ( Platform.OS === "ios" ) {
    return (
      <View style={[styles.bottomSpacer, { backgroundColor: theme.colors.canvas }]} />
    );
  }
  return null;
};

export default BottomSpacer;
