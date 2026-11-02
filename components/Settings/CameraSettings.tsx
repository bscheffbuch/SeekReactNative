// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Platform, StyleSheet, Text, View, Switch } from "react-native";
import { RadioButton, RadioButtonInput, RadioButtonLabel } from "react-native-simple-radio-button";
import Realm from "realm";

import i18n from "../../i18n";
import { viewStyles, textStyles } from "../../styles/settings";
import { updateUserSetting } from "../../utility/settingsHelpers";
import realmConfig from "../../models";
import StyledText from "../UIComponents/StyledText";
import { useTheme } from "../Providers/ThemeProvider";
import SettingsSelect from "./SettingsSelect";
import {
  BUILT_IN_PACK_ID,
  choosePack,
  getSelectedPackId,
  listModelPacks,
  modelPackDirs,
  setSelectedPack,
} from "../../utility/modelPacks";
import type { ModelPack } from "../../utility/modelPacks";
import { loadActivePackCommonNames } from "../../utility/commonNamesHelpers";

interface State {
  autoCapture?: boolean;
  scientificNames?: boolean;
  cameraViewportResolution?: string;
  photoQualityBalance?: string;
  confidenceThreshold?: number;
}

const cameraViewportResolutionOptions = [
  { label: "540p", value: "540p" },
  { label: "720p", value: "720p" },
  { label: "1080p", value: "1080p" },
  { label: "1440p", value: "1440p" },
  { label: "2160p", value: "2160p" },
];

const photoQualityBalanceOptions = [
  { label: i18n.t( "settings.photo_quality_speed" ), value: "speed" },
  { label: i18n.t( "settings.photo_quality_balanced" ), value: "balanced" },
  { label: i18n.t( "settings.photo_quality_quality" ), value: "quality" },
];

const confidenceThresholdOptions = ( () => {
  const options = [];
  for ( let value = 30; value <= 80; value += 5 ) {
    options.push( { label: `${value}%`, value } );
  }
  return options;
} )();

// Realm object properties are prototype accessors, so spreading a live Realm
// object copies nothing; copy the fields into a plain object before using it
// as component state
const settingsToPlainObject = ( userSettings ): State => ( {
  autoCapture: userSettings.autoCapture,
  scientificNames: userSettings.scientificNames,
  cameraViewportResolution: userSettings.cameraViewportResolution,
  photoQualityBalance: userSettings.photoQualityBalance,
  confidenceThreshold: userSettings.confidenceThreshold,
} );
const packLabel = ( pack: ModelPack ) => (
  pack.builtIn
    ? i18n.t( "settings.model_built_in" )
    : pack.taxa
      ? `${pack.name} · ${i18n.t( "settings.model_species", { count: pack.taxa.toLocaleString( ) } )}`
      : pack.name
);

const CameraSettings = ( ) => {
  const [settings, setSettings] = useState<State>( {} );
  const [packs, setPacks] = useState<ModelPack[]>( [] );
  const [packId, setPackId] = useState<string>( BUILT_IN_PACK_ID );
  const { theme } = useTheme( );
  const themedStyles = StyleSheet.create( {
    title: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 18,
      lineHeight: 24,
    },
    groupLabel: {
      color: theme.colors.muted,
      fontFamily: theme.typography.heading,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: theme.spacing.sm,
    },
    rowText: {
      color: theme.colors.text,
      fontFamily: theme.typography.body,
      fontSize: 16,
      lineHeight: 23,
    },
    pickerStack: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.md,
    },
  } );
  const radioButtons = [
    { label: i18n.t( "settings.common_names" ), value: 0 },
    { label: i18n.t( "settings.scientific_names" ), value: 1 },
  ];

  const updateIndex = async( i: number ) => {
    const newValue = i !== 0;
    if ( newValue === settings.scientificNames ) {
      return;
    }
    const value = await updateUserSetting( "scientificNames", newValue );
    const newSettings: Object = {
      ...settings,
      scientificNames: value,
    };
    setSettings( newSettings );
  };

  const setAutoCapture = async ( ) => {
    const value = await updateUserSetting( "autoCapture", !settings.autoCapture );
    const newSettings: Object = {
      ...settings,
      autoCapture: value,
    };
    setSettings( newSettings );
  };

  const updateCameraViewportResolution = async ( value: string ) => {
    if ( !value || value === settings.cameraViewportResolution ) {
      return;
    }
    const newValue = await updateUserSetting( "cameraViewportResolution", value );
    setSettings( {
      ...settings,
      cameraViewportResolution: newValue,
    } );
  };

  const updatePhotoQualityBalance = async ( value: string ) => {
    if ( !value || value === settings.photoQualityBalance ) {
      return;
    }
    const newValue = await updateUserSetting( "photoQualityBalance", value );
    setSettings( {
      ...settings,
      photoQualityBalance: newValue,
    } );
  };

  const updateConfidenceThreshold = async ( value: number ) => {
    if ( value === null || value === undefined || value === settings.confidenceThreshold ) {
      return;
    }
    const newValue = await updateUserSetting( "confidenceThreshold", value );
    setSettings( {
      ...settings,
      confidenceThreshold: newValue,
    } );
  };

  const updateModelPack = async ( id: string ) => {
    if ( !id || id === packId ) {
      return;
    }
    const pack = await setSelectedPack( id );
    setPackId( pack.id );
    // the pack's own common names, if it ships any, in the background
    loadActivePackCommonNames( );
  };

  const switchTrackColor = {
    false: theme.colors.border,
    true: theme.colors.primary,
  };

  const handleRadioButtonPress = ( value: number ) => updateIndex( value );

  useEffect( ( ) => {
    let isCurrent = true;

    const fetchUserSettings = async ( ) => {
      const realm = await Realm.open( realmConfig );
      const userSettings = realm.objects( "UserSettingsRealm" )[0];
      if ( isCurrent && userSettings ) {
        setSettings( settingsToPlainObject( userSettings ) );
      }
    };
    fetchUserSettings( );
    const fetchModelPacks = async ( ) => {
      const [available, selected] = await Promise.all( [listModelPacks( ), getSelectedPackId( )] );
      if ( isCurrent ) {
        setPacks( available );
        setPackId( choosePack( available, selected ).id );
      }
    };
    fetchModelPacks( );
    return ( ) => {
      isCurrent = false;
    };
  }, [] );

  return (
    <>
      <Text style={themedStyles.title}>{i18n.t( "settings.header" )}</Text>
      <View style={viewStyles.marginSmall} />
      <View style={viewStyles.radioButtonSmallMargin}>
        {radioButtons.map( ( obj, i ) => <RadioButton
            key={`${obj.label}${i}`}
            style={viewStyles.radioMargin}
          >
            <RadioButtonInput
              obj={obj}
              index={i}
              isSelected={
                ( i === 0 && !settings.scientificNames ) || ( i === 1 && settings.scientificNames )
              }
              onPress={handleRadioButtonPress}
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
              onPress={handleRadioButtonPress}
              labelHorizontal
              labelStyle={themedStyles.rowText}
              accessible
              accessibilityLabel={radioButtons[i].label}
            />
          </RadioButton>
        )}
      </View>
      <View style={[viewStyles.row, viewStyles.radioButtonSmallMargin]}>
        <Switch
          style={viewStyles.switch}
          value={settings.autoCapture}
          trackColor={switchTrackColor}
          onValueChange={setAutoCapture}
          accessible
          accessibilityLabel={settings.autoCapture ? i18n.t( "posting.yes" ) : i18n.t( "posting.no" )}
        />
        <StyledText style={[themedStyles.rowText, textStyles.autoCaptureText]}>
          {i18n.t( "settings.auto_capture" )}
        </StyledText>
      </View>
      <View style={themedStyles.pickerStack}>
        {Platform.OS === "android" && packs.length > 0 && (
          <>
            <SettingsSelect
              items={packs.map( ( pack ) => ( { label: packLabel( pack ), value: pack.id } ) )}
              label={i18n.t( "settings.identification_model" )}
              onValueChange={updateModelPack}
              testID="identification-model-select"
              value={packId}
            />
            {packs.length === 1 && (
              <Text selectable style={themedStyles.groupLabel}>
                {i18n.t( "settings.model_install_hint", { path: modelPackDirs( )[0] } )}
              </Text>
            )}
          </>
        )}
        <SettingsSelect
          items={cameraViewportResolutionOptions}
          label={i18n.t( "settings.camera_stream_resolution" )}
          onValueChange={updateCameraViewportResolution}
          value={settings.cameraViewportResolution || "720p"}
        />
        <SettingsSelect
          items={photoQualityBalanceOptions}
          label={i18n.t( "settings.photo_quality_balance" )}
          onValueChange={updatePhotoQualityBalance}
          value={settings.photoQualityBalance || "balanced"}
        />
        <SettingsSelect
          items={confidenceThresholdOptions}
          label={i18n.t( "settings.confidence_threshold" )}
          onValueChange={updateConfidenceThreshold}
          value={settings.confidenceThreshold || 50}
        />
      </View>
    </>
  );
};

export default CameraSettings;
