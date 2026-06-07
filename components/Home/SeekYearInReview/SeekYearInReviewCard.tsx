import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import i18n from "../../../i18n";
import {
  viewStyles,
  textStyles,
} from "../../../styles/home/seekYearInReview";
import GreenButton from "../../UIComponents/Buttons/GreenButton";
import { UserContext } from "../../UserContext";
import { useCountObservationsForYear } from "../../SeekYearInReview/hooks/seekYearInReviewHooks";
import StyledText from "../../UIComponents/StyledText";
import { baseTextStyles } from "../../../styles/textStyles";
import { useAppOrientation } from "../../Providers/AppOrientationProvider";
import { useTheme } from "../../Providers/ThemeProvider";


const SeekYearInReviewCard = ( ) => {
  // The year to show stats for
  const now = new Date();
  let year = now.getFullYear();
  const month = now.getMonth();
  // If it's January, show stats for the previous year
  if ( month === 0 ) {
    year -= 1;
  }
  const { navigate } = useNavigation();

  const { isLandscape } = useAppOrientation();
  const { theme } = useTheme( );
  const { userProfile } = React.useContext( UserContext );
  const countObservationsThisYear = useCountObservationsForYear( year );

  const navToSeekYearInReview = () => navigate( "SeekYearInReview" );

  const isTime = month === 0 || month === 11;
  const hasObservations =
    !!countObservationsThisYear && countObservationsThisYear > 0;
  const showCard = userProfile?.isAdmin || ( isTime && hasObservations );

  if ( !showCard ) {
    return null;
  }
  const themedStyles = StyleSheet.create( {
    container: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 12,
      ...theme.elevation.card,
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
    <View testID="yir-card" style={[viewStyles.whiteContainer, themedStyles.container]}>
      <StyledText style={[baseTextStyles.header, textStyles.header, themedStyles.title]}>
        {i18n.t( "seek_year_in_review.header" )}
      </StyledText>
      <View style={viewStyles.textContainer}>
        <StyledText
          style={[
            baseTextStyles.body,
            isLandscape && viewStyles.landscapeContainerRestrictedWidth,
            themedStyles.body,
          ]}
        >
          {i18n.t( "seek_year_in_review.description" )}
        </StyledText>
      </View>
      <View style={viewStyles.marginGreenButtonLarge} />
      <GreenButton
        text="seek_year_in_review.button"
        handlePress={navToSeekYearInReview}
      />
      <View style={viewStyles.marginBottom} />
    </View>
  );
};

export default SeekYearInReviewCard;
