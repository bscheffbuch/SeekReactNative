import React from "react";
import { StyleSheet, View } from "react-native";

import { viewStyles, textStyles } from "../../../styles/challenges/emptyChallenges";
import i18n from "../../../i18n";
import StyledText from "../../UIComponents/StyledText";
import { baseTextStyles } from "../../../styles/textStyles";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props {
  type: string;
}

const EmptyChallengesCard = ( { type }: Props ) => {
  const { theme } = useTheme( );
  const themedStyles = StyleSheet.create( {
    title: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
    },
    body: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
    },
  } );

  return (
    <View style={[viewStyles.noChallengeContainer, viewStyles.center]}>
      <StyledText style={[baseTextStyles.emptyState, textStyles.noChallengeText, themedStyles.title]}>{i18n.t( `challenges.${type}` )}</StyledText>
      {type === "no_new_challenges_header" && (
        <StyledText style={[baseTextStyles.regularGray, textStyles.lightText, themedStyles.body]}>{i18n.t( "challenges.no_new_challenges" )}</StyledText>
      )}
    </View>
  );
};

export default EmptyChallengesCard;
