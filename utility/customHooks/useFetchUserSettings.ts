// @ts-nocheck
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Realm from "realm";

import realmConfig from "../../models";

// Realm object properties are prototype accessors, so spreading or otherwise
// shallow-copying a live Realm object copies nothing; copy the fields into a
// plain object before handing them to React state
const settingsToPlainObject = ( userSettings ) => ( {
  autoCapture: userSettings.autoCapture,
  localSeasonality: userSettings.localSeasonality,
  scientificNames: userSettings.scientificNames,
  themePreference: userSettings.themePreference,
  cameraViewportResolution: userSettings.cameraViewportResolution,
  photoQualityBalance: userSettings.photoQualityBalance,
  confidenceThreshold: userSettings.confidenceThreshold,
  hideCameraReminder: userSettings.hideCameraReminder,
  appVersion: userSettings.appVersion,
} );

const useFetchUserSettings = ( ) => {
  const [settings, setSettings] = useState<{
    autoCapture?: boolean;
    localSeasonality?: boolean;
    scientificNames?: boolean;
    themePreference?: "system" | "light" | "dark";
    cameraViewportResolution?: string;
    photoQualityBalance?: string;
    confidenceThreshold?: number;
    hideCameraReminder?: boolean;
    appVersion?: string;
  }>( { } );
  const isMounted = useRef( true );

  const refetch = useCallback( async ( ) => {
    const realm = await Realm.open( realmConfig );
    const userSettings = realm.objects( "UserSettingsRealm" )[0];
    if ( isMounted.current && userSettings ) {
      setSettings( settingsToPlainObject( userSettings ) );
    }
  }, [] );

  useEffect( ( ) => {
    isMounted.current = true;
    refetch( );
    return ( ) => {
      isMounted.current = false;
    };
  }, [refetch] );

  // keep the returned shape compatible with existing consumers, which read
  // setting fields directly off the returned object; `refetch` is an extra
  // stable function property for consumers that want to reload on focus
  return useMemo( ( ) => ( { ...settings, refetch } ), [settings, refetch] );
};

export { useFetchUserSettings };
