import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../../styles/global";
import type { BackCameraZoomPreset } from "./helpers/cameraDeviceHelpers";

interface Props {
  presets: BackCameraZoomPreset[];
  selectedZoom: number;
  selectZoom: ( zoom: number ) => void;
}

const zoomMatches = ( leftZoom: number, rightZoom: number ): boolean => (
  Math.abs( leftZoom - rightZoom ) < 0.05
);

const CameraZoomPresets = ( {
  presets,
  selectedZoom,
  selectZoom,
}: Props ) => (
  <View style={styles.container} testID="camera-zoom-presets">
    {presets.map( preset => {
      const selected = zoomMatches( preset.zoom, selectedZoom );
      return (
        <Pressable
          accessibilityLabel={preset.label}
          accessibilityRole="button"
          key={preset.label}
          onPress={() => selectZoom( preset.zoom )}
          style={( { pressed } ) => [
            styles.presetButton,
            selected && styles.selectedButton,
            { opacity: pressed ? 0.5 : 1 },
          ]}
          testID={`camera-zoom-${preset.label}`}
        >
          <Text
            maxFontSizeMultiplier={1.2}
            style={[styles.presetLabel, selected && styles.selectedLabel]}
          >
            {preset.label}
          </Text>
        </Pressable>
      );
    } )}
  </View>
);

const styles = StyleSheet.create( {
  container: {
    alignItems: "center",
    backgroundColor: "rgba(10, 14, 11, 0.58)",
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderRadius: 24,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  presetButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    minWidth: 36,
    paddingHorizontal: 6,
  },
  selectedButton: {
    backgroundColor: colors.seekGold,
  },
  presetLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  selectedLabel: {
    color: colors.seekInk,
  },
} );

export default CameraZoomPresets;
