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

  it( "prefers Samsung's optimized logical back camera on Samsung devices", () => {
    const defaultLogicalCamera = buildBackCamera( { id: "0", maxZoom: 10 } );
    const samsungOptimizedCamera = buildBackCamera( {
      id: "20",
      maxZoom: 10,
      physicalDevices: ["wide-angle-camera", "telephoto-camera"],
    } );

    expect(
      getBackCameraDeviceForZoom( [defaultLogicalCamera, samsungOptimizedCamera], 1, true )
    ).toBe( samsungOptimizedCamera );
  } );

  it( "does not rank camera id 20 first on non-Samsung devices", () => {
    // on other manufacturers ids beyond 0/1 are vendor-specific (macro/depth/IR)
    const defaultLogicalCamera = buildBackCamera( {
      id: "0",
      maxZoom: 10,
      physicalDevices: ["wide-angle-camera", "telephoto-camera"],
    } );
    const vendorSpecificCamera = buildBackCamera( { id: "20", maxZoom: 10 } );

    expect(
      getBackCameraDeviceForZoom( [vendorSpecificCamera, defaultLogicalCamera], 1, false )
    ).toBe( defaultLogicalCamera );
    expect(
      getBackCameraDeviceForZoom( [vendorSpecificCamera, defaultLogicalCamera], 1 )
    ).toBe( defaultLogicalCamera );
  } );

  it( "prefers standard digital stabilization over preview-only cinematic modes", () => {
    expect( getPreferredVideoStabilizationMode( {
      videoStabilizationModes: ["cinematic-extended", "cinematic", "standard"],
    } ) ).toBe( "standard" );
  } );
} );
