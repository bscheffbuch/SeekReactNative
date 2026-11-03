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
import { applyAccentRoles, applyDynamicColors, getDynamicPalette } from "../../styles/dynamicColor";
import { ACCENT_PALETTES } from "../../styles/accentPalettes";
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
  // "green" (default), another accent from styles/accentPalettes, or "wallpaper"
  accentColor: string;
  setAccentColor: ( accent: string ) => Promise<void>;
}

const ACCENT_COLOR_KEY = "accent_color";
export const DEFAULT_ACCENT = "green";
export const WALLPAPER_ACCENT = "wallpaper";

const ThemeContext = createContext<ThemeContextValue>( {
  theme: lightTheme,
  cameraTheme: darkTheme,
  themePreference: "system",
  setThemePreference: async () => {},
  isDark: false,
  dynamicColorSupported: false,
  accentColor: DEFAULT_ACCENT,
  setAccentColor: async () => {},
} );

const ThemeProvider = ( { children }: React.PropsWithChildren ) => {
  const systemScheme = useColorScheme( );
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>( "system" );
  const palette = useMemo( ( ) => getDynamicPalette( ), [] );
  const [accentColor, setAccentColorState] = useState( DEFAULT_ACCENT );

  useEffect( ( ) => {
    AsyncStorage.getItem( ACCENT_COLOR_KEY )
      .then( value => {
        if ( value && ( value === WALLPAPER_ACCENT || ACCENT_PALETTES[value] ) ) {
          setAccentColorState( value );
        }
      } )
      .catch( ( ) => null );
  }, [] );

  const setAccentColor = useCallback( async ( accent: string ) => {
    setAccentColorState( accent );
    await AsyncStorage.setItem( ACCENT_COLOR_KEY, accent );
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

  const useDynamic = accentColor === WALLPAPER_ACCENT && palette != null;
  const accentPalette = accentColor !== DEFAULT_ACCENT ? ACCENT_PALETTES[accentColor] : undefined;
  const withAccent = useCallback( ( base: ThemeTokens ) => {
    if ( useDynamic ) {
      return applyDynamicColors( base, palette );
    }
    if ( accentPalette ) {
      return applyAccentRoles( base, base.isDark ? accentPalette.dark : accentPalette.light );
    }
    return base; // green: the hand-tuned Seek theme
  }, [accentPalette, palette, useDynamic] );
  const theme = useMemo(
    ( ) => withAccent( resolveThemeTokens( themePreference, normalizedSystemScheme ) ),
    [normalizedSystemScheme, themePreference, withAccent]
  );
  const cameraTheme = useMemo( ( ) => withAccent( darkTheme ), [withAccent] );

  const value = useMemo( () => ( {
    theme,
    cameraTheme,
    themePreference,
    setThemePreference,
    isDark: theme.isDark,
    dynamicColorSupported: palette != null,
    accentColor: useDynamic || accentPalette ? accentColor : DEFAULT_ACCENT,
    setAccentColor,
  } ), [accentColor, accentPalette, cameraTheme, palette, setAccentColor, setThemePreference, theme, themePreference, useDynamic] );

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
