import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";

import i18n from "../../../i18n";
import { viewStyles, textStyles } from "../../../styles/uiComponents/cards/donateCard";
import GreenButton from "../Buttons/GreenButton";
import StyledText from "../StyledText";
import { baseTextStyles } from "../../../styles/textStyles";
import { useAppOrientation } from "../../Providers/AppOrientationProvider";
import { useTheme } from "../../Providers/ThemeProvider";

const DonateCard = ( ) => {
  const { navigate } = useNavigation( );
  const { name } = useRoute( );
  const { isLandscape } = useAppOrientation( );
  const { theme } = useTheme( );
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

  const isHomeScreen = name === "Home";

  const navToDonation = ( ) => navigate( "Donation" );

  return (
    <View style={[viewStyles.whiteContainer, themedStyles.container]}>
      <StyledText style={[
        baseTextStyles.header,
        name !== "Settings" && textStyles.header,
        themedStyles.title,
      ]}>
        {i18n.t( "settings.donate_header" )}
      </StyledText>
      <View style={[
        viewStyles.paddingAboveText,
        isHomeScreen && viewStyles.textContainer,
      ]}>
        <StyledText style={[
          baseTextStyles.body,
          isLandscape && viewStyles.landscapeContainerRestrictedWidth,
          themedStyles.body,
        ]}>
          {i18n.t( "settings.donate_description" )}
        </StyledText>
      </View>
      <View style={[
        viewStyles.marginGreenButton,
        isHomeScreen && viewStyles.marginGreenButtonLarge,
      ]} />
      { Platform.OS !== "ios" && <>
        <GreenButton
          text="settings.donate"
          handlePress={navToDonation}
          />
        <View style={viewStyles.marginBottom} />
      </> }
    </View>
  );
};

export default DonateCard;
