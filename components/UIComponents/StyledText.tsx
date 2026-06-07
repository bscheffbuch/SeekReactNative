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
  const darkColorOverride = theme.isDark && color === undefined
    ? { color: theme.colors.text }
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
