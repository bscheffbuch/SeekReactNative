import React, { useMemo } from "react";
import type { TextStyle } from "react-native";

import styles from "../../styles/uiComponents/greenText";
import i18n from "../../i18n";
import StyledText from "./StyledText";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  readonly style?: TextStyle;
  readonly text: string;
  readonly small?: boolean;
  readonly smaller?: boolean;
  readonly center?: boolean;
  readonly color?: string | null;
  readonly allowFontScaling?: boolean;
  readonly noTranslation?: boolean;
}

const GreenText = ( {
  style,
  small = false,
  smaller = false,
  text,
  center = false,
  color = null,
  allowFontScaling = true,
  noTranslation,
}: Props ) => {
  const { theme } = useTheme( );
  const themedTextStyle = useMemo<TextStyle>( () => ( {
    color: color || theme.colors.text,
    fontFamily: theme.typography.heading,
  } ), [color, theme.colors.text, theme.typography.heading] );

  return (
    <StyledText
      style={[
        styles.base,
        smaller ? styles.smaller : small ? styles.small : styles.defaultSize,
        themedTextStyle,
        center && styles.center,
        style,
      ]}
      allowFontScaling={allowFontScaling}
    >
      {noTranslation ? text : i18n.t( text )}
    </StyledText>
  );
};

export default GreenText;
