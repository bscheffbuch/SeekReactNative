import React from "react";
import type { TextProps } from "react-native";
import { StyleSheet, Text } from "react-native";

import { colors, leftText } from "../../styles/global";
import { useTheme } from "../Providers/ThemeProvider";

const StyledText = ( props: TextProps ) => {
  const { children } = props;
  const { theme } = useTheme( );
  const flattenedStyle = StyleSheet.flatten( props.style );
  const color = flattenedStyle?.color;
  // Legacy baseTextStyles bake fixed Seek colors into most variants. Map them onto
  // the Material 3 roles so every screen follows the theme (light and dark).
  const isInkColor = color === undefined
    || color === colors.seekInk
    || color === colors.black
    || color === colors.darkGray;
  const isMutedColor = color === colors.errorGray
    || color === colors.settingsGray
    || color === colors.placeholderGray;
  const isBrandGreen = color === colors.seekDeepGreen
    || color === colors.seekGreen
    || color === colors.seekTeal
    || color === colors.seekForestGreen;
  const themeColorOverride = isInkColor
    ? { color: theme.colors.text }
    : isMutedColor
      ? { color: theme.colors.onSurfaceVariant }
      : isBrandGreen
        ? { color: theme.colors.primary }
        : null;

  return (
    <Text
      {...props}
      style={[leftText, props.style, themeColorOverride]}
    >
      { children }
    </Text>
  );
};

export default StyledText;
