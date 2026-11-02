// @ts-nocheck
import React, { useEffect, useCallback, useRef } from "react";
import { Image, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";

import styles from "../styles/splash";
import logos from "../assets/logos";
import backgrounds from "../assets/backgrounds";
import { checkIfFirstLaunch, setCameraLaunched } from "../utility/helpers";
import { addARCameraFiles } from "../utility/cameraFilesHelpers";
import { setupBadges } from "../utility/badgeHelpers";
import { checkForHotStarts, checkForColdStarts, setQuickActions } from "../utility/navigationHelpers";
import { deleteFromAsyncStorage, setupUserSettings } from "../utility/settingsHelpers";
import { useAppOrientation } from "./Providers/AppOrientationProvider";

// Keep the splash up at least this long so a fast start doesn't flash it.
// It used to wait a fixed 2 s after setup had already finished.
const MIN_SPLASH_MS = 600;

const SplashScreen = ( ) => {
  const { isTablet } = useAppOrientation( );
  const navigation = useNavigation( );
  const shownAt = useRef( Date.now( ) );
  const navToCamera = useCallback( ( ) => navigation.navigate( "Camera" ), [navigation] );

  const resetRouter = useCallback( ( name ) => {
    const params = name === "MainTabs" ? { screen: "Home" } : undefined;
    const wait = Math.max( 0, MIN_SPLASH_MS - ( Date.now( ) - shownAt.current ) );
    setTimeout( ( ) => navigation.reset( { routes: [{ name, params }] } ), wait );
  }, [navigation] );

  const checkForQuickAction = useCallback( ( ) => {
    checkForHotStarts( navToCamera );
    checkForColdStarts( navToCamera, resetRouter );
  }, [resetRouter, navToCamera] );

  useEffect( ( ) => {
    const checkForNewUser = async ( ) => {
      setCameraLaunched( false );
      await deleteFromAsyncStorage( "speciesNearbyLocation" );
      await setupUserSettings( );

      // originally, I thought we could move AR camera files into the main bundle on first launch only,
      // but this breaks the camera for offloaded apps on iOS
      addARCameraFiles( );
      const isFirstLaunch = await checkIfFirstLaunch( );

      if ( isFirstLaunch ) {
        setTimeout( setupBadges, 3000 );
        setQuickActions( );
        resetRouter( "Onboarding" );
      } else {
        checkForQuickAction( );
      }
    };

    checkForNewUser( );
  }, [navigation, checkForQuickAction, resetRouter] );

  return (
    <ImageBackground
      source={isTablet ? backgrounds.splashiPad : backgrounds.splash}
      style={styles.backgroundImage}
    >
      <Image
        source={logos.seek}
        style={[styles.logo, isTablet && styles.logoTablet]}
      />
    </ImageBackground>
  );
};

export default SplashScreen;
