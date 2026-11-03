import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import i18n from "../../i18n";
import { useTheme, DEFAULT_ACCENT, WALLPAPER_ACCENT } from "../Providers/ThemeProvider";
import { ACCENT_PALETTES } from "../../styles/accentPalettes";
import { getDynamicPalette } from "../../styles/dynamicColor";
import { CheckIcon } from "../UIComponents/AppIcons";
import type {ThemePreference} from "../Providers/ThemeProvider";

const options: { labelKey: string; value: ThemePreference }[] = [
  { labelKey: "settings.appearance_system", value: "system" },
  { labelKey: "settings.appearance_light", value: "light" },
  { labelKey: "settings.appearance_dark", value: "dark" },
];

const wallpaperPalette = getDynamicPalette( );
const wallpaper = wallpaperPalette
  ? { primary: wallpaperPalette.accent1_600, container: wallpaperPalette.accent1_100 }
  : null;

const AppearanceSettings = ( ) => {
  const {
    theme,
    themePreference,
    setThemePreference,
    dynamicColorSupported,
    accentColor,
    setAccentColor,
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
    accentHeading: {
      color: theme.colors.text,
      fontFamily: theme.typography.body,
      fontSize: 16,
      lineHeight: 24,
      marginTop: theme.spacing.lg,
    },
    accentSub: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.body,
      fontSize: 14,
      lineHeight: 20,
    },
    swatches: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: theme.spacing.md,
    },
    swatchRing: {
      alignItems: "center",
      borderColor: "transparent",
      borderRadius: 26,
      borderWidth: 3,
      height: 52,
      justifyContent: "center",
      width: 52,
    },
    swatchRingOn: {
      borderColor: theme.colors.text,
    },
    swatch: {
      alignItems: "center",
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      overflow: "hidden",
      width: 40,
    },
    swatchHalf: {
      height: 20,
      width: 40,
    },
    optionTextSelected: {
      color: theme.colors.onSecondaryContainer,
    },
  } );

  const accents = [
    { id: DEFAULT_ACCENT, primary: theme.isDark ? "#8AD6AD" : "#14794F", container: theme.isDark ? "#005235" : "#A6F2C8" },
    ...Object.entries( ACCENT_PALETTES )
      .filter( ( [id] ) => id !== DEFAULT_ACCENT )
      .map( ( [id, p] ) => {
        const roles = theme.isDark ? p.dark : p.light;
        return { id, primary: roles.primary, container: roles.primaryContainer };
      } ),
    ...( dynamicColorSupported && wallpaper
      ? [{ id: WALLPAPER_ACCENT, primary: wallpaper.primary, container: wallpaper.container }]
      : [] ),
  ];

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
      <Text accessibilityRole="header" style={styles.accentHeading}>{i18n.t( "settings.accent_color" )}</Text>
      <Text style={styles.accentSub}>
        {accentColor === WALLPAPER_ACCENT ? i18n.t( "settings.dynamic_color_sub" ) : i18n.t( `settings.accent_${accentColor}` )}
      </Text>
      <View accessibilityRole="radiogroup" style={styles.swatches}>
        {accents.map( accent => {
          const selected = accent.id === accentColor;
          return (
            <Pressable
              accessibilityLabel={accent.id === WALLPAPER_ACCENT
                ? i18n.t( "settings.dynamic_color" )
                : i18n.t( `settings.accent_${accent.id}` )}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={accent.id}
              onPress={() => setAccentColor( accent.id )}
              style={[styles.swatchRing, selected && styles.swatchRingOn]}
              testID={`accent-${accent.id}`}
            >
              <View style={styles.swatch}>
                {/* upper half: the accent, lower half: its container tone */}
                <View style={[styles.swatchHalf, { backgroundColor: accent.primary }]} />
                <View style={[styles.swatchHalf, { backgroundColor: accent.container }]} />
                {selected && (
                  <View style={StyleSheet.absoluteFill}>
                    <View style={[styles.swatch, { backgroundColor: "rgba(0, 0, 0, 0.25)" }]}>
                      <CheckIcon color="#FFFFFF" size={20} strokeWidth={3} />
                    </View>
                  </View>
                )}
              </View>
            </Pressable>
          );
        } )}
      </View>
    </View>
  );
};

export default AppearanceSettings;