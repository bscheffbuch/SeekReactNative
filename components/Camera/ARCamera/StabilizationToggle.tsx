import React from "react";
import { Pressable, Text } from "react-native";

import i18n from "../../../i18n";
import viewStyles from "../../../styles/uiComponents/buttons/transparentCircleButton";
import {
  viewStyles as controlViewStyles,
  textStyles as controlTextStyles,
} from "../../../styles/camera/cameraControls";

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
      digitalStabilizationEnabled && controlViewStyles.enabledToggle,
      { opacity: pressed ? 0.5 : 1 },
    ]}
    testID="digital-stabilization-toggle"
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={[controlTextStyles.stabilizationToggleLabel, digitalStabilizationEnabled && controlTextStyles.enabledToggleLabel]}
    >
      DIS
    </Text>
  </Pressable>
);

export default StabilizationToggle;
