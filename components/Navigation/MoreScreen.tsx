import React from "react";
import {
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  AwardIcon,
  BellIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  CloudUploadIcon,
  InfoIcon,
  LeafIcon,
  SettingsIcon,
} from "../UIComponents/AppIcons";

import i18n from "../../i18n";
import { useTheme } from "../Providers/ThemeProvider";
import { makeThemedStyles } from "../../styles/themedStyles";
import type { ThemeTokens } from "../../styles/theme";
import badgeImages from "../../assets/badges";
import useProgressSummary from "../Achievements/hooks/useProgressSummary";
import {
  AppHeader,
  AppScreen,
  ListRow,
  SectionHeading,
  SurfaceCard,
} from "../UIComponents/AppPrimitives";

const getMoreStyles = makeThemedStyles( ( theme: ThemeTokens ) => ( {
  content: {
    padding: theme.spacing.md,
  },
  // same primary-container card as the Home level card
  profileCard: {
    alignItems: "center",
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 24,
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    padding: 20,
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
  levelBadge: {
    height: 56,
    width: 56,
  },
  profileText: {
    flex: 1,
  },
  profileTitle: {
    color: theme.colors.onPrimaryContainer,
    fontFamily: theme.typography.body,
    fontSize: 22,
    lineHeight: 28,
  },
  profileMeta: {
    color: theme.colors.onPrimaryContainer,
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
} ) );

const MoreScreen = ( ) => {
  const navigation = useNavigation( );
  const { theme } = useTheme( );
  const summary = useProgressSummary( );
  const { level } = summary;
  const levelName = level ? i18n.t( level.intlName ) : "";
  const styles = getMoreStyles( theme );

  return (
    <AppScreen>
      <AppHeader titleKey="menu.more" showBack={false} />
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${i18n.t( "badges.your_level" )}: ${levelName}`}
          onPress={() => navigation.navigate( "Achievements" as never )}
          style={( { pressed } ) => [styles.profileCard, pressed && { opacity: 0.82 }]}
          testID="moreLevelCard"
        >
          {level && badgeImages[level.earnedIconName] ? (
            <Image source={badgeImages[level.earnedIconName]} style={styles.levelBadge} />
          ) : (
            <View style={styles.profileMark}>
              <AwardIcon color={theme.colors.primary} size={28} />
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={styles.profileMeta}>{i18n.t( "badges.your_level" )}</Text>
            <Text numberOfLines={1} style={styles.profileTitle}>{levelName}</Text>
            {summary.loaded && (
              <Text style={styles.profileMeta}>
                {i18n.t( "banner.number_seen_plural", { count: summary.speciesCount } )}
              </Text>
            )}
          </View>
          <ChevronRightIcon color={theme.colors.onPrimaryContainer} size={22} />
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
            icon={BellIcon}
            label={i18n.t( "menu.notifications" )}
            onPress={() => navigation.navigate( "Notifications" as never )}
            testID="moreNotificationsLink"
          />
          <ListRow
            icon={SettingsIcon}
            label={i18n.t( "menu.settings" )}
            onPress={() => navigation.navigate( "Settings" as never )}
            testID="moreSettingsLink"
          />
        </SurfaceCard>
        <View style={styles.spacer} />
        <SectionHeading>{i18n.t( "menu.help" )}</SectionHeading>
        <SurfaceCard style={styles.group}>
          <ListRow
            icon={CircleHelpIcon}
            label={i18n.t( "camera_help.title" )}
            onPress={() => navigation.navigate( "CameraHelp" as never )}
            testID="moreCameraHelpLink"
          />
          <ListRow
            icon={InfoIcon}
            label={i18n.t( "menu.about" )}
            onPress={() => navigation.navigate( "About" as never )}
            testID="moreAboutLink"
          />
        </SurfaceCard>
      </View>
    </AppScreen>
  );
};

export default MoreScreen;
