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

export interface BackCameraZoomPreset {
  label: string;
  lens: BackCameraLens;
  zoom: number;
}

export type BackCameraLens = PhysicalCameraDeviceType;

export const DEFAULT_BACK_CAMERA_LENS: BackCameraLens = "wide-angle-camera";
export const DEFAULT_BACK_CAMERA_ZOOM = 1;
const TELEPHOTO_BACK_CAMERA_ZOOM = 2;

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
const SAMSUNG_OPTIMIZED_BACK_CAMERA_IDS = new Set( ["20"] );

const fallbackLens = BACK_CAMERA_LENS_OPTIONS.find(
  lensOption => lensOption.id === DEFAULT_BACK_CAMERA_LENS
) || BACK_CAMERA_LENS_OPTIONS[0];

const deviceSupportsLens = (
  cameraDevice: CameraDevice,
  lensOption: BackCameraLensOption
) => cameraDevice.position === "back" && cameraDevice.physicalDevices.includes( lensOption.id );

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
  preferredLens: BackCameraLens
): number => {
  const leftOptimizedRank = SAMSUNG_OPTIMIZED_BACK_CAMERA_IDS.has( leftDevice.id ) ? 1 : 0;
  const rightOptimizedRank = SAMSUNG_OPTIMIZED_BACK_CAMERA_IDS.has( rightDevice.id ) ? 1 : 0;
  if ( leftOptimizedRank !== rightOptimizedRank ) {
    return rightOptimizedRank - leftOptimizedRank;
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

export const getBackCameraLensZoom = (
  cameraDevice: CameraDevice,
  lens: BackCameraLens
): number => {
  if ( cameraDevice.physicalDevices.length === 1 && cameraDevice.physicalDevices[0] === lens ) {
    return cameraDevice.neutralZoom;
  }

  if ( lens === "ultra-wide-angle-camera" ) {
    return clampZoom( cameraDevice, cameraDevice.minZoom );
  }

  if ( lens === "telephoto-camera" ) {
    return clampZoom( cameraDevice, cameraDevice.neutralZoom * 2 );
  }

  return clampZoom( cameraDevice, cameraDevice.neutralZoom );
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
  zoom: number
): CameraDevice | undefined => {
  const preferredLens = getBackCameraLensForZoom( zoom );
  const backCameraDevices = cameraDevices.filter( isBackCamera );

  return backCameraDevices
    .filter( cameraDevice => deviceCanSelectZoomPreset( cameraDevice, zoom ) )
    .sort( ( leftDevice, rightDevice ) => (
      compareBackCameraCandidates( leftDevice, rightDevice, preferredLens )
    ) )[0]
    || backCameraDevices
      .sort( ( leftDevice, rightDevice ) => (
        compareBackCameraCandidates( leftDevice, rightDevice, DEFAULT_BACK_CAMERA_LENS )
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
