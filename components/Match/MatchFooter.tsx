import * as React from "react";
import {
  View,
  Pressable,
  Text,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../../i18n";
import { CameraIcon, FlagIcon } from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  readonly openFlagModal: () => void;
  readonly setNavigationPath: ( path: string ) => void;
}

// M3 bottom action panel: every action within thumb reach. The primary action
// (View species) sits on the right where the right thumb rests.
const MatchFooter = ( { openFlagModal, setNavigationPath }: Props ) => {
  const { theme } = useTheme();
  const styles = StyleSheet.create( {
    safeArea: {
      backgroundColor: theme.colors.surfaceContainer,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    iconButton: {
      alignItems: "center",
      borderRadius: 24,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    outlined: {
      alignItems: "center",
      borderColor: theme.colors.outline,
      borderRadius: 28,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: theme.spacing.sm,
      height: 56,
      justifyContent: "center",
    },
    filled: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 28,
      flex: 1.3,
      height: 56,
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.85,
    },
    outlinedText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.heading,
      fontSize: 15,
    },
    filledText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.heading,
      fontSize: 15,
    },
  } );

  return (
    <SafeAreaView style={styles.safeArea} edges={["right", "bottom", "left"]}>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel={i18n.t( "accessibility.flag" )}
          accessibilityRole="button"
          onPress={() => openFlagModal()}
          style={( { pressed } ) => [styles.iconButton, pressed && styles.pressed]}
        >
          <FlagIcon color={theme.colors.onSurfaceVariant} size={24} strokeWidth={2} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setNavigationPath( "Camera" )}
          style={( { pressed } ) => [styles.outlined, pressed && styles.pressed]}
          testID="backToCamera"
        >
          <CameraIcon color={theme.colors.primary} size={20} strokeWidth={2} />
          <Text style={styles.outlinedText}>{i18n.t( "results.scan_again" )}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setNavigationPath( "Species" )}
          style={( { pressed } ) => [styles.filled, pressed && styles.pressed]}
          testID="viewSpecies"
        >
          <Text style={styles.filledText}>{i18n.t( "results.view_species" )}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default MatchFooter;
