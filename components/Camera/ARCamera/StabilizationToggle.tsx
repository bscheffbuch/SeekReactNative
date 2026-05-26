import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import i18n from "../../../i18n";
import { colors } from "../../../styles/global";
import viewStyles from "../../../styles/uiComponents/buttons/transparentCircleButton";

interface Props {
  digitalStabilizationEnabled: boolean;
  toggleDigitalStabilization: ( ) => void;
}

const StabilizationToggle = ( {
  digitalStabilizationEnabled,
  toggleDigitalStabilization,
}: Props ) => (
  <Pressable
    accessibilityHint={i18n.t(
      digitalStabilizationEnabled
        ? "accessibility.disable_digital_stabilization"
        : "accessibility.enable_digital_stabilization"
    )}
    accessibilityLabel={i18n.t( "accessibility.digital_stabilization" )}
    accessibilityRole="button"
    onPress={toggleDigitalStabilization}
    style={( { pressed } ) => [
      viewStyles.wrapperStyle,
      digitalStabilizationEnabled && styles.enabled,
      { opacity: pressed ? 0.5 : 1 },
    ]}
    testID="digital-stabilization-toggle"
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={[styles.label, digitalStabilizationEnabled && styles.enabledLabel]}
    >
      DIS
    </Text>
  </Pressable>
);

const styles = StyleSheet.create( {
  enabled: {
    backgroundColor: colors.white,
  },
  label: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  enabledLabel: {
    color: colors.seekForestGreen,
  },
} );

export default StabilizationToggle;
