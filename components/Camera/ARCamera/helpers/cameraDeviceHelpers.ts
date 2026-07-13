import type {
  CameraDevice,
  CameraDeviceFormat,
  PhysicalCameraDeviceType,
  VideoStabilizationMode,
} from "react-native-vision-camera";

export interface BackCameraZoomPreset {
  label: string;
  lens: BackCameraLens;
  zoom: number;
}

export type BackCameraLens = PhysicalCameraDeviceType;

export const DEFAULT_BACK_CAMERA_LENS: BackCameraLens = "wide-angle-camera";
export const DEFAULT_BACK_CAMERA_ZOOM = 1;
const TELEPHOTO_BACK_CAMERA_ZOOM = 2;

const BACK_CAMERA_ZOOM_PRESET_VALUES = [
  0.5,
  DEFAULT_BACK_CAMERA_ZOOM,
  TELEPHOTO_BACK_CAMERA_ZOOM,
  3,
  5,
  10,
];

const STABILIZATION_PRIORITY: VideoStabilizationMode[] = [
  "standard",
  "cinematic",
  "cinematic-extended",
];
// Samsung exposes an additional optimized logical back camera under id "20" on
// many devices. Ids beyond "0"/"1" are vendor-specific (macro/depth/IR sensors
// on other manufacturers), so this ranking must only apply on Samsung devices.
const SAMSUNG_OPTIMIZED_BACK_CAMERA_IDS = new Set( ["20"] );

const normalizeZoom = ( zoom: number ): number => Number( zoom.toFixed( 1 ) );

const zoomIsInDeviceRange = ( cameraDevice: CameraDevice, zoom: number ): boolean => (
  zoom >= normalizeZoom( cameraDevice.minZoom ) && zoom <= normalizeZoom( cameraDevice.maxZoom )
);

const clampZoom = ( cameraDevice: CameraDevice, zoom: number ): number => (
  Math.min( Math.max( zoom, cameraDevice.minZoom ), cameraDevice.maxZoom )
);

const formatZoomLabel = ( zoom: number ): string => (
  Number.isInteger( zoom )
    ? `${zoom}x`
    : `${zoom.toFixed( 1 )}x`
);

const getLensBaseZoom = ( lens: BackCameraLens ): number => {
  if ( lens === "ultra-wide-angle-camera" ) {
    return 0.5;
  }

  if ( lens === "telephoto-camera" ) {
    return TELEPHOTO_BACK_CAMERA_ZOOM;
  }

  return DEFAULT_BACK_CAMERA_ZOOM;
};

export const getBackCameraLensForZoom = ( zoom: number ): BackCameraLens => {
  if ( zoom < DEFAULT_BACK_CAMERA_ZOOM ) {
    return "ultra-wide-angle-camera";
  }

  if ( zoom >= TELEPHOTO_BACK_CAMERA_ZOOM ) {
    return "telephoto-camera";
  }

  return DEFAULT_BACK_CAMERA_LENS;
};

const isBackCamera = ( cameraDevice: CameraDevice ) => cameraDevice.position === "back";

const deviceIncludesLens = ( cameraDevice: CameraDevice, lens: BackCameraLens ): boolean => (
  isBackCamera( cameraDevice ) && cameraDevice.physicalDevices.includes( lens )
);

const deviceCanSelectZoomPreset = ( cameraDevice: CameraDevice, zoom: number ): boolean => {
  if ( !isBackCamera( cameraDevice ) ) {
    return false;
  }

  if ( zoomIsInDeviceRange( cameraDevice, zoom ) ) {
    return true;
  }

  return deviceIncludesLens( cameraDevice, getBackCameraLensForZoom( zoom ) );
};

const compareBackCameraCandidates = (
  leftDevice: CameraDevice,
  rightDevice: CameraDevice,
  preferredLens: BackCameraLens,
  isSamsungDevice: boolean
): number => {
  if ( isSamsungDevice ) {
    const leftOptimizedRank = SAMSUNG_OPTIMIZED_BACK_CAMERA_IDS.has( leftDevice.id ) ? 1 : 0;
    const rightOptimizedRank = SAMSUNG_OPTIMIZED_BACK_CAMERA_IDS.has( rightDevice.id ) ? 1 : 0;
    if ( leftOptimizedRank !== rightOptimizedRank ) {
      return rightOptimizedRank - leftOptimizedRank;
    }
  }

  const leftIncludesPreferredLens = deviceIncludesLens( leftDevice, preferredLens ) ? 1 : 0;
  const rightIncludesPreferredLens = deviceIncludesLens( rightDevice, preferredLens ) ? 1 : 0;
  if ( leftIncludesPreferredLens !== rightIncludesPreferredLens ) {
    return rightIncludesPreferredLens - leftIncludesPreferredLens;
  }

  const leftLensCount = leftDevice.physicalDevices.length;
  const rightLensCount = rightDevice.physicalDevices.length;
  if ( leftLensCount !== rightLensCount ) {
    return rightLensCount - leftLensCount;
  }

  const leftZoomRange = leftDevice.maxZoom - leftDevice.minZoom;
  const rightZoomRange = rightDevice.maxZoom - rightDevice.minZoom;
  return rightZoomRange - leftZoomRange;
};

export const getBackCameraZoomPresets = (
  cameraDevices: CameraDevice[]
): BackCameraZoomPreset[] => {
  const backCameraDevices = cameraDevices.filter( isBackCamera );
  if ( backCameraDevices.length === 0 ) {
    return [{ label: "1x", lens: DEFAULT_BACK_CAMERA_LENS, zoom: DEFAULT_BACK_CAMERA_ZOOM }];
  }

  const zooms = BACK_CAMERA_ZOOM_PRESET_VALUES.filter( zoom => (
    backCameraDevices.some( cameraDevice => deviceCanSelectZoomPreset( cameraDevice, zoom ) )
  ) );

  if ( zooms.length === 0 ) {
    return [{ label: "1x", lens: DEFAULT_BACK_CAMERA_LENS, zoom: DEFAULT_BACK_CAMERA_ZOOM }];
  }

  return zooms.map( zoom => ( {
    label: formatZoomLabel( zoom ),
    lens: getBackCameraLensForZoom( zoom ),
    zoom,
  } ) );
};

export const getBackCameraDeviceForZoom = (
  cameraDevices: CameraDevice[],
  zoom: number,
  isSamsungDevice: boolean = false
): CameraDevice | undefined => {
  const preferredLens = getBackCameraLensForZoom( zoom );
  const backCameraDevices = cameraDevices.filter( isBackCamera );

  return backCameraDevices
    .filter( cameraDevice => deviceCanSelectZoomPreset( cameraDevice, zoom ) )
    .sort( ( leftDevice, rightDevice ) => (
      compareBackCameraCandidates( leftDevice, rightDevice, preferredLens, isSamsungDevice )
    ) )[0]
    || backCameraDevices
      .sort( ( leftDevice, rightDevice ) => (
        compareBackCameraCandidates( leftDevice, rightDevice, DEFAULT_BACK_CAMERA_LENS, isSamsungDevice )
      ) )[0];
};

export const getBackCameraZoomValue = (
  cameraDevice: CameraDevice,
  zoom: number
): number => {
  if ( zoomIsInDeviceRange( cameraDevice, zoom ) ) {
    if ( cameraDevice.physicalDevices.length !== 1 ) {
      return clampZoom( cameraDevice, zoom );
    }
  }

  if ( cameraDevice.physicalDevices.length === 1 ) {
    const [lens] = cameraDevice.physicalDevices as BackCameraLens[];
    const lensBaseZoom = getLensBaseZoom( lens );
    return clampZoom( cameraDevice, cameraDevice.neutralZoom * ( zoom / lensBaseZoom ) );
  }

  return clampZoom( cameraDevice, zoom );
};

// On iOS multi-cam devices the zoom factor space starts at the widest lens
// (factor 1 = ultra-wide), so presets map relative to the device's neutral
// zoom: preset 1x -> neutralZoom, preset 2x -> neutralZoom * 2, etc.
export const getNeutralRelativeBackCameraZoomValue = (
  cameraDevice: CameraDevice,
  zoom: number
): number => clampZoom( cameraDevice, cameraDevice.neutralZoom * zoom );

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
