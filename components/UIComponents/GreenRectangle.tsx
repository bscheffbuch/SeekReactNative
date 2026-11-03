// @ts-nocheck
import * as React from "react";
import { View } from "react-native";

import { viewStyles, textStyles } from "../../styles/uiComponents/greenRectangle";
import StyledText from "./StyledText";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  text: string;
  // legacy per-call colors are ignored: one accent across the app
  color?: string | null;
  letterSpacing?: number;
  textColor?: string | null;
}

// Material 3 filled chip in the theme primary (used by toasts and the camera filter label).
const GreenRectangle = ( { text, letterSpacing, textColor }: Props ) => {
  const { theme } = useTheme( );
  return (
    <View style={[viewStyles.greenButton, { backgroundColor: theme.colors.primary }]}>
      <StyledText style={[
        baseTextStyles.challengeItemTitleWhite,
        textStyles.greenButtonText,
        { color: textColor || theme.colors.onPrimary },
        letterSpacing && { letterSpacing },
      ]}>
        {text}
      </StyledText>
    </View>
  );
};

export default GreenRectangle;
