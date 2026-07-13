import React, { useState } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import i18n from "../../../i18n";
import styles from "../../../styles/auth/login";
import { checkIsEmailValid } from "../../../utility/loginHelpers";
import ErrorMessage from "../ErrorMessage";
import InputField from "../../UIComponents/InputField";
import GreenText from "../../UIComponents/GreenText";
import GreenButton from "../../UIComponents/Buttons/GreenButton";
import createUserAgent from "../../../utility/userAgent";
import ScrollWithHeader from "../../UIComponents/Screens/ScrollWithHeader";
import { createJwtToken } from "../../../utility/helpers";
import StyledText from "../../UIComponents/StyledText";
import { baseTextStyles } from "../../../styles/textStyles";

const ForgotPasswordScreen = ( ) => {
  const { navigate } = useNavigation( );
  const [email, setEmail] = useState( "" );
  const [error, setError] = useState( "" );
  const token = createJwtToken( );

  const emailForgotPassword = ( ) => {

    const params = { user: { email } };

    const headers = {
      "Content-Type": "application/json",
      "User-Agent": createUserAgent( ),
      "Authorization": token,
    };

    const site = "https://www.inaturalist.org";

    fetch( `${site}/users/password`, {
      method: "POST",
      body: JSON.stringify( params ),
      headers,
    } ).then( ( response ) => {
      const { status } = response;
      if ( status === 200 ) {
        navigate( "PasswordEmail" );
      } else {
        setError( i18n.t( "login.error_request_could_not_be_completed" ) );
      }
    } ).catch( ( err ) => {
      console.log( err, "error" );
      setError( i18n.t( "login.error_request_could_not_be_completed" ) );
    } );
  };

  const checkEmail = ( ) => {
    if ( checkIsEmailValid( email ) ) {
      setError( "" );
      emailForgotPassword( );
    } else {
      setError( "email" );
    }
  };

  return (
    <ScrollWithHeader header="inat_login.forgot_password_header">
      <View style={styles.margin} />
      <StyledText allowFontScaling={false} style={[baseTextStyles.emptyState, styles.header, styles.marginHorizontal]}>
        {i18n.t( "inat_login.no_worries" )}
      </StyledText>
      <View style={[styles.leftTextMargins, styles.marginExtraLarge]}>
        <GreenText allowFontScaling={false} smaller text="inat_login.email" />
      </View>
      <InputField
        handleTextChange={value => setEmail( value )}
        placeholder={i18n.t( "inat_login.email" )}
        text={email}
        type="emailAddress"
      />
      {error
        ? <ErrorMessage error={error} />
        : <View style={styles.marginLarge} />}
      <GreenButton
        handlePress={( ) => checkEmail( )}
        login
        text="inat_login.reset"
      />
    </ScrollWithHeader>
  );
};

export default ForgotPasswordScreen;
