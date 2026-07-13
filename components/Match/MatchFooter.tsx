import * as React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../../i18n";
import { CameraIcon, FlagIcon, MenuIcon } from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  readonly openFlagModal: () => void;
  readonly setNavigationPath: ( path: string ) => void;
}

const MatchFooter = ( { openFlagModal, setNavigationPath }: Props ) => {
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
  } );

  return (
    <SafeAreaView style={styles.safeArea} edges={["right", "bottom", "left"]}>
      <View style={styles.container}>
        <View style={styles.navbar}>
          <TouchableOpacity
            accessibilityLabel={i18n.t( "accessibility.menu" )}
            accessible
            onPress={() => setNavigationPath( "Drawer" )}
            style={styles.iconButton}
          >
            <MenuIcon color={theme.colors.text} size={25} strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={i18n.t( "accessibility.camera" )}
            accessible
            onPress={() => setNavigationPath( "Camera" )}
            style={styles.cameraButton}
          >
            <CameraIcon color={theme.colors.inverseText} size={27} strokeWidth={2.25} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={i18n.t( "accessibility.flag" )}
            accessible
            onPress={() => openFlagModal()}
            style={styles.iconButton}
          >
            <FlagIcon color={theme.colors.text} size={25} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MatchFooter;
