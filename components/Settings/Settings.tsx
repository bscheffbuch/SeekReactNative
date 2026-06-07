import React, { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

import { viewStyles } from "../../styles/settings";
import LanguagePicker from "./LanguagePicker";
import ScrollWithHeader from "../UIComponents/Screens/ScrollWithHeader";
import DonateCard from "../UIComponents/Cards/DonateCard";
import AccountDeletion from "../UIComponents/AccountDeletion";
import CameraSettings from "./CameraSettings";
import SpeciesDetail from "./SpeciesDetail";
import AppearanceSettings from "./AppearanceSettings";
import { useAppOrientation } from "../Providers/AppOrientationProvider";
import { UserContext } from "../UserContext";
import { useTheme } from "../Providers/ThemeProvider";

interface SettingsSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const SettingsSection = ( { children, title, subtitle }: SettingsSectionProps ) => {
  const { theme } = useTheme( );
  const styles = StyleSheet.create( {
    section: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      ...theme.elevation.card,
    },
    title: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 18,
      lineHeight: 24,
    },
    subtitle: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
      fontSize: 13,
      lineHeight: 19,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
  } );

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
};

const SettingsScreen = ( ) => {
  const { isTablet } = useAppOrientation( );
  const { login } = useContext( UserContext );
  const { theme } = useTheme( );
  const styles = StyleSheet.create( {
    shell: {
      gap: theme.spacing.xs,
      justifyContent: "space-between",
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
  } );

  return (
    <ScrollWithHeader header="menu.settings" footer>
      <View style={[
        styles.shell,
        isTablet && viewStyles.tabletContainer,
      ]}>
        <SettingsSection>
          <AppearanceSettings />
        </SettingsSection>
        <SettingsSection>
          <CameraSettings />
        </SettingsSection>
        <SettingsSection>
          <SpeciesDetail />
        </SettingsSection>
        <SettingsSection>
          <LanguagePicker />
        </SettingsSection>
        <DonateCard />
        {login ? <AccountDeletion /> : null}
      </View>
    </ScrollWithHeader>
  );
};

export default SettingsScreen;
