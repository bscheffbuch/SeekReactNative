import {
  BUILT_IN_PACK_ID,
  builtInPack,
  choosePack,
  parseManifest,
} from "../../../utility/modelPacks";

const DIR = "/data/models/bioclip2";
const valid = {
  id: "bioclip2-100k",
  name: "BioCLIP 2",
  version: "2.13",
  revision: "2026-11-02",
  taxa: 100000,
  files: {
    model: "model.tflite",
    taxonomy: "taxonomy.csv",
    geomodel: "geomodel.tflite",
    common_names: "common_names.json",
  },
};

describe( "parseManifest", () => {
  it( "builds a pack with absolute paths inside the pack folder", () => {
    const { pack, error } = parseManifest( valid, DIR );
    expect( error ).toBeNull();
    expect( pack ).toEqual( {
      id: "bioclip2-100k",
      name: "BioCLIP 2",
      version: "2.13",
      revision: "2026-11-02",
      modelPath: `${DIR}/model.tflite`,
      taxonomyPath: `${DIR}/taxonomy.csv`,
      geomodelPath: `${DIR}/geomodel.tflite`,
      commonNamesPath: `${DIR}/common_names.json`,
      taxa: 100000,
      builtIn: false,
    } );
  } );

  it( "treats geomodel and common names as optional", () => {
    const { pack } = parseManifest( { ...valid, files: { model: "m.tflite", taxonomy: "t.csv" } }, DIR );
    expect( pack.geomodelPath ).toBeNull();
    expect( pack.commonNamesPath ).toBeNull();
  } );

  it( "rejects file names that could escape the pack folder", () => {
    for ( const model of ["../model.tflite", "/sdcard/model.tflite", "sub/model.tflite", ".hidden"] ) {
      const { pack, error } = parseManifest( { ...valid, files: { ...valid.files, model } }, DIR );
      expect( pack ).toBeNull();
      expect( error ).toMatch( /files\.model/ );
    }
  } );

  it( "rejects a missing or malformed id, and the reserved built-in id", () => {
    expect( parseManifest( { ...valid, id: undefined }, DIR ).pack ).toBeNull();
    expect( parseManifest( { ...valid, id: "Has Spaces" }, DIR ).pack ).toBeNull();
    expect( parseManifest( { ...valid, id: BUILT_IN_PACK_ID }, DIR ).error ).toMatch( /reserved/ );
  } );

  it( "requires a name and version", () => {
    expect( parseManifest( { ...valid, name: " " }, DIR ).pack ).toBeNull();
    expect( parseManifest( { ...valid, version: "" }, DIR ).pack ).toBeNull();
  } );

  it( "rejects a pack built for another platform", () => {
    expect( parseManifest( { ...valid, platform: "not-this-one" }, DIR ).error ).toMatch( /pack is for/ );
  } );

  it( "rejects non-objects", () => {
    expect( parseManifest( null, DIR ).pack ).toBeNull();
    expect( parseManifest( "nope", DIR ).pack ).toBeNull();
  } );
} );

describe( "choosePack", () => {
  const builtIn = builtInPack();
  const installed = parseManifest( valid, DIR ).pack;

  it( "returns the selected pack when it is installed", () => {
    expect( choosePack( [builtIn, installed], "bioclip2-100k" ) ).toBe( installed );
  } );

  it( "falls back to the built-in pack when the selection is missing", () => {
    expect( choosePack( [builtIn], "bioclip2-100k" ) ).toBe( builtIn );
    expect( choosePack( [builtIn, installed], null ) ).toBe( builtIn );
  } );
} );
