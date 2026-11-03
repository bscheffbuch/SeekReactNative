import * as React from "react";
import { View, Platform } from "react-native";

import styles from "../../styles/uiComponents/topSpacer";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  readonly backgroundColor?: string | null;
}

const TopSpacer = ( { backgroundColor = null }: Props ) => {
  const { theme } = useTheme( );
  if ( Platform.OS === "ios" ) {
    return (
      <View style={[styles.iosSpacer, { backgroundColor: backgroundColor || theme.colors.canvas }]} />
    );
  }
  return null;
};

export default TopSpacer;
