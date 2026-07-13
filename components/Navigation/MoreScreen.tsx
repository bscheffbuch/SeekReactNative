import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  AwardIcon,
  CircleHelpIcon,
  CloudUploadIcon,
  InfoIcon,
  LeafIcon,
  SettingsIcon,
} from "../UIComponents/AppIcons";

import i18n from "../../i18n";
import { useTheme } from "../Providers/ThemeProvider";
import {
  AppHeader,
  AppScreen,
  ListRow,
  SectionHeading,
  SurfaceCard,
} from "../UIComponents/AppPrimitives";

const MoreScreen = ( ) => {
  const navigation = useNavigation( );
  const { theme } = useTheme( );
  const styles = StyleSheet.create( {
    content: {
      padding: theme.spacing.md,
    },
    profileCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.md,
      ...theme.elevation.card,
    },
    profileMark: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
      borderRadius: 27,
      borderWidth: 2,
      height: 54,
      justifyContent: "center",
      width: 54,
    },
    profileText: {
      flex: 1,
    },
    profileTitle: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 18,
      lineHeight: 23,
    },
    profileMeta: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
      fontSize: 13,
      lineHeight: 18,
      marginTop: theme.spacing.xxs,
    },
    group: {
      paddingHorizontal: 0,
      paddingVertical: theme.spacing.xs,
    },
    spacer: {
      height: theme.spacing.lg,
    },
  } );

  return (
    <AppScreen>
      <AppHeader titleKey="menu.more" showBack={false} />
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={i18n.t( "menu.achievements" )}
          onPress={() => navigation.navigate( "Achievements" as never )}
          style={( { pressed } ) => [styles.profileCard, pressed && { opacity: 0.82 }]}
        >
          <View style={styles.profileMark}>
            <AwardIcon color={theme.colors.primary} size={28} />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileTitle}>Field Notebook</Text>
            <Text style={styles.profileMeta}>Achievements, saved observations, and settings</Text>
          </View>
        </Pressable>
        <SectionHeading>{i18n.t( "menu.more" )}</SectionHeading>
        <SurfaceCard style={styles.group}>
          <ListRow
            icon={AwardIcon}
            label={i18n.t( "menu.achievements" )}
            onPress={() => navigation.navigate( "Achievements" as never )}
            testID="moreAchievementsLink"
          />
          <ListRow
            icon={CloudUploadIcon}
            label={i18n.t( "menu.queued_observations" )}
            onPress={() => navigation.navigate( "QueuedObservations" as never )}
            testID="moreQueuedObservationsLink"
          />
          <ListRow
            icon={LeafIcon}
            label={i18n.t( "menu.inaturalist" )}
            onPress={() => navigation.navigate( "iNatStats" as never )}
            testID="moreINaturalistLink"
          />
          <ListRow
            icon={SettingsIcon}
            label={i18n.t( "menu.settings" )}
            onPress={() => navigation.navigate( "Settings" as never )}
            testID="moreSettingsLink"
          />
          <ListRow
            icon={InfoIcon}
            label={i18n.t( "menu.about" )}
            onPress={() => navigation.navigate( "About" as never )}
            testID="moreAboutLink"
          />
        </SurfaceCard>
        <View style={styles.spacer} />
        <SectionHeading>{i18n.t( "menu.help" )}</SectionHeading>
        <SurfaceCard style={styles.group}>
          <ListRow
            icon={CircleHelpIcon}
            label={i18n.t( "menu.notifications" )}
            onPress={() => navigation.navigate( "Notifications" as never )}
            testID="moreNotificationsLink"
          />
        </SurfaceCard>
      </View>
    </AppScreen>
  );
};

export default MoreScreen;
