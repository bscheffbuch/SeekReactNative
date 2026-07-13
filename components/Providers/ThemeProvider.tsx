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

import realmConfig from "../../models";
import { updateUserSetting } from "../../utility/settingsHelpers";
import {
  coerceThemePreference,
  lightTheme,
  resolveThemeTokens,
  
  
} from "../../styles/theme";
import type {ThemePreference, ThemeTokens} from "../../styles/theme";

interface ThemeContextValue {
  theme: ThemeTokens;
  themePreference: ThemePreference;
  setThemePreference: ( preference: ThemePreference ) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>( {
  theme: lightTheme,
  themePreference: "system",
  setThemePreference: async () => {},
  isDark: false,
} );

const ThemeProvider = ( { children }: React.PropsWithChildren ) => {
  const systemScheme = useColorScheme( );
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>( "system" );
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

  const theme = useMemo(
    () => resolveThemeTokens( themePreference, normalizedSystemScheme ),
    [normalizedSystemScheme, themePreference]
  );

  const value = useMemo( () => ( {
    theme,
    themePreference,
    setThemePreference,
    isDark: theme.isDark,
  } ), [setThemePreference, theme, themePreference] );

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
