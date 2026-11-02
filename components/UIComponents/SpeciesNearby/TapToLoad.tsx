import React from "react";
import { Pressable } from "react-native";

import i18n from "../../../i18n";
import { textStyles, viewStyles } from "../../../styles/uiComponents/speciesNearby/tapToLoad";
import StyledText from "../StyledText";
import { baseTextStyles } from "../../../styles/textStyles";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props {
  handlePress: ( ) => void;
  backgroundColor?: string;
}

const TapToLoad = ( { handlePress, backgroundColor }: Props ) => {
  const { theme } = useTheme( );

  return (
    <Pressable accessibilityRole="button"
      onPress={handlePress}
      style={[
        viewStyles.center,
        viewStyles.speciesNearbyContainer,
        backgroundColor === "white" && viewStyles.challengeContainer,
        {
          backgroundColor: backgroundColor === "white"
            ? theme.colors.canvas
            : theme.colors.primaryContainer,
        },
      ]}
    >
      <StyledText
        style={[
          baseTextStyles.body,
          textStyles.text,
          // primary reads on both the canvas and the green container, in both themes
          { color: backgroundColor === "white" ? theme.colors.text : theme.colors.primary },
        ]}>
          {i18n.t( "results.tap" )}
      </StyledText>
    </Pressable>
  );
};

export default TapToLoad;

