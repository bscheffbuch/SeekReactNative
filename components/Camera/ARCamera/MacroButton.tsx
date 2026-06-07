import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import i18n from "../../../i18n";
import { colors } from "../../../styles/global";
import viewStyles from "../../../styles/uiComponents/buttons/transparentCircleButton";

interface Props {
  macroEnabled: boolean;
  toggleMacro: ( ) => void;
}

const MacroButton = ( {
  macroEnabled,
  toggleMacro,
}: Props ) => (
  <Pressable
    accessibilityHint={i18n.t(
      macroEnabled
        ? "accessibility.disable_macro"
        : "accessibility.enable_macro"
    )}
    accessibilityLabel={i18n.t( "accessibility.macro_mode" )}
    accessibilityRole="button"
    accessibilityState={{ selected: macroEnabled }}
    onPress={toggleMacro}
    style={( { pressed } ) => [
      viewStyles.wrapperStyle,
      macroEnabled && styles.enabled,
      { opacity: pressed ? 0.5 : 1 },
    ]}
    testID="macro-button"
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={[styles.label, macroEnabled && styles.enabledLabel]}
    >
      MACRO
    </Text>
  </Pressable>
);

const styles = StyleSheet.create( {
  enabled: {
    backgroundColor: colors.seekGold,
  },
  label: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  enabledLabel: {
    color: colors.seekInk,
  },
} );

export default MacroButton;
