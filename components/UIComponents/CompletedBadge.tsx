import * as React from "react";
import { StyleSheet, View } from "react-native";

import { CheckIcon } from "./AppIcons";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  readonly size?: number;
}

// Filled primary disc with a check: the "challenge complete" mark, same footprint
// as the progress ring it replaces.
const CompletedBadge = ( { size = 59 }: Props ) => {
  const { theme } = useTheme( );
  return (
    <View
      accessibilityLabel="100%"
      style={[styles.disc, { backgroundColor: theme.colors.primary, borderRadius: size / 2, height: size, width: size }]}
    >
      <CheckIcon color={theme.colors.onPrimary} size={size * 0.5} strokeWidth={2.6} />
    </View>
  );
};

const styles = StyleSheet.create( {
  disc: {
    alignItems: "center",
    justifyContent: "center",
  },
} );

export default CompletedBadge;
