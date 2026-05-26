import {
  getBackCameraDeviceForZoom,
  getBackCameraZoomPresets,
  getBackCameraZoomValue,
  getPreferredVideoStabilizationMode,
} from "../../../../../components/Camera/ARCamera/helpers/cameraDeviceHelpers";

const buildBackCamera = overrides => ( {
  formats: [],
  maxZoom: 10,
  minZoom: 1,
  neutralZoom: 1,
  physicalDevices: ["wide-angle-camera"],
  position: "back",
  ...overrides,
} );

describe( "cameraDeviceHelpers", () => {
  it( "keeps expected lens presets available on a multi-camera rear device", () => {
    const presets = getBackCameraZoomPresets( [
      buildBackCamera( {
        maxZoom: 12,
        physicalDevices: ["ultra-wide-angle-camera", "wide-angle-camera", "telephoto-camera"],
      } ),
    ] );

    expect( presets.map( preset => preset.label ) ).toEqual( [
      "0.5x",
      "1x",
      "2x",
      "3x",
      "5x",
      "10x",
    ] );
  } );

  it( "selects the matching physical lens device for telephoto presets", () => {
    const wideCamera = buildBackCamera( { id: "wide", maxZoom: 3 } );
    const telephotoCamera = buildBackCamera( {
      id: "telephoto",
      maxZoom: 6,
      physicalDevices: ["telephoto-camera"],
    } );

    expect( getBackCameraDeviceForZoom( [wideCamera, telephotoCamera], 2 ) ).toBe( telephotoCamera );
    expect( getBackCameraZoomValue( telephotoCamera, 2 ) ).toBe( telephotoCamera.neutralZoom );
  } );

  it( "prefers Samsung's optimized logical back camera when it is exposed", () => {
    const defaultLogicalCamera = buildBackCamera( { id: "0", maxZoom: 10 } );
    const samsungOptimizedCamera = buildBackCamera( {
      id: "20",
      maxZoom: 10,
      physicalDevices: ["wide-angle-camera", "telephoto-camera"],
    } );

    expect( getBackCameraDeviceForZoom( [defaultLogicalCamera, samsungOptimizedCamera], 1 ) ).toBe(
      samsungOptimizedCamera
    );
  } );

  it( "prefers standard digital stabilization over preview-only cinematic modes", () => {
    expect( getPreferredVideoStabilizationMode( {
      videoStabilizationModes: ["cinematic-extended", "cinematic", "standard"],
    } ) ).toBe( "standard" );
  } );
} );
