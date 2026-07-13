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
  // Legacy baseTextStyles bake light-theme ink/gray colors into most variants,
  // so bare call sites would render near-black text on the dark canvas.
  const isInkColor = color === undefined
    || color === colors.seekInk
    || color === colors.black;
  const isMutedColor = color === colors.errorGray
    || color === colors.settingsGray
    || color === colors.placeholderGray;
  const darkColorOverride = theme.isDark && isInkColor
    ? { color: theme.colors.text }
    : theme.isDark && isMutedColor
      ? { color: theme.colors.muted }
      : theme.isDark && (
        color === colors.seekDeepGreen
        || color === colors.seekGreen
        || color === colors.seekTeal
      )
        ? { color: theme.colors.primary }
        : null;

  return (
    <Text
      {...props}
      style={[leftText, props.style, darkColorOverride]}
    >
      { children }
    </Text>
  );
};

export default StyledText;
