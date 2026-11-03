import React from "react";
import ProgressCircle from "react-native-progress-circle";

import { viewStyles, textStyles } from "../../styles/uiComponents/percentCircle";
import { useTheme } from "../Providers/ThemeProvider";
import { localizePercentage } from "../../utility/helpers";
import StyledText from "./StyledText";
import { baseTextStyles } from "../../styles/textStyles";

interface Props {
  readonly challenge: {
    percentComplete: number;
  };
  readonly large?: boolean;
}

// M3-style progress ring: primary arc on a tonal disc, so it reads on any surface.
const PercentCircle = ( { challenge, large = false }: Props ) => {
  const { theme } = useTheme( );
  const textColor = { color: theme.colors.onSecondaryContainer };
  return (
    <ProgressCircle
      bgColor={theme.colors.secondaryContainer}
      borderWidth={3}
      color={theme.colors.primary}
      outerCircleStyle={large ? viewStyles.largeCircleStyle : viewStyles.circleStyle}
      percent={challenge.percentComplete}
      radius={large ? ( 113 / 2 ) : ( 59 / 2 )}
      shadowColor={theme.colors.surfaceContainerHighest}
    >
      <StyledText
        allowFontScaling={false}
        style={[baseTextStyles.regular, large ? textStyles.largeCircleText : textStyles.circleText, textColor]}
      >
        {localizePercentage( challenge.percentComplete )}
      </StyledText>
    </ProgressCircle>
  );
};

export default PercentCircle;
