import React from "react";
import { Pressable, Text } from "react-native";

import i18n from "../../../i18n";
import viewStyles from "../../../styles/uiComponents/buttons/transparentCircleButton";
import {
  viewStyles as controlViewStyles,
  textStyles as controlTextStyles,
} from "../../../styles/camera/cameraControls";

interface Props {
  photoHdrEnabled: boolean;
  togglePhotoHdr: ( ) => void;
}

const HdrToggle = ( {
  photoHdrEnabled,
  togglePhotoHdr,
}: Props ) => (
  <Pressable
    accessibilityHint={i18n.t(
      photoHdrEnabled
        ? "accessibility.disable_hdr"
        : "accessibility.enable_hdr"
    )}
    accessibilityLabel={i18n.t( "accessibility.hdr" )}
    accessibilityRole="button"
    onPress={togglePhotoHdr}
    style={( { pressed } ) => [
      viewStyles.wrapperStyle,
      photoHdrEnabled && controlViewStyles.enabledToggle,
      { opacity: pressed ? 0.5 : 1 },
    ]}
    testID="hdr-toggle"
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={[controlTextStyles.hdrToggleLabel, photoHdrEnabled && controlTextStyles.enabledToggleLabel]}
    >
      HDR
    </Text>
  </Pressable>
);

export default HdrToggle;
