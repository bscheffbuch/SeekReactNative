import * as React from "react";
import { View } from "react-native";
import ProgressCircle from "react-native-progress-circle";

import { viewStyles, textStyles } from "../../styles/uiComponents/percentCircle";
import { useTheme } from "../Providers/ThemeProvider";
import { calculatePercent } from "../../utility/challengeHelpers";
import StyledText from "./StyledText";

interface Props {
  readonly badge: {
    count: number;
  };
  readonly iconicSpeciesCount: number;
}

const LargeProgressCircle = ( { badge, iconicSpeciesCount }: Props ) => {
  const { theme } = useTheme( );
  return (
    <View style={viewStyles.center}>
      <ProgressCircle
        bgColor={theme.colors.secondaryContainer}
        borderWidth={3}
        color={theme.colors.primary}
        outerCircleStyle={viewStyles.largeCircleStyle}
        percent={calculatePercent( iconicSpeciesCount, badge.count )}
        radius={113 / 2}
        shadowColor={theme.colors.surfaceContainerHighest}
      >
        <StyledText allowFontScaling={false} style={[textStyles.largeCircleText, { color: theme.colors.onSecondaryContainer }]}>
          {iconicSpeciesCount}
          {"/"}
          {badge.count}
        </StyledText>
      </ProgressCircle>
    </View>
  );
};

export default LargeProgressCircle;
