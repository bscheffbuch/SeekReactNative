// @ts-nocheck
import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  BackHandler,
  Image,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import SeekYearInReviewCard from "./SeekYearInReview/SeekYearInReviewCard";
import SpeciesNearby from "./SpeciesNearby/SpeciesNearby";
import Announcements from "./Announcements/Announcements";
import GetStarted from "../Modals/GetStarted";
import ChallengeCard from "./Challenges/ChallengeCard";
import Updates from "./Updates/Updates";
import { checkIfCardShown, localizeNumber } from "../../utility/helpers";
import i18n from "../../i18n";
import badgeImages from "../../assets/badges";
import useProgressSummary from "../Achievements/hooks/useProgressSummary";
import RNModal from "../UIComponents/Modals/Modal";
import ScrollNoHeader from "../UIComponents/Screens/ScrollNoHeader";
import UploadStatus from "./UploadStatus";
import { checkForUploads, checkForNumSuccessfulUploads, markUploadsAsSeen } from "../../utility/uploadHelpers";
import { deleteDebugLogAfter7Days } from "../../utility/photoHelpers";
import INatCard from "./INatCard/iNatCard";
import DonateCard from "../UIComponents/Cards/DonateCard";
import {
  AwardIcon,
  BinocularsIcon,
  TrophyIcon,
} from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";
import { makeThemedStyles } from "../../styles/themedStyles";
import type { ThemeTokens } from "../../styles/theme";

const getHeroStyles = makeThemedStyles( ( theme: ThemeTokens ) => ( {
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  card: {
    alignItems: "center",
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 24,
    flexDirection: "row",
    gap: theme.spacing.md,
    padding: 20,
  },
  cardPressed: {
    opacity: 0.9,
  },
  badge: {
    height: 64,
    width: 64,
  },
  badgePlaceholder: {
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 32,
    height: 64,
    width: 64,
  },
  textColumn: {
    flex: 1,
  },
  kicker: {
    color: theme.colors.onPrimaryContainer,
    fontFamily: theme.typography.heading,
    fontSize: 12,
    letterSpacing: 0.4,
    lineHeight: 16,
    opacity: 0.8,
  },
  title: {
    color: theme.colors.onPrimaryContainer,
    fontFamily: theme.typography.body,
    fontSize: 24,
    letterSpacing: 0,
    lineHeight: 32,
  },
  // M3 linear progress, thick variant: active part, 4px gap, track
  progressRow: {
    flexDirection: "row",
    gap: 4,
    height: 12,
    marginTop: 12,
  },
  fill: {
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    height: 12,
  },
  track: {
    backgroundColor: theme.isDark ? "rgba(166, 242, 200, 0.22)" : "rgba(0, 33, 19, 0.14)",
    borderRadius: 6,
    flex: 1,
    height: 12,
  },
  captionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
    marginTop: theme.spacing.sm,
  },
  caption: {
    color: theme.colors.onPrimaryContainer,
    flexShrink: 1,
    fontFamily: theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  count: {
    color: theme.colors.onPrimaryContainer,
    fontFamily: theme.typography.heading,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
} ) );

const HomeHero = ( { summary, navigation } ) => {
  const { theme } = useTheme( );
  const { level, nextLevelCount, speciesCount } = summary;
  const styles = getHeroStyles( theme );

  const isMaxLevel = summary.loaded && nextLevelCount === null;
  const levelFloor = level ? level.count : 0;
  const progress = isMaxLevel || !nextLevelCount
    ? 1
    : Math.min( 1, Math.max( 0, ( speciesCount - levelFloor ) / ( nextLevelCount - levelFloor ) ) );
  const remaining = nextLevelCount ? Math.max( 0, nextLevelCount - speciesCount ) : 0;
  const caption = isMaxLevel
    ? i18n.t( "badges.observe_max" )
    : i18n.t( "badges.observe_plural", { count: localizeNumber( remaining ) } );
  const levelName = level ? i18n.t( level.intlName ) : "";

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${i18n.t( "badges.your_level" )}: ${levelName}. ${summary.loaded ? caption : ""}`}
        onPress={() => navigation.navigate( "Achievements" )}
        style={( { pressed } ) => [styles.card, pressed && styles.cardPressed]}
        testID="homeLevelCard"
      >
        {level && badgeImages[level.earnedIconName]
          ? <Image source={badgeImages[level.earnedIconName]} style={styles.badge} />
          : <View style={styles.badgePlaceholder} />}
        <View style={styles.textColumn}>
          <Text style={styles.kicker}>{i18n.t( "badges.your_level" )}</Text>
          <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
            {levelName}
          </Text>
          <View style={styles.progressRow}>
            {progress > 0 && <View style={[styles.fill, { width: `${Math.round( progress * 100 )}%` }]} />}
            {progress < 1 && <View style={styles.track} />}
          </View>
          {summary.loaded && (
            <View style={styles.captionRow}>
              <Text style={styles.caption}>{caption}</Text>
              {!isMaxLevel && nextLevelCount
                ? <Text style={styles.count}>{`${localizeNumber( speciesCount )} / ${localizeNumber( nextLevelCount )}`}</Text>
                : null}
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const getCollectionStyles = makeThemedStyles( ( theme: ThemeTokens ) => ( {
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  header: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 16,
    lineHeight: 24,
  },
  grid: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderRadius: 12,
    flex: 1,
    minHeight: 112,
    padding: 12,
  },
  cardPressed: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  iconDisc: {
    alignItems: "center",
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  value: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 22,
    lineHeight: 28,
    marginTop: theme.spacing.sm,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: theme.typography.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: theme.spacing.xxs,
  },
} ) );

const HomeCollectionStrip = ( { summary, navigation } ) => {
  const { theme } = useTheme( );
  const styles = getCollectionStyles( theme );

  const formatCount = ( count: number ) => ( summary.loaded ? localizeNumber( count ) : "–" );
  const items = [
    {
      key: "species",
      icon: BinocularsIcon,
      label: i18n.t( "badges.observed" ),
      onPress: ( ) => navigation.navigate( "Observations" ),
      value: formatCount( summary.speciesCount ),
      testID: "homeSpeciesCount",
    },
    {
      key: "challenges",
      icon: TrophyIcon,
      label: i18n.t( "challenges.in_progress" ),
      onPress: ( ) => navigation.navigate( "Challenges" ),
      value: formatCount( summary.challengesInProgress ),
      testID: "homeChallengesCount",
    },
    {
      key: "badges",
      icon: AwardIcon,
      label: i18n.t( "badges.earned" ),
      onPress: ( ) => navigation.navigate( "Achievements" ),
      value: formatCount( summary.badgesEarned ),
      testID: "homeBadgesCount",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.header}>{i18n.t( "home.your_collection" )}</Text>
      </View>
      <View style={styles.grid}>
        {items.map( item => {
          const Icon = item.icon;
          const label = item.label.replace( /\n/g, " " );
          return (
            <Pressable
              accessibilityLabel={`${item.value} ${label}`}
              accessibilityRole="button"
              key={item.key}
              onPress={item.onPress}
              style={( { pressed } ) => [styles.card, pressed && styles.cardPressed]}
              testID={item.testID}
            >
              <View style={styles.iconDisc}>
                <Icon color={theme.colors.onSecondaryContainer} size={18} />
              </View>
              <Text style={styles.value}>{item.value}</Text>
              <Text numberOfLines={2} style={styles.label}>{label}</Text>
            </Pressable>
          );
        } )}
      </View>
    </View>
  );
};

const HomeScreen = ( ) => {
  const navigation = useNavigation( );
  const summary = useProgressSummary( );
  const [showModal, setModal] = useState( false );
  const [showUploadCard, setShowUploadCard] = useState( false );
  const [successfulUploads, setSuccessfulUploads] = useState( 0 );
  const [numPendingUploads, setNumPendingUploads] = useState( 0 );

  const openModal = ( ) => setModal( true );
  const closeModal = ( ) => setModal( false );
  const closeCard = useCallback( ( ) => setShowUploadCard( false ), [] );

  const updateSuccessfulUploads = num => setSuccessfulUploads( num );

  useEffect( ( ) => {
    const checkForFirstLaunch = async ( ) => {
      // also adding some other app startup type things in here
      // that don't need to run in App.js or Splash.js
      if ( Platform.OS === "android" ) {
        deleteDebugLogAfter7Days( ); // delete debug logs on Android
      }
      const isFirstLaunch = await checkIfCardShown( );
      if ( isFirstLaunch ) {
        openModal( );
      }
    };
    checkForFirstLaunch( );
  }, [] );

  useFocusEffect(
    useCallback( ( ) => {
      const onBackPress = ( ) => {
        // Do not react to back button press => let react-navigation handle it, i.e. since we are on home srceen it closes the app
        return false;
      };

      const backHandler = BackHandler.addEventListener( "hardwareBackPress", onBackPress );

      return ( ) => backHandler.remove();
    }, [] )
  );

  useEffect( ( ) => {
    // need to do this on home screen since it changes the styling of SpeciesNearby and status bar
    const checkUploads = async ( ) => {
      const numUnseenUploads = await checkForNumSuccessfulUploads( );

      if ( numUnseenUploads > 0 ) {
        setShowUploadCard( true );
        setSuccessfulUploads( numUnseenUploads );
      } else {
        const allUploads = await checkForUploads( );
        const pendingUploads = allUploads.filtered( "photo.uploadSucceeded == false AND photo.uploadFailed == false AND queued == false" ).length;
        if ( pendingUploads > 0 ) {
          setShowUploadCard( true );
          setNumPendingUploads( pendingUploads );
        }
      }
    };

    const unsubscribe = navigation.addListener( "focus", ( ) => {
      checkUploads( );
    } );

    return unsubscribe;
  }, [navigation] );

  useEffect( ( ) => {
    if ( successfulUploads > 0 ) {
      markUploadsAsSeen( );
    }
  }, [successfulUploads] );

  return (
    <ScrollNoHeader showUploadCard={showUploadCard}>
      <RNModal
        showModal={showModal}
        closeModal={closeModal}
        modal={<GetStarted closeModal={closeModal} />}
      />
      <HomeHero summary={summary} navigation={navigation} />
      {showUploadCard && (
        <UploadStatus
          successfulUploads={successfulUploads}
          numPendingUploads={numPendingUploads}
          updateSuccessfulUploads={updateSuccessfulUploads}
          closeCard={closeCard}
        />
      )}
      <SpeciesNearby />
      <HomeCollectionStrip summary={summary} navigation={navigation} />
      <Announcements />
      <SeekYearInReviewCard />
      <Updates />
      <ChallengeCard />
      <INatCard />
      <DonateCard />
    </ScrollNoHeader>
  );
};

export default HomeScreen;
