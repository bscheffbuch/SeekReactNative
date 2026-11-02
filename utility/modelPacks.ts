import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DocumentDirectoryPath,
  ExternalDirectoryPath,
  copyFileAssets,
  exists,
  existsAssets,
  mkdir,
  readDir,
  readDirAssets,
  readFile,
  stat,
} from "@dr.pogodin/react-native-fs";

import { dirModel, dirGeomodel, dirTaxonomy } from "./dirStorage";

/**
 * Identification model packs.
 *
 * The app ships with one model (the "built-in" pack, copied from the APK's
 * assets). Additional models, such as a BioCLIP 2 export, are installed as a
 * folder holding a manifest.json and the files it names:
 *
 *   models/<id>/manifest.json
 *   {
 *     "id": "bioclip2-100k",             // [a-z0-9_-], unique
 *     "name": "BioCLIP 2 (100k species)",  // shown in Settings
 *     "version": "2.13",                   // version string passed to the vision plugin
 *     "revision": "2026-11-02",            // bump when the files change; reloads common names
 *     "platform": "android",
 *     "taxa": 100000,                      // leaf count, informational
 *     "files": {
 *       "model": "model.tflite",           // required
 *       "taxonomy": "taxonomy.csv",        // required
 *       "geomodel": "geomodel.tflite",     // optional
 *       "common_names": "common_names.json" // optional, [{ i, l, n }] like utility/commonNames
 *     }
 *   }
 *
 * Packs are looked for in two places on Android: the app's private files
 * directory and its external files directory. The external one
 * (/sdcard/Android/data/<package>/files/models) can be written with a plain
 * `adb push`, which is the easiest way to install a pack on a test phone.
 * Model packs are Android-only for now; iOS uses the built-in Core ML model.
 */

export interface ModelPack {
  id: string;
  name: string;
  version: string;
  revision: string;
  modelPath: string;
  taxonomyPath: string;
  geomodelPath: string | null;
  commonNamesPath: string | null;
  taxa: number | null;
  builtIn: boolean;
}

export interface ManifestResult {
  pack: ModelPack | null;
  error: string | null;
}

export const BUILT_IN_PACK_ID = "seek";
const SELECTED_PACK_KEY = "model_pack_id";
const PACK_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;
const FILE_NAME_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

export const modelPackDirs = ( ): string[] => (
  Platform?.OS === "android"
    ? [`${ExternalDirectoryPath}/models`, `${DocumentDirectoryPath}/models`]
    : []
);

export const builtInPack = ( ): ModelPack => ( {
  id: BUILT_IN_PACK_ID,
  name: "Seek",
  version: "2.13",
  revision: "built-in",
  modelPath: dirModel,
  taxonomyPath: dirTaxonomy,
  geomodelPath: dirGeomodel,
  commonNamesPath: null,
  taxa: null,
  builtIn: true,
} );

const fileIn = ( dir: string, name: unknown ): string | null => (
  typeof name === "string" && FILE_NAME_PATTERN.test( name ) && !name.startsWith( "." )
    ? `${dir}/${name}`
    : null
);

/** Validates a parsed manifest.json. Pure: no file system access. */
export const parseManifest = ( raw: unknown, dir: string ): ManifestResult => {
  if ( !raw || typeof raw !== "object" ) {
    return { pack: null, error: "manifest is not a JSON object" };
  }
  const m = raw as Record<string, unknown>;
  const files = ( m.files && typeof m.files === "object" ? m.files : {} ) as Record<string, unknown>;
  if ( typeof m.id !== "string" || !PACK_ID_PATTERN.test( m.id ) ) {
    return { pack: null, error: "id must be 1-64 characters of a-z, 0-9, _ or -" };
  }
  if ( m.id === BUILT_IN_PACK_ID ) {
    return { pack: null, error: `id "${BUILT_IN_PACK_ID}" is reserved for the built-in model` };
  }
  if ( typeof m.name !== "string" || m.name.trim( ) === "" ) {
    return { pack: null, error: "name is required" };
  }
  if ( typeof m.version !== "string" || m.version === "" ) {
    return { pack: null, error: "version is required" };
  }
  if ( m.platform !== undefined && m.platform !== Platform?.OS ) {
    return { pack: null, error: `pack is for ${String( m.platform )}` };
  }
  const modelPath = fileIn( dir, files.model );
  const taxonomyPath = fileIn( dir, files.taxonomy );
  if ( !modelPath || !taxonomyPath ) {
    return { pack: null, error: "files.model and files.taxonomy are required plain file names" };
  }
  return {
    error: null,
    pack: {
      id: m.id,
      name: m.name.trim( ),
      version: m.version,
      revision: typeof m.revision === "string" ? m.revision : String( m.revision ?? "" ),
      modelPath,
      taxonomyPath,
      geomodelPath: fileIn( dir, files.geomodel ),
      commonNamesPath: fileIn( dir, files.common_names ),
      taxa: typeof m.taxa === "number" ? m.taxa : null,
      builtIn: false,
    },
  };
};

/** Picks the selected pack, falling back to the built-in one, then any installed pack. */
export const choosePack = ( packs: ModelPack[], selectedId: string | null ): ModelPack => (
  packs.find( ( p ) => p.id === selectedId )
  || packs.find( ( p ) => p.builtIn )
  || packs[0]
  || builtInPack( )
);

const readPack = async ( dir: string ): Promise<ModelPack | null> => {
  try {
    const manifestPath = `${dir}/manifest.json`;
    if ( !( await exists( manifestPath ) ) ) {
      return null;
    }
    const { pack, error } = parseManifest( JSON.parse( await readFile( manifestPath, "utf8" ) ), dir );
    if ( !pack ) {
      console.log( `[ModelPacks] ignoring ${dir}: ${error}` );
      return null;
    }
    const required = [pack.modelPath, pack.taxonomyPath];
    const present = await Promise.all( required.map( ( p ) => exists( p ) ) );
    if ( present.includes( false ) ) {
      console.log( `[ModelPacks] ignoring ${dir}: model or taxonomy file missing` );
      return null;
    }
    // optional files that are named but absent are dropped rather than failing the pack
    if ( pack.geomodelPath && !( await exists( pack.geomodelPath ) ) ) {
      pack.geomodelPath = null;
    }
    if ( pack.commonNamesPath && !( await exists( pack.commonNamesPath ) ) ) {
      pack.commonNamesPath = null;
    }
    return pack;
  } catch ( e ) {
    console.log( `[ModelPacks] could not read ${dir}:`, e );
    return null;
  }
};

const builtInAvailable = async ( ): Promise<boolean> => {
  try {
    return await exists( dirModel );
  } catch {
    return false;
  }
};

/**
 * The built-in pack plus every valid installed pack (first directory wins on duplicate
 * ids). Builds without the private Seek model files (e.g. open-source builds that ship
 * a BioCLIP 2 pack instead) leave the built-in entry out when another pack exists.
 */
export const listModelPacks = async ( ): Promise<ModelPack[]> => {
  const packs: ModelPack[] = [builtInPack( )];
  for ( const root of modelPackDirs( ) ) {
    let entries: { path: string; isDirectory: () => boolean }[] = [];
    try {
      if ( !( await exists( root ) ) ) {
        continue;
      }
      entries = await readDir( root );
    } catch {
      continue;
    }
    for ( const entry of entries ) {
      if ( !entry.isDirectory( ) ) {
        continue;
      }
      const pack = await readPack( entry.path );
      if ( pack && !packs.some( ( p ) => p.id === pack.id ) ) {
        packs.push( pack );
      }
    }
  }
  if ( packs.length > 1 && Platform?.OS === "android" && !( await builtInAvailable( ) ) ) {
    return packs.filter( ( p ) => !p.builtIn );
  }
  return packs;
};

type Listener = ( pack: ModelPack ) => void;
const listeners = new Set<Listener>( );

export const getSelectedPackId = async ( ): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem( SELECTED_PACK_KEY );
  } catch {
    return null;
  }
};

export const getActiveModelPack = async ( ): Promise<ModelPack> => (
  choosePack( await listModelPacks( ), await getSelectedPackId( ) )
);

export const setSelectedPack = async ( id: string ): Promise<ModelPack> => {
  await AsyncStorage.setItem( SELECTED_PACK_KEY, id );
  const pack = await getActiveModelPack( );
  listeners.forEach( ( fn ) => fn( pack ) );
  return pack;
};

export const onActivePackChange = ( fn: Listener ): ( ( ) => void ) => {
  listeners.add( fn );
  return ( ) => {
    listeners.delete( fn );
  };
};

/**
 * Packs bundled in the APK under assets/models/<id>/ are copied once to
 * DocumentDirectoryPath/models/<id>/ (the vision plugin needs real file paths).
 * Files are re-copied only when missing or a different size. Returns true when
 * anything was copied, and notifies listeners so the camera picks the pack up.
 */
export const installBundledPacks = async ( ): Promise<boolean> => {
  if ( Platform?.OS !== "android" ) {
    return false;
  }
  let copied = false;
  try {
    if ( !( await existsAssets( "models" ) ) ) {
      return false;
    }
    const packDirs = ( await readDirAssets( "models" ) ).filter( ( e ) => e.isDirectory( ) );
    for ( const dir of packDirs ) {
      const target = `${DocumentDirectoryPath}/models/${dir.name}`;
      await mkdir( target );
      const files = ( await readDirAssets( `models/${dir.name}` ) ).filter( ( e ) => e.isFile( ) );
      // manifest last, so a half-copied pack is never picked up
      files.sort( ( a, b ) => Number( a.name === "manifest.json" ) - Number( b.name === "manifest.json" ) );
      for ( const file of files ) {
        const destination = `${target}/${file.name}`;
        let upToDate = false;
        try {
          upToDate = ( await exists( destination ) ) && Number( ( await stat( destination ) ).size ) === Number( file.size );
        } catch {
          upToDate = false;
        }
        if ( !upToDate ) {
          await copyFileAssets( `models/${dir.name}/${file.name}`, destination );
          copied = true;
        }
      }
    }
  } catch ( e ) {
    console.log( "[ModelPacks] could not install bundled packs:", e );
  }
  if ( copied ) {
    const pack = await getActiveModelPack( );
    listeners.forEach( ( fn ) => fn( pack ) );
  }
  return copied;
};
