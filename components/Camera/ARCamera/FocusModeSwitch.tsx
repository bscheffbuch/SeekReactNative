import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import i18n from "../../../i18n";
import { colors } from "../../../styles/global";
import viewStyles from "../../../styles/uiComponents/buttons/transparentCircleButton";

interface Props {
  manualFocusEnabled: boolean;
  toggleManualFocus: ( ) => void;
}

const FocusModeSwitch = ( {
  manualFocusEnabled,
  toggleManualFocus,
}: Props ) => (
  <Pressable
    accessibilityHint={i18n.t(
      manualFocusEnabled
        ? "accessibility.use_auto_focus"
        : "accessibility.use_manual_focus"
    )}
    accessibilityLabel={i18n.t( "accessibility.focus_mode" )}
    accessibilityRole="button"
    onPress={toggleManualFocus}
    style={( { pressed } ) => [
      viewStyles.wrapperStyle,
      manualFocusEnabled && styles.enabled,
      { opacity: pressed ? 0.5 : 1 },
    ]}
    testID="focus-mode-switch"
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={[styles.focusLabel, manualFocusEnabled && styles.enabledLabel]}
    >
      {manualFocusEnabled ? "MF" : "AF"}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create( {
  enabled: {
    backgroundColor: colors.white,
  },
  focusLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  enabledLabel: {
    color: colors.seekForestGreen,
  },
} );

export default FocusModeSwitch;
