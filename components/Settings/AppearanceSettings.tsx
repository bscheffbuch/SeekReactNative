import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import i18n from "../../i18n";
import { useTheme  } from "../Providers/ThemeProvider";
import type {ThemePreference} from "../Providers/ThemeProvider";

const options: { labelKey: string; value: ThemePreference }[] = [
  { labelKey: "settings.appearance_system", value: "system" },
  { labelKey: "settings.appearance_light", value: "light" },
  { labelKey: "settings.appearance_dark", value: "dark" },
];

const AppearanceSettings = ( ) => {
  const { theme, themePreference, setThemePreference } = useTheme( );
  const [pendingPreference, setPendingPreference] = useState<ThemePreference | null>( null );
  const styles = StyleSheet.create( {
    container: {
      marginBottom: theme.spacing.lg,
    },
    heading: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 18,
      lineHeight: 24,
      marginBottom: theme.spacing.sm,
    },
    group: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      flexDirection: "row",
      padding: theme.spacing.xs,
    },
    option: {
      alignItems: "center",
      borderRadius: theme.radii.sm - theme.spacing.xs,
      flex: 1,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    optionSelected: {
      backgroundColor: theme.colors.primaryContainer,
    },
    optionPressed: {
      backgroundColor: theme.colors.pressed,
    },
    optionText: {
      color: theme.colors.muted,
      fontFamily: theme.typography.heading,
      fontSize: 15,
      lineHeight: 20,
      textAlign: "center",
    },
    optionTextSelected: {
      color: theme.colors.primary,
    },
  } );

  const handlePreference = async ( preference: ThemePreference ) => {
    if ( preference === themePreference || pendingPreference ) {
      return;
    }
    setPendingPreference( preference );
    try {
      await setThemePreference( preference );
    } finally {
      setPendingPreference( null );
    }
  };

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.heading}>
        {i18n.t( "settings.appearance" )}
      </Text>
      <View style={styles.group}>
        {options.map( option => {
          const selected = option.value === themePreference;
          return (
            <Pressable
              accessibilityLabel={i18n.t( option.labelKey )}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: pendingPreference !== null }}
              disabled={pendingPreference !== null}
              key={option.value}
              onPress={() => handlePreference( option.value )}
              style={( { pressed } ) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
              testID={`appearance-${option.value}`}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {i18n.t( option.labelKey )}
              </Text>
            </Pressable>
          );
        } )}
      </View>
    </View>
  );
};

export default AppearanceSettings;