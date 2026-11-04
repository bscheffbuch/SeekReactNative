import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  BinocularsIcon,
  CameraIcon,
  HouseIcon,
  ImageIcon,
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
import { makeThemedStyles } from "../../styles/themedStyles";
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

const getStyles = makeThemedStyles( ( theme: ThemeTokens ) => ( {
  bar: {
    backgroundColor: theme.colors.surfaceContainer,
    flexDirection: "row",
    paddingHorizontal: theme.spacing.sm,
    paddingTop: 12,
  },
  item: {
    alignItems: "center",
    flex: 1,
    minHeight: 56,
  },
  // Always give the pill a background (transparent when inactive) and clip it:
  // on the new architecture a background added after mount can lose the radius.
  indicator: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderCurve: "continuous",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    overflow: "hidden",
    width: 64,
  },
  indicatorActive: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: theme.typography.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: theme.spacing.xs,
  },
  labelActive: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
  },
  fab: {
    alignItems: "center",
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 16,
    elevation: 6,
    flexDirection: "row",
    gap: 12,
    height: 56,
    paddingLeft: theme.spacing.md,
    paddingRight: 20,
    position: "absolute",
    right: theme.spacing.md,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDark ? 0.4 : 0.16,
    shadowRadius: 8,
  },
  fabPressed: {
    opacity: 0.88,
  },
  // M3 small FAB for the secondary action, stacked above the extended Scan FAB
  photosFab: {
    alignItems: "center",
    backgroundColor: theme.colors.secondaryContainer,
    borderCurve: "continuous",
    borderRadius: 14,
    elevation: 4,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: theme.spacing.md,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: theme.isDark ? 0.35 : 0.14,
    shadowRadius: 6,
    width: 48,
  },
  fabLabel: {
    color: theme.colors.onPrimaryContainer,
    fontFamily: theme.typography.heading,
    fontSize: 15,
    lineHeight: 20,
  },
} ) );

// Material 3 navigation bar: tonal surface, pill indicator behind the active icon,
// and the camera promoted to an extended FAB above the bar (M3 bars have no raised
// centre button).
const M3TabBar = ( { state, navigation }: BottomTabBarProps ) => {
  const { theme } = useTheme( );
  const styles = getStyles( theme );
  const insets = useSafeAreaInsets( );
  const barHeight = 68 + Math.max( insets.bottom, 12 );
  const routes = state.routes.filter( route => route.name !== "Scan" );

  return (
    <View>
      <View accessibilityRole="tablist" style={[styles.bar, { height: barHeight, paddingBottom: Math.max( insets.bottom, 12 ) }]}>
        {routes.map( route => {
          const name = route.name as keyof BottomTabParamList;
          const focused = state.routes[state.index]?.key === route.key;
          const Icon = tabIcons[name];
          const label = tabDisplayLabels[name] || i18n.t( tabLabels[name] );
          const onPress = ( ) => {
            const event = navigation.emit( { type: "tabPress", target: route.key, canPreventDefault: true } );
            if ( !focused && !event.defaultPrevented ) {
              navigation.navigate( route.name, route.params );
            }
          };
          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              key={route.key}
              onPress={onPress}
              style={styles.item}
              testID={`tab-${name}`}
            >
              <View style={[styles.indicator, focused && styles.indicatorActive]}>
                <Icon
                  color={focused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant}
                  size={24}
                  strokeWidth={focused ? 2.4 : 2}
                />
              </View>
              <Text numberOfLines={1} style={[styles.label, focused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        } )}
      </View>
    </View>
  );
};

const renderTabBar = ( props: BottomTabBarProps ) => <M3TabBar {...props} />;

const FAB_GAP = 16;
const SCAN_FAB_HEIGHT = 56;

// The FAB sits over the navigator (not inside the bar) so its whole area takes touches.
const ScanFab = ( ) => {
  const { theme } = useTheme( );
  const styles = getStyles( theme );
  const insets = useSafeAreaInsets( );
  const navigation = useNavigation( );
  const barHeight = 68 + Math.max( insets.bottom, 12 );
  return (
    <Pressable
      accessibilityLabel={i18n.t( tabLabels.Scan )}
      accessibilityRole="button"
      onPress={( ) => navigation.navigate( "Camera" as never )}
      style={( { pressed } ) => [styles.fab, { bottom: barHeight + FAB_GAP }, pressed && styles.fabPressed]}
      testID="scanFab"
    >
      <CameraIcon color={theme.colors.onPrimaryContainer} size={24} strokeWidth={2} />
      <Text style={styles.fabLabel}>{i18n.t( tabLabels.Scan )}</Text>
    </Pressable>
  );
};

// Identifies photos from the gallery without starting the camera stream.
const PhotosFab = ( ) => {
  const { theme } = useTheme( );
  const styles = getStyles( theme );
  const insets = useSafeAreaInsets( );
  const navigation = useNavigation( );
  const barHeight = 68 + Math.max( insets.bottom, 12 );
  return (
    <Pressable
      accessibilityLabel={i18n.t( "photo_id.header" )}
      accessibilityRole="button"
      hitSlop={4}
      onPress={( ) => navigation.navigate( "PhotoIdentify" as never )}
      style={( { pressed } ) => [
        styles.photosFab,
        { bottom: barHeight + FAB_GAP + SCAN_FAB_HEIGHT + 12 },
        pressed && styles.fabPressed,
      ]}
      testID="photosFab"
    >
      <ImageIcon color={theme.colors.onSecondaryContainer} size={22} strokeWidth={2} />
    </Pressable>
  );
};

const BottomTabs = ( ) => (
  <View style={fill.container}>
    <Tab.Navigator
    initialRouteName="Home"
    screenOptions={{ headerShown: false }}
    tabBar={renderTabBar}
  >
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="Observations" component={Observations} />
    <Tab.Screen
      name="Scan"
      component={ScanPlaceholder}
      listeners={( { navigation } ) => ( {
        tabPress: handleScanTabPress( navigation ),
      } )}
    />
    <Tab.Screen name="Challenges" component={Challenges} />
    <Tab.Screen name="More" component={More} />
    </Tab.Navigator>
    <PhotosFab />
    <ScanFab />
  </View>
);

const fill = StyleSheet.create( { container: { flex: 1 } } );

export default BottomTabs;
