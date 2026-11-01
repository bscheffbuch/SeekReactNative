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
  StyleSheet,
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

const HomeHero = ( { summary, navigation } ) => {
  const { theme } = useTheme( );
  const { level, nextLevelCount, speciesCount } = summary;
  const styles = StyleSheet.create( {
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    card: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      ...theme.elevation.card,
    },
    cardPressed: {
      backgroundColor: theme.colors.primaryContainer,
    },
    badge: {
      height: 64,
      width: 64,
    },
    badgePlaceholder: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 32,
      height: 64,
      width: 64,
    },
    textColumn: {
      flex: 1,
    },
    kicker: {
      color: theme.colors.muted,
      fontFamily: theme.typography.heading,
      fontSize: 12,
      letterSpacing: 0,
      lineHeight: 16,
    },
    title: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 24,
      letterSpacing: 0,
      lineHeight: 30,
      marginTop: theme.spacing.xxs,
    },
    track: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 3,
      height: 6,
      marginTop: theme.spacing.sm,
      overflow: "hidden",
    },
    fill: {
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
      height: 6,
    },
    caption: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
      fontSize: 13,
      lineHeight: 18,
      marginTop: theme.spacing.xs,
    },
  } );

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
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round( progress * 100 )}%` }]} />
          </View>
          {summary.loaded && <Text style={styles.caption}>{caption}</Text>}
        </View>
      </Pressable>
    </View>
  );
};

const HomeCollectionStrip = ( { summary, navigation } ) => {
  const { theme } = useTheme( );
  const styles = StyleSheet.create( {
    container: {
      paddingHorizontal: theme.spacing.lg,
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
      fontSize: 18,
      lineHeight: 24,
    },
    grid: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flex: 1,
      minHeight: 104,
      padding: theme.spacing.md,
      ...theme.elevation.card,
    },
    cardPressed: {
      backgroundColor: theme.colors.primaryContainer,
    },
    value: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 22,
      lineHeight: 28,
      marginTop: theme.spacing.sm,
    },
    label: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
      fontSize: 12,
      lineHeight: 16,
      marginTop: theme.spacing.xxs,
    },
  } );

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
              <Icon color={theme.colors.primary} size={20} />
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
