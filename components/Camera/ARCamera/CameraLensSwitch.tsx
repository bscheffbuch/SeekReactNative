import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import i18n from "../../../i18n";
import { colors } from "../../../styles/global";
import viewStyles from "../../../styles/uiComponents/buttons/transparentCircleButton";

interface Props {
  lensLabel: string;
  switchLens: ( ) => void;
}

const CameraLensSwitch = ( {
  lensLabel,
  switchLens,
}: Props ) => (
  <Pressable
    accessibilityHint={i18n.t( "accessibility.use_next_lens" )}
    accessibilityLabel={`${i18n.t( "accessibility.switch_lens" )} ${lensLabel}`}
    accessibilityRole="button"
    onPress={switchLens}
    style={( { pressed } ) => [
      viewStyles.wrapperStyle,
      { opacity: pressed ? 0.5 : 1 },
    ]}
    testID="camera-lens-switch"
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={styles.lensLabel}
    >
      {lensLabel}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create( {
  lensLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
} );

export default CameraLensSwitch;