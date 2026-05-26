import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import i18n from "../../../i18n";
import { colors } from "../../../styles/global";
import viewStyles from "../../../styles/uiComponents/buttons/transparentCircleButton";

interface Props {
  focusPeakingEnabled: boolean;
  toggleFocusPeaking: ( ) => void;
}

const FocusPeakingToggle = ( {
  focusPeakingEnabled,
  toggleFocusPeaking,
}: Props ) => (
  <Pressable
    accessibilityHint={i18n.t(
      focusPeakingEnabled
        ? "accessibility.disable_focus_peaking"
        : "accessibility.enable_focus_peaking"
    )}
    accessibilityLabel={i18n.t( "accessibility.focus_peaking" )}
    accessibilityRole="button"
    onPress={toggleFocusPeaking}
    style={( { pressed } ) => [
      viewStyles.wrapperStyle,
      focusPeakingEnabled && styles.enabled,
      { opacity: pressed ? 0.5 : 1 },
    ]}
    testID="focus-peaking-toggle"
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={[styles.label, focusPeakingEnabled && styles.enabledLabel]}
    >
      PEAK
    </Text>
  </Pressable>
);

const styles = StyleSheet.create( {
  enabled: {
    backgroundColor: colors.white,
  },
  label: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  enabledLabel: {
    color: colors.seekForestGreen,
  },
} );

export default FocusPeakingToggle;
