// @ts-nocheck
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { FlashListRef } from "@shopify/flash-list";
import { useNavigation, useScrollToTop } from "@react-navigation/native";

import { viewStyles } from "../../styles/notifications";
import NotificationCard from "./NotificationCard";
import EmptyState from "../UIComponents/EmptyState";
import Padding from "../UIComponents/Padding";
import BottomSpacer from "../UIComponents/BottomSpacer";
import { markNotificationsAsViewed } from "../../utility/notificationHelpers";
import ViewWithHeader from "../UIComponents/Screens/ViewWithHeader";
import type { Notification } from "./hooks/notificationHooks";
import useFetchNotifications from "./hooks/notificationHooks";
import { useTheme } from "../Providers/ThemeProvider";

const NotificationsScreen = ( ) => {
  const navigation = useNavigation( );
  const scrollView = useRef<FlashListRef<Notification>>( null );
  const notifications = useFetchNotifications( );
  const { theme } = useTheme( );

  const themedStyles = useMemo( () => StyleSheet.create( {
    content: {
      backgroundColor: theme.colors.canvas,
    },
    divider: {
      backgroundColor: theme.colors.border,
    },
  } ), [theme] );

  useScrollToTop( scrollView );

  useEffect( ( ) => {
    const unsubscribe = navigation.addListener( "focus", ( ) => {
      markNotificationsAsViewed( );
    } );

    return unsubscribe;
  }, [navigation] );

  const renderItem = useCallback(
    ( { item }: { item: Notification } ) => <NotificationCard item={item} />,
    [],
  );
  const showEmptyList = useCallback( ( ) => <EmptyState />, [] );
  const renderItemSeparator = useCallback(
    ( ) => <View style={[viewStyles.divider, themedStyles.divider]} />,
    [themedStyles],
  );
  const renderFooter = useCallback( ( ) => (
    <>
      <Padding />
      <BottomSpacer />
    </>
  ), [] );
  const extractKey = useCallback(
    ( item: Notification, index: number ) => `${item.index ?? item.title ?? "notification"}-${index}`,
    [],
  );

  return (
    <ViewWithHeader testID="notifications-screen-container" header="notifications.header">
      <FlashList
        ref={scrollView}
        contentContainerStyle={[viewStyles.containerWhite, themedStyles.content]}
        data={notifications}
        keyExtractor={extractKey}
        ListFooterComponent={renderFooter}
        renderItem={renderItem}
        ListEmptyComponent={showEmptyList}
        ItemSeparatorComponent={renderItemSeparator}
      />
    </ViewWithHeader>
  );
};

export default NotificationsScreen;
