import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StatusBar, useColorScheme } from "react-native";
import Realm from "realm";
import AsyncStorage from "@react-native-async-storage/async-storage";

import realmConfig from "../../models";
import { updateUserSetting } from "../../utility/settingsHelpers";
import {
  coerceThemePreference,
  darkTheme,
  lightTheme,
  resolveThemeTokens,
} from "../../styles/theme";
import { applyDynamicColors, getDynamicPalette } from "../../styles/dynamicColor";
import type {ThemePreference, ThemeTokens} from "../../styles/theme";

interface ThemeContextValue {
  theme: ThemeTokens;
  // always-dark variant of the active scheme, for the camera
  cameraTheme: ThemeTokens;
  themePreference: ThemePreference;
  setThemePreference: ( preference: ThemePreference ) => Promise<void>;
  isDark: boolean;
  // Material You (Android 12+): colors from the wallpaper
  dynamicColorSupported: boolean;
  dynamicColor: boolean;
  setDynamicColor: ( enabled: boolean ) => Promise<void>;
}

const DYNAMIC_COLOR_KEY = "dynamic_color";

const ThemeContext = createContext<ThemeContextValue>( {
  theme: lightTheme,
  cameraTheme: darkTheme,
  themePreference: "system",
  setThemePreference: async () => {},
  isDark: false,
  dynamicColorSupported: false,
  dynamicColor: false,
  setDynamicColor: async () => {},
} );

const ThemeProvider = ( { children }: React.PropsWithChildren ) => {
  const systemScheme = useColorScheme( );
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>( "system" );
  const palette = useMemo( ( ) => getDynamicPalette( ), [] );
  const [dynamicColor, setDynamicColorState] = useState( true );

  useEffect( ( ) => {
    AsyncStorage.getItem( DYNAMIC_COLOR_KEY )
      .then( value => setDynamicColorState( value !== "off" ) )
      .catch( ( ) => null );
  }, [] );

  const setDynamicColor = useCallback( async ( enabled: boolean ) => {
    setDynamicColorState( enabled );
    await AsyncStorage.setItem( DYNAMIC_COLOR_KEY, enabled ? "on" : "off" );
  }, [] );
  const normalizedSystemScheme = systemScheme === "light" || systemScheme === "dark"
    ? systemScheme
    : undefined;

  useEffect( ( ) => {
    let isCurrent = true;

    Realm.open( realmConfig )
      .then( realm => {
        const userSettings = realm.objects( "UserSettingsRealm" );
        const storedPreference = coerceThemePreference( userSettings[0]?.themePreference );
        if ( isCurrent ) {
          setThemePreferenceState( storedPreference );
        }
      } )
      .catch( () => {
        if ( isCurrent ) {
          setThemePreferenceState( "system" );
        }
      } );

    return () => {
      isCurrent = false;
    };
  }, [] );

  const setThemePreference = useCallback( async ( preference: ThemePreference ) => {
    setThemePreferenceState( preference );
    await updateUserSetting( "themePreference", preference );
  }, [] );

  const useDynamic = dynamicColor && palette != null;
  const theme = useMemo( ( ) => {
    const base = resolveThemeTokens( themePreference, normalizedSystemScheme );
    return useDynamic ? applyDynamicColors( base, palette ) : base;
  }, [normalizedSystemScheme, palette, themePreference, useDynamic] );
  const cameraTheme = useMemo(
    ( ) => ( useDynamic ? applyDynamicColors( darkTheme, palette ) : darkTheme ),
    [palette, useDynamic]
  );

  const value = useMemo( () => ( {
    theme,
    cameraTheme,
    themePreference,
    setThemePreference,
    isDark: theme.isDark,
    dynamicColorSupported: palette != null,
    dynamicColor: useDynamic,
    setDynamicColor,
  } ), [cameraTheme, palette, setDynamicColor, setThemePreference, theme, themePreference, useDynamic] );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.canvas}
      />
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = ( ) => useContext( ThemeContext );

export {
  ThemeProvider,
  useTheme,
};
export type { ThemePreference, ThemeTokens };
