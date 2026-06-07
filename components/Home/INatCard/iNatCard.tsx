// @ts-nocheck
import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";

import { viewStyles } from "../../../styles/home/inatCard";
import INatCardLoggedIn from "./iNatCardLoggedIn";
import INatCardLoggedOut from "./iNatCardLoggedOut";
import { UserContext } from "../../UserContext";
import useLatestChallenge from "../Challenges/hooks/challengeCardHooks";
import GreenText from "../../UIComponents/GreenText";
import { useAppOrientation } from "../../Providers/AppOrientationProvider";
import { useTheme } from "../../Providers/ThemeProvider";

const INatCard = ( ) => {
  const { login } = useContext( UserContext );
  const { isLandscape } = useAppOrientation( );
  const challenge = useLatestChallenge( );
  const { theme } = useTheme( );
  const themedStyles = StyleSheet.create( {
    container: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 12,
      ...theme.elevation.card,
    },
    topMarginWithChallenge: {
      backgroundColor: theme.colors.surface,
    },
  } );

  return (
    <View style={[
      viewStyles.container,
      themedStyles.container,
      challenge && [viewStyles.topMarginWithChallenge, themedStyles.topMarginWithChallenge],
    ]}>
      <View style={viewStyles.headerPadding}>
        <GreenText text="about_inat.inaturalist" />
      </View>
      <View style={isLandscape && viewStyles.landscapeContainerRestrictedWidth}>
        {login ? <INatCardLoggedIn /> : <INatCardLoggedOut challenge={challenge} />}
      </View>
    </View>
  );
};

export default INatCard;
