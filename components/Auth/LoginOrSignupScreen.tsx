// @ts-nocheck
import * as React from "react";
import {
  View,
  Image,
  ScrollView,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import i18n from "../../i18n";
import { viewStyles, textStyles, imageStyles } from "../../styles/auth/loginOrSignup";
import logoImages from "../../assets/logos";
import backgrounds from "../../assets/backgrounds";
import { PrimaryButton, SecondaryButton } from "../UIComponents/AppPrimitives";
import { useTheme } from "../Providers/ThemeProvider";
import { enabledLargeFonts } from "../../utility/textHelpers";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";

const LoginOrSignupScreen = ( { navigation } ) => {
  const navToLogin = ( ) => navigation.navigate( "Login" );
  const navToAge = ( ) => navigation.navigate( "Age" );
  const navToDrawer = ( ) => navigation.popTo( "MainTabs", { screen: "Home" } );
  const { theme } = useTheme( );

  return (
    <ImageBackground
      source={backgrounds.login}
      style={viewStyles.container}
    >
      <ScrollView
        contentContainerStyle={[viewStyles.center, viewStyles.scrollContainer]}
        scrollEnabled={enabledLargeFonts()}
      >
        <Image source={logoImages.seek} style={imageStyles.logo} />
        <View style={viewStyles.margin} />
        {/* Material 3: filled, tonal and text buttons over the photo */}
        <PrimaryButton label={i18n.t( "login.log_in" )} onPress={navToLogin} style={m3.button} />
        <View style={viewStyles.marginSmall} />
        <SecondaryButton label={i18n.t( "login.sign_up" )} onPress={navToAge} style={m3.button} />
        <View style={viewStyles.marginSmall} />
        <Pressable accessibilityRole="button" onPress={navToDrawer} style={m3.textButton}>
          <Text style={[m3.textButtonLabel, { fontFamily: theme.typography.heading }]}>
            {i18n.t( "login.skip_login" )}
          </Text>
        </Pressable>
        <View style={viewStyles.margin} />
        <StyledText style={[baseTextStyles.loginOrSignup, textStyles.text]}>
          {i18n.t( "login.about" )}
        </StyledText>
      </ScrollView>
    </ImageBackground>
  );
};

const m3 = StyleSheet.create( {
  button: {
    minHeight: 56,
    width: 293,
  },
  textButton: {
    alignItems: "center",
    borderRadius: 20,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  textButtonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    textDecorationLine: "underline",
  },
} );

export default LoginOrSignupScreen;
