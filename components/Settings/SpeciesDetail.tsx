// @ts-nocheck
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { RadioButton, RadioButtonInput, RadioButtonLabel } from "react-native-simple-radio-button";
import Realm from "realm";

import i18n from "../../i18n";
import { viewStyles, textStyles } from "../../styles/settings";
import { updateUserSetting } from "../../utility/settingsHelpers";
import { useLocationPermission } from "../../utility/customHooks";
import realmConfig from "../../models";
import StyledText from "../UIComponents/StyledText";
import { useTheme } from "../Providers/ThemeProvider";

const SpeciesDetail = ( ) => {
  const granted = useLocationPermission( );
  const [seasonality, setSeasonality] = useState<boolean | null>( null );
  const { theme } = useTheme( );
  const themedStyles = StyleSheet.create( {
    title: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 18,
      lineHeight: 24,
    },
    label: {
      color: theme.colors.muted,
      fontFamily: theme.typography.heading,
      fontSize: 13,
      lineHeight: 18,
    },
    body: {
      color: theme.colors.text,
      fontFamily: theme.typography.body,
      fontSize: 16,
      lineHeight: 23,
    },
  } );

  const radioButtons = [
    { label: i18n.t( "settings.seasonality_option_1" ), value: 0 },
    { label: i18n.t( "settings.seasonality_option_2" ), value: 1 },
  ];

  const updateIndex = async ( i: number ) => {
    const newValue = i !== 0;
    if ( newValue === seasonality ) {
      return;
    }
    const value = await updateUserSetting( "localSeasonality", newValue );
    setSeasonality( value );
  };

  useEffect( ( ) => {
    let isCurrent = true;

    const fetchUserSettings = async ( ) => {
      const realm = await Realm.open( realmConfig );
      const userSettings = realm.objects( "UserSettingsRealm" );
      if ( isCurrent ) {
        setSeasonality( userSettings[0].localSeasonality );
      }
    };
    fetchUserSettings( );
    return ( ) => {
      isCurrent = false;
    };
  }, [] );

  // probably need to add a check here for iOS permissions too
  if ( Platform.OS === "android" && granted === false ) {
    return null;
  }

  return (
    <View style={viewStyles.margin}>
      <Text style={themedStyles.title}>{i18n.t( "settings.species_detail" )}</Text>
      <View style={viewStyles.marginSmall} />
      <StyledText style={themedStyles.label}>{i18n.t( "settings.seasonality" )}</StyledText>
      <View style={viewStyles.radioButtonSmallMargin}>
        {radioButtons.map( ( obj, i ) => (
          <RadioButton
            key={`${obj.label}${i}`}
            style={viewStyles.radioMargin}
          >
            <RadioButtonInput
              obj={obj}
              index={i}
              isSelected={( i === 1 && seasonality ) || ( i === 0 && !seasonality )}
              onPress={updateIndex}
              borderWidth={1}
              buttonInnerColor={theme.colors.primary}
              buttonOuterColor={theme.colors.primary}
              buttonSize={12}
              buttonOuterSize={20}
              accessible
              accessibilityLabel={radioButtons[i].value.toString( )}
            />
            <RadioButtonLabel
              obj={obj}
              index={i}
              onPress={updateIndex}
              labelHorizontal
              labelStyle={[themedStyles.body, textStyles.seasonalityRadioButtonText]}
              accessible
              accessibilityLabel={radioButtons[i].label}
            />
          </RadioButton>
        ) )}
      </View>
    </View>
  );
};

export default SpeciesDetail;
