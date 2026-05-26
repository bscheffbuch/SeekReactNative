import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import i18n from "../../../i18n";
import { colors } from "../../../styles/global";
import viewStyles from "../../../styles/uiComponents/buttons/transparentCircleButton";

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
      photoHdrEnabled && styles.enabled,
      { opacity: pressed ? 0.5 : 1 },
    ]}
    testID="hdr-toggle"
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={[styles.hdrLabel, photoHdrEnabled && styles.enabledLabel]}
    >
      HDR
    </Text>
  </Pressable>
);

const styles = StyleSheet.create( {
  enabled: {
    backgroundColor: colors.white,
  },
  hdrLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  enabledLabel: {
    color: colors.seekForestGreen,
  },
} );

export default HdrToggle;
