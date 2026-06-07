// @ts-nocheck
import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  BackHandler,
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
import { checkIfCardShown } from "../../utility/helpers";
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

const HomeHero = ( ) => {
  const { theme } = useTheme( );
  const styles = StyleSheet.create( {
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    topRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.md,
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
      fontSize: 28,
      letterSpacing: 0,
      lineHeight: 32,
      marginTop: theme.spacing.xs,
    },
    levelRing: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.accent,
      borderRadius: 24,
      borderWidth: 3,
      height: 48,
      justifyContent: "center",
      minHeight: 48,
      minWidth: 48,
      width: 48,
    },
    levelText: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 15,
      lineHeight: 20,
    },
    locationPill: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: theme.colors.elevatedSurface,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.md,
      minHeight: 36,
      paddingHorizontal: theme.spacing.md,
    },
    locationDot: {
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
      height: 8,
      width: 8,
    },
    locationText: {
      color: theme.colors.muted,
      fontFamily: theme.typography.heading,
      fontSize: 13,
      lineHeight: 18,
    },
    statRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    stat: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: theme.spacing.sm,
      minHeight: 58,
      paddingHorizontal: theme.spacing.md,
      ...theme.elevation.card,
    },
    statLabel: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 14,
      lineHeight: 18,
    },
    statMeta: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
      fontSize: 12,
      lineHeight: 16,
    },
  } );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.kicker}>Field notebook</Text>
          <Text accessibilityRole="header" style={styles.title}>Hello, Naturalist</Text>
        </View>
        <View
          accessibilityLabel="Level 1"
          accessibilityRole="summary"
          style={styles.levelRing}
        >
          <Text style={styles.levelText}>1</Text>
        </View>
      </View>
      <View style={styles.locationPill}>
        <View style={styles.locationDot} />
        <Text numberOfLines={1} style={styles.locationText}>Species near you</Text>
      </View>
      <View style={styles.statRow}>
        <View style={styles.stat}>
          <BinocularsIcon color={theme.colors.primary} size={22} />
          <View>
            <Text style={styles.statLabel}>Nearby</Text>
            <Text style={styles.statMeta}>Species</Text>
          </View>
        </View>
        <View style={styles.stat}>
          <TrophyIcon color={theme.colors.accent} size={22} />
          <View>
            <Text style={styles.statLabel}>Quests</Text>
            <Text style={styles.statMeta}>In season</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const HomeCollectionStrip = ( { navigation } ) => {
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
      minHeight: 94,
      padding: theme.spacing.md,
      ...theme.elevation.card,
    },
    cardPressed: {
      backgroundColor: theme.colors.primaryContainer,
    },
    value: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 19,
      lineHeight: 24,
      marginTop: theme.spacing.sm,
    },
    label: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
      fontSize: 12,
      lineHeight: 16,
      marginTop: theme.spacing.xs,
    },
  } );
  const items = [
    {
      icon: BinocularsIcon,
      label: "Log",
      route: "Observations",
      value: "Species",
    },
    {
      icon: TrophyIcon,
      label: "Quests",
      route: "Challenges",
      value: "Active",
    },
    {
      icon: AwardIcon,
      label: "Badges",
      route: "Achievements",
      value: "Earned",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Your collection</Text>
      </View>
      <View style={styles.grid}>
        {items.map( item => {
          const Icon = item.icon;
          return (
            <Pressable
              accessibilityLabel={item.label}
              accessibilityRole="button"
              key={item.label}
              onPress={() => navigation.navigate( item.route )}
              style={( { pressed } ) => [styles.card, pressed && styles.cardPressed]}
            >
              <Icon color={theme.colors.primary} size={20} />
              <Text style={styles.value}>{item.value}</Text>
              <Text style={styles.label}>{item.label}</Text>
            </Pressable>
          );
        } )}
      </View>
    </View>
  );
};

const HomeScreen = ( ) => {
  const navigation = useNavigation( );
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
      <HomeHero />
      {showUploadCard && (
        <UploadStatus
          successfulUploads={successfulUploads}
          numPendingUploads={numPendingUploads}
          updateSuccessfulUploads={updateSuccessfulUploads}
          closeCard={closeCard}
        />
      )}
      <SpeciesNearby />
      <HomeCollectionStrip navigation={navigation} />
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
