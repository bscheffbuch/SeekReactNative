import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  
  
  
} from "react-native";
import type {StyleProp, TextStyle, ViewStyle} from "react-native";
import { SafeAreaView  } from "react-native-safe-area-context";
import type {Edge} from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Realm from "realm";
import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleHelpIcon,
} from "./AppIcons";
import type {GlyphIcon} from "./AppIcons";

import i18n from "../../i18n";
import realmConfig from "../../models";
import { useTheme } from "../Providers/ThemeProvider";
import type { ThemeTokens } from "../../styles/theme";

type AppIconProps = {
  icon: GlyphIcon;
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

type AppHeaderProps = {
  title?: string;
  titleKey?: string;
  backRoute?: string | null;
  showBack?: boolean;
  showNotifications?: boolean;
  notificationUnread?: boolean;
};

type AppScreenProps = React.PropsWithChildren<{
  testID?: string;
  scroll?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

type SurfaceCardProps = React.PropsWithChildren<{
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

type ListRowProps = {
  label: string;
  detail?: string;
  icon?: GlyphIcon;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

const tabRootRoutes = ["Home", "Observations", "Challenges", "More"];

const themedStyles = ( theme: ThemeTokens ) => StyleSheet.create( {
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  screenContent: {
    backgroundColor: theme.colors.canvas,
    flexGrow: 1,
  },
  header: {
    minHeight: 64,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: theme.colors.canvas,
  },
  headerTitle: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.typography.heading,
    fontSize: 22,
    lineHeight: 28,
    marginHorizontal: theme.spacing.sm,
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 48,
    width: 48,
  },
  iconButtonPressed: {
    backgroundColor: theme.colors.pressed,
  },
  unreadDot: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.surface,
    borderRadius: 5,
    borderWidth: 1,
    height: 10,
    position: "absolute",
    right: 11,
    top: 11,
    width: 10,
  },
  button: {
    alignItems: "center",
    borderRadius: theme.radii.sm,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.48,
  },
  primaryButtonText: {
    color: theme.colors.inverseText,
    fontFamily: theme.typography.heading,
    fontSize: 16,
    lineHeight: 22,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.heading,
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    ...theme.elevation.card,
  },
  cardPressed: {
    backgroundColor: theme.colors.primaryContainer,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowIcon: {
    marginRight: theme.spacing.md,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 16,
    lineHeight: 22,
  },
  rowDetail: {
    color: theme.colors.muted,
    fontFamily: theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: theme.spacing.xxs,
  },
  sectionHeading: {
    color: theme.colors.muted,
    fontFamily: theme.typography.heading,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  emptyStateTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
  },
  emptyStateText: {
    color: theme.colors.muted,
    fontFamily: theme.typography.body,
    fontSize: 16,
    lineHeight: 23,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
} );

const useUnreadNotifications = ( providedUnread?: boolean ) => {
  const navigation = useNavigation( );
  const [unread, setUnread] = useState( false );

  useEffect( () => {
    if ( providedUnread !== undefined ) {
      setUnread( providedUnread );
      return undefined;
    }

    let isCurrent = true;
    const fetchNotifications = () => {
      Realm.open( realmConfig )
        .then( realm => {
          const hasUnread = realm.objects( "NotificationRealm" ).filtered( "viewed == false" ).length > 0;
          if ( isCurrent ) {
            setUnread( hasUnread );
          }
        } )
        .catch( () => {
          if ( isCurrent ) {
            setUnread( false );
          }
        } );
    };

    fetchNotifications();
    const unsubscribe = navigation.addListener( "focus", fetchNotifications );

    return () => {
      isCurrent = false;
      unsubscribe?.();
    };
  }, [navigation, providedUnread] );

  return unread;
};

const AppIcon = ( {
  icon: Icon,
  color,
  size = 24,
  strokeWidth = 2,
}: AppIconProps ) => {
  const { theme } = useTheme( );
  return <Icon color={color || theme.colors.text} size={size} strokeWidth={strokeWidth} />;
};

const IconButton = ( {
  icon,
  label,
  onPress,
  color,
  disabled = false,
}: AppIconProps & { label: string; onPress: () => void; disabled?: boolean } ) => {
  const { theme } = useTheme( );
  const styles = themedStyles( theme );

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={( { pressed } ) => [
        styles.iconButton,
        pressed && styles.iconButtonPressed,
        disabled && styles.disabledButton,
      ]}
    >
      <AppIcon icon={icon} color={color || theme.colors.text} />
    </Pressable>
  );
};

const AppHeader = ( {
  title,
  titleKey,
  backRoute = null,
  showBack,
  showNotifications = true,
  notificationUnread,
}: AppHeaderProps ) => {
  const navigation = useNavigation( );
  const route = useRoute( );
  const { theme } = useTheme( );
  const styles = themedStyles( theme );
  const unread = useUnreadNotifications( notificationUnread );
  const resolvedTitle = titleKey ? i18n.t( titleKey ) : title;
  const canGoBack = typeof navigation.canGoBack === "function" && navigation.canGoBack();
  const shouldShowBack = showBack ?? ( canGoBack && !tabRootRoutes.includes( route.name ) );
  const shouldShowNotifications = showNotifications && route.name !== "Notifications";

  const handleBack = () => {
    if ( backRoute ) {
      navigation.navigate( backRoute as never );
      return;
    }
    navigation.goBack();
  };

  const handleNotifications = () => navigation.navigate( "Notifications" as never );
  const handlePostingHelp = () => navigation.navigate( "PostingHelp" as never );

  return (
    <View style={styles.header}>
      {shouldShowBack ? (
        <IconButton
          icon={ChevronLeftIcon}
          label={i18n.t( "accessibility.back" )}
          onPress={handleBack}
        />
      ) : <View style={styles.headerSpacer} />}
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={styles.headerTitle}
      >
        {resolvedTitle}
      </Text>
      {route.name === "Post" ? (
        <IconButton
          icon={CircleHelpIcon}
          label={i18n.t( "accessibility.open_posting_help" )}
          onPress={handlePostingHelp}
        />
      ) : shouldShowNotifications ? (
        <View>
          <IconButton
            icon={BellIcon}
            label={i18n.t( "accessibility.notifications" )}
            onPress={handleNotifications}
          />
          {unread && <View testID="unreadNotificationsIndicator" style={styles.unreadDot} />}
        </View>
      ) : <View style={styles.headerSpacer} />}
    </View>
  );
};

const AppScreen = ( {
  children,
  testID,
  scroll = false,
  edges = ["top", "left", "right"],
  style,
  contentContainerStyle,
}: AppScreenProps ) => {
  const { theme } = useTheme( );
  const styles = themedStyles( theme );

  return (
    <SafeAreaView testID={testID} style={[styles.screen, style]} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.screenContent, contentContainerStyle]}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screenContent, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const AppButton = ( {
  label,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  textStyle,
  primary,
}: ButtonProps & { primary: boolean } ) => {
  const { theme } = useTheme( );
  const styles = themedStyles( theme );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={( { pressed } ) => [
        styles.button,
        primary ? styles.primaryButton : styles.secondaryButton,
        pressed && styles.iconButtonPressed,
        ( disabled || loading ) && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? theme.colors.inverseText : theme.colors.primary} />
      ) : (
        <Text style={[primary ? styles.primaryButtonText : styles.secondaryButtonText, textStyle]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const PrimaryButton = ( props: ButtonProps ) => <AppButton {...props} primary />;

const SecondaryButton = ( props: ButtonProps ) => <AppButton {...props} primary={false} />;

const SurfaceCard = ( {
  children,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: SurfaceCardProps ) => {
  const { theme } = useTheme( );
  const styles = themedStyles( theme );

  if ( !onPress ) {
    return <View testID={testID} style={[styles.card, style]}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      style={( { pressed } ) => [styles.card, pressed && styles.cardPressed, style]}
    >
      {children}
    </Pressable>
  );
};

const ListRow = ( {
  label,
  detail,
  icon,
  onPress,
  accessibilityLabel,
  testID,
}: ListRowProps ) => {
  const { theme } = useTheme( );
  const styles = themedStyles( theme );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      style={( { pressed } ) => [styles.row, pressed && styles.iconButtonPressed]}
    >
      {icon && (
        <View style={styles.rowIcon}>
          <AppIcon icon={icon} color={theme.colors.primary} />
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      </View>
      <AppIcon icon={ChevronRightIcon} color={theme.colors.muted} />
    </Pressable>
  );
};

const SectionHeading = ( { children }: React.PropsWithChildren ) => {
  const { theme } = useTheme( );
  const styles = themedStyles( theme );

  return <Text style={styles.sectionHeading}>{children}</Text>;
};

const EmptyState = ( { title, text }: { title: string; text?: string } ) => {
  const { theme } = useTheme( );
  const styles = themedStyles( theme );

  return (
    <View style={styles.emptyState}>
      <Text accessibilityRole="header" style={styles.emptyStateTitle}>{title}</Text>
      {text && <Text style={styles.emptyStateText}>{text}</Text>}
    </View>
  );
};

export {
  AppHeader,
  AppIcon,
  AppScreen,
  EmptyState,
  IconButton,
  ListRow,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
  SurfaceCard,
};
