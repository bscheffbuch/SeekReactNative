// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Realm from "realm";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../../i18n";
import realmConfig from "../../models";
import { BellIcon, CameraIcon, ImageIcon, MenuIcon, TrophyIcon } from "./AppIcons";
import { useTheme } from "../Providers/ThemeProvider";

const Footer = () => {
  let challenge;
  const navigation = useNavigation();
  const route = useRoute();
  const [notifications, setNotifications] = useState( false );
  const { theme } = useTheme();
  // Material 3 bottom app bar: tonal surface, no shadow, camera as an in-bar FAB.
  const styles = StyleSheet.create( {
    safeArea: {
      backgroundColor: theme.colors.surfaceContainer,
    },
    container: {
      backgroundColor: theme.colors.surfaceContainer,
    },
    navbar: {
      alignItems: "center",
      flexDirection: "row",
      height: 80,
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
    },
    // equal widths on both sides keep the camera button centered
    side: {
      flexDirection: "row",
      width: 96,
    },
    sideEnd: {
      justifyContent: "flex-end",
    },
    iconButton: {
      alignItems: "center",
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    cameraButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderCurve: "continuous",
      borderRadius: 16,
      height: 56,
      justifyContent: "center",
      width: 56,
    },
    notificationDot: {
      backgroundColor: theme.colors.destructive,
      borderRadius: 3,
      height: 6,
      position: "absolute",
      right: 12,
      top: 12,
      width: 6,
    },
  } );

  if ( route.name === "Challenges" || route.name === "ChallengeDetails" ) {
    challenge = true;
  }

  useEffect( () => {
    let isCurrent = true;
    const fetchNotifications = () => {
      Realm.open( realmConfig ).then( ( realm ) => {
        const newNotifications = realm.objects( "NotificationRealm" ).filtered( "viewed == false" ).length;
        if ( !isCurrent ) { return; }
        if ( newNotifications > 0 ) {
          setNotifications( true );
        } else {
          setNotifications( false );
        }
      } ).catch( () => {
        console.log( "[DEBUG] Failed to fetch notifications: " );
      } );
    };

    const unsubscribe = navigation.addListener( "focus", () => {
      fetchNotifications();
    } );

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, [navigation] );

  const navToDrawer = ( ) => {
    navigation.openDrawer( );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["right", "bottom", "left"]}>
      <View style={styles.container}>
        <View style={styles.navbar}>
          <View style={styles.side}>
            <TouchableOpacity
              accessibilityLabel={i18n.t( "accessibility.menu" )}
              accessible
              onPress={navToDrawer}
              style={styles.iconButton}
            >
              <MenuIcon color={theme.colors.onSurfaceVariant} size={24} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="identifyPhotosButton"
              accessibilityLabel={i18n.t( "photo_id.header" )}
              accessible
              onPress={() => navigation.navigate( "PhotoIdentify" )}
              style={styles.iconButton}
            >
              <ImageIcon color={theme.colors.onSurfaceVariant} size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            testID="openCameraButton"
            accessibilityLabel={i18n.t( "accessibility.camera" )}
            accessible
            onPress={() => navigation.navigate( "Camera" )}
            style={styles.cameraButton}
          >
            <CameraIcon color={theme.colors.onPrimaryContainer} size={24} strokeWidth={2} />
          </TouchableOpacity>
          <View style={[styles.side, styles.sideEnd]}>
          {challenge ? (
            <TouchableOpacity
              accessibilityLabel={i18n.t( "accessibility.iNatStats" )}
              accessible
              onPress={() => navigation.navigate( "iNatStats" )}
              style={styles.iconButton}
            >
              <TrophyIcon color={theme.colors.onSurfaceVariant} size={24} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              accessibilityLabel={i18n.t( "accessibility.notifications" )}
              accessible
              onPress={() => navigation.navigate( "Notifications" )}
              style={styles.iconButton}
            >
              <BellIcon color={theme.colors.onSurfaceVariant} size={24} strokeWidth={2} />
              {notifications ? <View style={styles.notificationDot} /> : null}
            </TouchableOpacity>
          )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Footer;
