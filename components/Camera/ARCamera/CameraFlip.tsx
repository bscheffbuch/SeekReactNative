import React from "react";
import { TouchableOpacity } from "react-native";

import i18n from "../../../i18n";
import { viewStyles } from "../../../styles/camera/arCameraOverlay";
import { colors } from "../../../styles/global";
import { RotateCameraIcon } from "../../UIComponents/AppIcons";

interface Props {
  flipCamera: ( ) => void;
}

const CameraFlip = ( {
  flipCamera,
}: Props ) => {
  return (
    <TouchableOpacity
      onPress={flipCamera}
      accessibilityLabel={i18n.t( "accessibility.flip_camera" )}
      accessibilityHint={i18n.t( "accessibility.use_other_camera" )}
      accessibilityRole="button"
      activeOpacity={0.65}
      style={viewStyles.galleryButton}
    >
      <RotateCameraIcon color={colors.white} size={27} strokeWidth={2.2} />
    </TouchableOpacity>
  );
};

export default CameraFlip;
