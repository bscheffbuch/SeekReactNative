import type {
  CameraDevice,
  CameraDeviceFormat,
  PhysicalCameraDeviceType,
  VideoStabilizationMode,
} from "react-native-vision-camera";

interface BackCameraLensOption {
  id: PhysicalCameraDeviceType;
  label: string;
  physicalDevices: [PhysicalCameraDeviceType];
}

export type BackCameraLens = PhysicalCameraDeviceType;

export const DEFAULT_BACK_CAMERA_LENS: BackCameraLens = "wide-angle-camera";

export const BACK_CAMERA_LENS_OPTIONS: BackCameraLensOption[] = [
  {
    id: "ultra-wide-angle-camera",
    label: "0.5x",
    physicalDevices: ["ultra-wide-angle-camera"],
  },
  {
    id: "wide-angle-camera",
    label: "1x",
    physicalDevices: ["wide-angle-camera"],
  },
  {
    id: "telephoto-camera",
    label: "2x",
    physicalDevices: ["telephoto-camera"],
  },
];

const STABILIZATION_PRIORITY: VideoStabilizationMode[] = [
  "standard",
  "cinematic",
  "cinematic-extended",
];

const fallbackLens = BACK_CAMERA_LENS_OPTIONS.find(
  lensOption => lensOption.id === DEFAULT_BACK_CAMERA_LENS
) || BACK_CAMERA_LENS_OPTIONS[0];

const deviceSupportsLens = (
  cameraDevice: CameraDevice,
  lensOption: BackCameraLensOption
) => cameraDevice.position === "back" && cameraDevice.physicalDevices.includes( lensOption.id );

export const getAvailableBackCameraLenses = (
  cameraDevices: CameraDevice[]
): BackCameraLensOption[] => {
  const availableLenses = BACK_CAMERA_LENS_OPTIONS.filter( lensOption => (
    cameraDevices.some( cameraDevice => deviceSupportsLens( cameraDevice, lensOption ) )
  ) );

  return availableLenses.length > 0
    ? availableLenses
    : [fallbackLens];
};

export const getBackCameraLensLabel = ( lens: BackCameraLens ): string => (
  BACK_CAMERA_LENS_OPTIONS.find( lensOption => lensOption.id === lens )?.label
  || fallbackLens.label
);

export const getNextBackCameraLens = (
  currentLens: BackCameraLens,
  availableLenses: BackCameraLensOption[]
): BackCameraLens => {
  if ( availableLenses.length < 2 ) {
    return currentLens;
  }

  const currentIndex = availableLenses.findIndex( lensOption => lensOption.id === currentLens );
  const nextIndex = currentIndex < 0
    ? 0
    : ( currentIndex + 1 ) % availableLenses.length;

  return availableLenses[nextIndex].id;
};

export const getPreferredVideoStabilizationModeForDevice = (
  cameraDevice?: CameraDevice
): VideoStabilizationMode | undefined => {
  if ( !cameraDevice ) {
    return undefined;
  }

  return STABILIZATION_PRIORITY.find( stabilizationMode => (
    cameraDevice.formats.some( format => format.videoStabilizationModes.includes( stabilizationMode ) )
  ) );
};

export const getPreferredVideoStabilizationMode = (
  format?: CameraDeviceFormat
): VideoStabilizationMode | undefined => {
  if ( !format ) {
    return undefined;
  }

  return STABILIZATION_PRIORITY.find( stabilizationMode => (
    format.videoStabilizationModes.includes( stabilizationMode )
  ) );
};