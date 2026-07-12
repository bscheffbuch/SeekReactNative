import React from "react";
import { Pressable, Text, View } from "react-native";

import { viewStyles, textStyles } from "../../../styles/camera/cameraControls";
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
  <View style={viewStyles.zoomPresetsContainer} testID="camera-zoom-presets">
    {presets.map( preset => {
      const selected = zoomMatches( preset.zoom, selectedZoom );
      return (
        <Pressable
          accessibilityLabel={preset.label}
          accessibilityRole="button"
          key={preset.label}
          onPress={() => selectZoom( preset.zoom )}
          style={( { pressed } ) => [
            viewStyles.zoomPresetButton,
            selected && viewStyles.zoomPresetButtonSelected,
            { opacity: pressed ? 0.5 : 1 },
          ]}
          testID={`camera-zoom-${preset.label}`}
        >
          <Text
            maxFontSizeMultiplier={1.2}
            style={[textStyles.zoomPresetLabel, selected && textStyles.zoomPresetLabelSelected]}
          >
            {preset.label}
          </Text>
        </Pressable>
      );
    } )}
  </View>
);

export default CameraZoomPresets;
