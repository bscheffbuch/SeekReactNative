import React from "react";
import { Pressable, Text } from "react-native";

import i18n from "../../../i18n";
import viewStyles from "../../../styles/uiComponents/buttons/transparentCircleButton";
import {
  viewStyles as controlViewStyles,
  textStyles as controlTextStyles,
} from "../../../styles/camera/cameraControls";

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
      manualFocusEnabled && controlViewStyles.enabledToggle,
      { opacity: pressed ? 0.5 : 1 },
    ]}
    testID="focus-mode-switch"
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={[controlTextStyles.focusModeLabel, manualFocusEnabled && controlTextStyles.enabledToggleLabel]}
    >
      {manualFocusEnabled ? "MF" : "AF"}
    </Text>
  </Pressable>
);

export default FocusModeSwitch;
