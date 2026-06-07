import * as React from "react";
import { View } from "react-native";

import styles from "../../styles/uiComponents/padding";
import { useTheme } from "../Providers/ThemeProvider";

const Padding = () => {
  const { theme } = useTheme( );

  return (
    <View style={[styles.padding, { backgroundColor: theme.colors.canvas }]} />
  );
};

export default Padding;
