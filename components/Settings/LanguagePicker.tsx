// @ts-nocheck
import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, View, Alert } from "react-native";
import Checkbox from "react-native-check-box";
import * as RNLocalize from "react-native-localize";

import i18n from "../../i18n";
import { viewStyles } from "../../styles/settings";
import languages from "../../utility/dictionaries/languageDict";
import { useLanguage } from "../Providers/LanguageProvider";
import { toggleLanguage } from "../../utility/settingsHelpers";
import { deviceLanguageSupported, setDisplayLanguage } from "../../utility/languageHelpers";
import StyledText from "../UIComponents/StyledText";
import { useTheme } from "../Providers/ThemeProvider";
import SettingsSelect from "./SettingsSelect";

const localeList = Object.keys( languages ).map( ( locale ) => (
  { value: locale, label: languages[locale] }
) );

const { languageCode } = RNLocalize.getLocales()[0];

const LanguagePicker = () => {
  const { toggleLanguagePreference, preferredLanguage } = useLanguage( );
  const { theme } = useTheme( );
  const styles = StyleSheet.create( {
    title: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 18,
      lineHeight: 24,
      marginBottom: theme.spacing.sm,
    },
    rowText: {
      color: theme.colors.text,
      fontFamily: theme.typography.body,
      fontSize: 16,
      lineHeight: 23,
    },
  } );

  const displayLanguage = setDisplayLanguage( preferredLanguage );
  const isChecked = preferredLanguage === "device" || displayLanguage === languageCode;

  const showAlert = useCallback( ( value: string ) => {
    const valueLabel = languages[value];
    Alert.alert( null, i18n.t( "settings.change_language", { language: valueLabel } ), [
      {
        text: i18n.t( "delete.no" ),
        onPress: ( ) => null,
        style: "cancel",
      }, {
        text: i18n.t( "settings.confirm" ),
        onPress: ( ) => {
          // this changes translations on Settings screen in real-time
          // eslint-disable-next-line react-hooks/react-compiler
          i18n.locale = value;
          toggleLanguage( value );
          toggleLanguagePreference();
        },
      },
    ] );
  }, [toggleLanguagePreference] );
  
  const handleValueChange = useCallback( ( value: string ) => {
    // this prevents the double render on new Android install
    // without this, the user changes the language
    // and handleValueChange is immediately called with "en"
    if ( value === displayLanguage && preferredLanguage === "device" ) {
      return;
    }

    // only update state if new language is desired
    if ( value === preferredLanguage ) {
      return;
    }

    // if the user selects language to be set to device language don't show alert
    if ( value === "device" ) {
      // this changes translations on Settings screen in real-time
      i18n.locale = value;
      toggleLanguage( value );
      toggleLanguagePreference();
      return;
    }
    // SettingsSelect commits the choice as soon as an option is tapped on
    // both platforms, so confirm immediately with the tapped value
    showAlert( value );
  }, [displayLanguage, preferredLanguage, toggleLanguagePreference, showAlert] );

  const setDeviceLanguage = useCallback( () => handleValueChange( "device" ), [handleValueChange] );

  const renderDeviceCheckbox = useMemo( () => (
    <View style={[viewStyles.row, viewStyles.checkboxRow]}>
      {/* accessibility isn't available for this component, and it's also not
      implemented on iOS for the official react-native-checkbox library
      https://github.com/crazycodeboy/react-native-check-box/issues/94 */}
      <Checkbox
        checkBoxColor={theme.colors.primary}
        isChecked={isChecked}
        disabled={isChecked}
        onClick={setDeviceLanguage}
        style={viewStyles.checkBox}
      />
      <StyledText onPress={setDeviceLanguage} style={styles.rowText}>{i18n.t( "settings.device_settings" )}</StyledText>
    </View>
  ), [isChecked, setDeviceLanguage, styles.rowText, theme.colors.primary] );

  return (
    <View style={viewStyles.donateMarginBottom}>
      <Text style={styles.title}>{i18n.t( "settings.language" )}</Text>
      {deviceLanguageSupported( ) && renderDeviceCheckbox}
      <SettingsSelect
        disabled={!displayLanguage}
        items={localeList}
        label={i18n.t( "settings.language" )}
        onValueChange={handleValueChange}
        value={displayLanguage}
        testID="picker"
      />
    </View>
  );
};

export default LanguagePicker;
