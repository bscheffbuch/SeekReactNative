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
import { BellIcon, CameraIcon, MenuIcon, TrophyIcon } from "./AppIcons";
import { useTheme } from "../Providers/ThemeProvider";

const Footer = () => {
  let challenge;
  const navigation = useNavigation();
  const route = useRoute();
  const [notifications, setNotifications] = useState( false );
  const { theme } = useTheme();
  const styles = StyleSheet.create( {
    safeArea: {
      backgroundColor: theme.colors.surface,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: theme.isDark ? 0.22 : 0.08,
      shadowRadius: 14,
    },
    navbar: {
      alignItems: "center",
      flexDirection: "row",
      height: 70,
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
    },
    iconButton: {
      alignItems: "center",
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    cameraButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.surface,
      borderRadius: 27,
      borderWidth: 2,
      height: 54,
      justifyContent: "center",
      marginTop: -theme.spacing.lg,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.26,
      shadowRadius: 16,
      width: 54,
      elevation: 5,
    },
    notificationDot: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.surface,
      borderRadius: 5,
      borderWidth: 2,
      height: 10,
      position: "absolute",
      right: 10,
      top: 9,
      width: 10,
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
          <TouchableOpacity
            accessibilityLabel={i18n.t( "accessibility.menu" )}
            accessible
            onPress={navToDrawer}
            style={styles.iconButton}
          >
            <MenuIcon color={theme.colors.text} size={25} strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="openCameraButton"
            accessibilityLabel={i18n.t( "accessibility.camera" )}
            accessible
            onPress={() => navigation.navigate( "Camera" )}
            style={styles.cameraButton}
          >
            <CameraIcon color={theme.colors.inverseText} size={27} strokeWidth={2.25} />
          </TouchableOpacity>
          {challenge ? (
            <TouchableOpacity
              accessibilityLabel={i18n.t( "accessibility.iNatStats" )}
              accessible
              onPress={() => navigation.navigate( "iNatStats" )}
              style={styles.iconButton}
            >
              <TrophyIcon color={theme.colors.text} size={25} strokeWidth={2.2} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              accessibilityLabel={i18n.t( "accessibility.notifications" )}
              accessible
              onPress={() => navigation.navigate( "Notifications" )}
              style={styles.iconButton}
            >
              <BellIcon color={notifications ? theme.colors.primary : theme.colors.text} size={25} strokeWidth={2.2} />
              {notifications ? <View style={styles.notificationDot} /> : null}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Footer;
