import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import i18n from "../../i18n";
import { useTheme  } from "../Providers/ThemeProvider";
import type {ThemePreference} from "../Providers/ThemeProvider";

const options: { labelKey: string; value: ThemePreference }[] = [
  { labelKey: "settings.appearance_system", value: "system" },
  { labelKey: "settings.appearance_light", value: "light" },
  { labelKey: "settings.appearance_dark", value: "dark" },
];

const AppearanceSettings = ( ) => {
  const {
    theme,
    themePreference,
    setThemePreference,
    dynamicColorSupported,
    dynamicColor,
    setDynamicColor,
  } = useTheme( );
  const [pendingPreference, setPendingPreference] = useState<ThemePreference | null>( null );
  const styles = StyleSheet.create( {
    container: {
      marginBottom: theme.spacing.lg,
    },
    heading: {
      color: theme.colors.primary,
      fontFamily: theme.typography.heading,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: theme.spacing.sm,
    },
    // M3 segmented button: outlined pill, selected segment in secondary container
    group: {
      borderColor: theme.colors.outline,
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: "row",
      overflow: "hidden",
    },
    option: {
      alignItems: "center",
      borderColor: theme.colors.outline,
      flex: 1,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: theme.spacing.sm,
    },
    optionDivider: {
      borderLeftWidth: 1,
    },
    optionSelected: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    optionPressed: {
      backgroundColor: theme.colors.pressed,
    },
    optionText: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 15,
      lineHeight: 20,
      textAlign: "center",
    },
    dynamicRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
      minHeight: 64,
    },
    dynamicText: {
      flex: 1,
    },
    dynamicTitle: {
      color: theme.colors.text,
      fontFamily: theme.typography.body,
      fontSize: 16,
      lineHeight: 24,
    },
    dynamicSub: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.body,
      fontSize: 14,
      lineHeight: 20,
    },
    optionTextSelected: {
      color: theme.colors.onSecondaryContainer,
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
        {options.map( ( option, index ) => {
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
                index > 0 && styles.optionDivider,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
              testID={`appearance-${option.value}`}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {selected ? "✓ " : ""}{i18n.t( option.labelKey )}
              </Text>
            </Pressable>
          );
        } )}
      </View>
      {dynamicColorSupported && (
        <View style={styles.dynamicRow}>
          <View style={styles.dynamicText}>
            <Text style={styles.dynamicTitle}>{i18n.t( "settings.dynamic_color" )}</Text>
            <Text style={styles.dynamicSub}>{i18n.t( "settings.dynamic_color_sub" )}</Text>
          </View>
          <Switch
            accessibilityLabel={i18n.t( "settings.dynamic_color" )}
            onValueChange={setDynamicColor}
            thumbColor={dynamicColor ? theme.colors.onPrimary : theme.colors.outline}
            trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primary }}
            value={dynamicColor}
          />
        </View>
      )}
    </View>
  );
};

export default AppearanceSettings;