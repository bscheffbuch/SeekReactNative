import React from "react";
import type { TakePhotoOptions } from "react-native-vision-camera";

import i18n from "../../../i18n";
import icons from "../../../assets/icons";
import TransparentCircleButton from "../../UIComponents/Buttons/TransparentCircleButton";

interface Props {
  toggleFlash: ( ) => void;
  hasFlash?: boolean;
  hasTorch?: boolean;
  torch: "off" | "on";
  takePhotoOptions: TakePhotoOptions;
}

const Flash = ( {
  toggleFlash,
  hasFlash,
  hasTorch,
  torch,
  takePhotoOptions,
}: Props ) => {
  if ( !hasFlash && !hasTorch ) return null;
  let testID = "";
  let accessibilityHint = "";
  let source;
  const flashEnabled = hasTorch
    ? torch === "on"
    : takePhotoOptions.flash === "on";
  if ( flashEnabled ) {
    source = icons.flash_on;
    testID = "flash-button-label-flash";
    accessibilityHint = i18n.t( "accessibility.disable_flash" );
  } else {
    source = icons.flash_off;
    testID = "flash-button-label-flash-off";
    accessibilityHint = i18n.t( "accessibility.enable_flash" );
  }

  return (
    <TransparentCircleButton
      onPress={toggleFlash}
      testID={testID}
      accessibilityLabel={i18n.t( "accessibility.flash" )}
      accessibilityHint={accessibilityHint}
      source={source}
    />
  );
};

export default Flash;
