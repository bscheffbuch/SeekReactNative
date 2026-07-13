import React from "react";
import { StyleSheet, View } from "react-native";

import i18n from "../../../i18n";
import { viewStyles, textStyles } from "../../../styles/home/noChallenges";
import StyledText from "../../UIComponents/StyledText";
import { baseTextStyles } from "../../../styles/textStyles";
import { useTheme } from "../../Providers/ThemeProvider";
import { AwardIcon } from "../../UIComponents/AppIcons";

const NoChallenges = ( ) => {
  const { theme } = useTheme( );
  const themedStyles = StyleSheet.create( {
    iconBox: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 12,
      height: 60,
      justifyContent: "center",
      width: 60,
    },
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
    <View style={[viewStyles.row, viewStyles.center]}>
      <View style={themedStyles.iconBox}>
        <AwardIcon color={theme.colors.primary} size={31} strokeWidth={2.2} />
      </View>
      <View style={viewStyles.noChallengeTextContainer}>
        <StyledText style={[baseTextStyles.emptyState, textStyles.textWidth, themedStyles.title]}>
          {i18n.t( "challenges.completed_all" )}
        </StyledText>
        <StyledText style={[baseTextStyles.body, textStyles.text, textStyles.textWidth, themedStyles.body]}>
          {i18n.t( "challenges.no_new_challenges" )}
        </StyledText>
      </View>
    </View>
  );
};

export default NoChallenges;
