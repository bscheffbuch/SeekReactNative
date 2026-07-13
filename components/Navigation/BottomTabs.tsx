import React from "react";
import { StyleSheet, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import {
  BinocularsIcon,
  CameraIcon,
  HouseIcon,
  MenuIcon,
  TrophyIcon,
} from "../UIComponents/AppIcons";
import type { GlyphIcon } from "../UIComponents/AppIcons";

import i18n from "../../i18n";
import Home from "../Home/HomeScreen";
import Observations from "../Observations/Observations";
import Challenges from "../Challenges/ChallengeScreen/ChallengeScreen";
import More from "./MoreScreen";
import { useTheme } from "../Providers/ThemeProvider";
import type { ThemeTokens } from "../../styles/theme";
import type { BottomTabParamList } from "./types";
import { handleScanTabPress, tabLabels } from "./bottomTabHelpers";

const Tab = createBottomTabNavigator<BottomTabParamList>( );

const ScanPlaceholder = ( ) => <View />;

const tabIcons: Record<keyof BottomTabParamList, GlyphIcon> = {
  Home: HouseIcon,
  Observations: BinocularsIcon,
  Scan: CameraIcon,
  Challenges: TrophyIcon,
  More: MenuIcon,
};

const tabDisplayLabels: Partial<Record<keyof BottomTabParamList, string>> = {
  Observations: "Log",
  Challenges: "Quests",
};

type TabIconProps = {
  routeName: keyof BottomTabParamList;
  color: string;
  focused: boolean;
  theme: ThemeTokens;
};

const tabIconStyles = ( theme: ThemeTokens, focused: boolean ) => StyleSheet.create( {
  scanIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderColor: focused ? theme.colors.accent : theme.colors.surface,
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
} );

const TabIcon = ( { routeName, color, focused, theme }: TabIconProps ) => {
  const Icon = tabIcons[routeName];
  const styles = tabIconStyles( theme, focused );

  return (
    <View style={routeName === "Scan" ? styles.scanIcon : undefined}>
      <Icon color={routeName === "Scan" ? theme.colors.inverseText : color} size={routeName === "Scan" ? 26 : 23} strokeWidth={2.2} />
    </View>
  );
};

const BottomTabs = ( ) => {
  const navigation = useNavigation( );
  const { theme } = useTheme( );

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={( { route } ) => {
        return {
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarLabel: tabDisplayLabels[route.name] || i18n.t( tabLabels[route.name] ),
          tabBarLabelStyle: {
            fontFamily: theme.typography.heading,
            fontSize: 11,
            lineHeight: 15,
          },
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            minHeight: 68,
            paddingBottom: theme.spacing.xs,
            paddingTop: theme.spacing.sm,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: theme.isDark ? 0.22 : 0.08,
            shadowRadius: 14,
          },
          // React Navigation expects a render callback here.
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ( { color, focused } ) => (
            <TabIcon color={color} focused={focused} routeName={route.name} theme={theme} />
          ),
        };
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Observations" component={Observations} />
      <Tab.Screen
        name="Scan"
        component={ScanPlaceholder}
        listeners={{
          tabPress: handleScanTabPress( navigation ),
        }}
      />
      <Tab.Screen name="Challenges" component={Challenges} />
      <Tab.Screen name="More" component={More} />
    </Tab.Navigator>
  );
};

export default BottomTabs;
