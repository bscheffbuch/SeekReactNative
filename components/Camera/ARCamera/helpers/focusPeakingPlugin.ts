import {
  VisionCameraProxy,
} from "react-native-vision-camera";
import type { Frame } from "react-native-vision-camera";

import type { PeakingPoint } from "../FocusPeakingOverlay";

type FocusPeakingOptions = Record<string, number>;

const focusPeakingPlugin = VisionCameraProxy.initFrameProcessorPlugin(
  "inatFocusPeaking",
  {}
);

export const getFocusPeakingPoints = (
  frame: Frame,
  options: FocusPeakingOptions
): PeakingPoint[] => {
  "worklet";

  if ( focusPeakingPlugin == null ) {
    return [];
  }

  return focusPeakingPlugin.call( frame, options ) as unknown as PeakingPoint[];
};
