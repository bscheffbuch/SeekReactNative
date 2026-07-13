import React from "react";
import { View } from "react-native";

import { viewStyles, textStyles } from "../../styles/iNaturalist/bulletedList";
import i18n from "../../i18n";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  text: string;
}

const BulletedList = ( { text }: Props ) => {
  const { theme } = useTheme( );

  return (
    <View key={text} style={viewStyles.bulletContainer}>
      <StyledText style={[textStyles.bulletPoints, { color: theme.colors.text }]}>
        &#8226;
      </StyledText>
      <StyledText style={[baseTextStyles.body, textStyles.bulletText, { color: theme.colors.text }]}>
        {i18n.t( text )}
      </StyledText>
    </View>
  );
};

export default BulletedList;
