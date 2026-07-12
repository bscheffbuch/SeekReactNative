import React from "react";
import { Pressable, Text } from "react-native";

import i18n from "../../../i18n";
import viewStyles from "../../../styles/uiComponents/buttons/transparentCircleButton";
import {
  viewStyles as controlViewStyles,
  textStyles as controlTextStyles,
} from "../../../styles/camera/cameraControls";

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
      focusPeakingEnabled && controlViewStyles.enabledToggle,
      { opacity: pressed ? 0.5 : 1 },
    ]}
    testID="focus-peaking-toggle"
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={[controlTextStyles.peakingToggleLabel, focusPeakingEnabled && controlTextStyles.enabledToggleLabel]}
    >
      PEAK
    </Text>
  </Pressable>
);

export default FocusPeakingToggle;
