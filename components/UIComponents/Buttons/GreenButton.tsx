// @ts-nocheck
import type { ComponentPropsWithoutRef } from "react";
import React from "react";
import { TouchableOpacity } from "react-native";

import i18n from "../../../i18n";
import { viewStyles, textStyles } from "../../../styles/uiComponents/buttons/greenButton";
import StyledText from "../StyledText";
import { baseTextStyles } from "../../../styles/textStyles";
import { colors } from "../../../styles/global";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props extends ComponentPropsWithoutRef<typeof TouchableOpacity> {
  readonly color?: string | null;
  readonly handlePress: () => void;
  readonly letterSpacing?: number;
  readonly text: string;
  readonly login?: boolean;
  readonly fontSize?: number;
  readonly width?: number | null;
  readonly allowFontScaling?: boolean;
}

const GreenButton = ( {
  color = null,
  disabled,
  testID,
  handlePress,
  letterSpacing,
  login = false,
  fontSize,
  text,
  width = null,
  allowFontScaling = true,
}: Props ) => {
  const { theme } = useTheme( );
  let widthStyle = null;
  // Material 3 filled button: theme primary everywhere. A transparent color is the
  // legacy "disabled" look (M3 disabled colors); iNaturalist green stays for iNat actions.
  const isDisabledLook = color === colors.seekTransparent || disabled;
  const background = isDisabledLook
    ? ( theme.isDark ? "rgba(222, 228, 221, 0.12)" : "rgba(23, 29, 25, 0.12)" )
    : color === colors.seekiNatGreen ? colors.seekiNatGreen : theme.colors.primary;
  const foreground = isDisabledLook
    ? ( theme.isDark ? "rgba(222, 228, 221, 0.38)" : "rgba(23, 29, 25, 0.38)" )
    : color === colors.seekiNatGreen ? colors.white : theme.colors.onPrimary;

  if ( width ) {
    widthStyle = { width };
  }

  return (
    <TouchableOpacity accessibilityRole="button"
      onPress={handlePress}
      style={[
        viewStyles.greenButton,
        { backgroundColor: background },
        login && viewStyles.loginHeight,
        widthStyle,
      ]}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      testID={testID || "greenButton"}
    >
      <StyledText
        style={[
          baseTextStyles.button,
          textStyles.buttonText,
          { color: foreground },
          letterSpacing && { letterSpacing },
          fontSize && { fontSize },
        ]}
        allowFontScaling={allowFontScaling}
      >
        {i18n.t( text )}
      </StyledText>
    </TouchableOpacity>
  );
};

export default GreenButton;
