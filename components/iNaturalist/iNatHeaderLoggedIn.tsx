// @ts-nocheck
import React, { useContext, useState } from "react";
import { View, Platform } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import { viewStyles } from "../../styles/iNaturalist/iNatStats";
import BulletedList from "./BulletedList";
import OpenINatButton from "../UIComponents/Buttons/OpenINatButton";
import ProfileImageAndLogin from "./ProfileImageAndLogin";
import { useUploadedObservationCount } from "../../utility/customHooks";
import { UserContext } from "../UserContext";
import { useAppOrientation } from "../Providers/AppOrientationProvider";
import { useTheme } from "../Providers/ThemeProvider";

const INatHeaderLoggedIn = ( ) => {
  // Brand surface for white text: primary in light, primary container in dark (follows the accent)
  const { theme } = useTheme( );
  const brandSurface = theme.isDark ? theme.colors.primaryContainer : theme.colors.primary;
  const [triggerReload, setTriggerReload] = useState( false );
  const { userProfile, login } = useContext( UserContext );
  const { isTablet } = useAppOrientation( );
  const count = useUploadedObservationCount( {
    login,
    username: userProfile.login,
    triggerReload,
  } );

  const reload = () => { setTriggerReload( !triggerReload ); };

  return (
    <>
      <LinearGradient
        colors={[brandSurface, brandSurface]}
        style={viewStyles.linearGradient}
      >
        <ProfileImageAndLogin count={count} reload={reload} />
        {Platform.OS === "android" && <OpenINatButton />}
      </LinearGradient>
      <View style={viewStyles.loggedInHeaderMargin} />
      <View style={[viewStyles.textContainer, isTablet && viewStyles.tabletContainer]}>
        <BulletedList text="about_inat.logged_in_bullet_1" />
        <BulletedList text="about_inat.logged_in_bullet_2" />
        <BulletedList text="about_inat.logged_in_bullet_3" />
      </View>
    </>
  );
};

export default INatHeaderLoggedIn;
