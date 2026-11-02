// @ts-nocheck
import { getVersion } from "react-native-device-info";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { readFile } from "@dr.pogodin/react-native-fs";

import { setDisplayLanguage, localeNoHyphens } from "./languageHelpers";
import { capitalizeNames } from "./helpers";
import i18n from "../i18n";
import commonNames from "../utility/commonNames";
import { getActiveModelPack } from "./modelPacks";
import type { ModelPack } from "./modelPacks";

const Realm = require( "realm" );
const realmConfig = require( "../models/index" );

const getTaxonCommonName = ( taxonID?: number ) => (
  new Promise<string | null>( ( resolve, reject ) => {
    if ( !taxonID ) { return; }
    Realm.open( realmConfig.default ).then( ( realm ) => {
      // need this because realm isn't guaranteed to only contain
      // one locale; we could solve this by deleting the realm database each time
      // the app loads or including this searchLocale parameter
      const searchLocale = localeNoHyphens( ( i18n.locale ) );
      // look up common names for predicted taxon in the current locale
      const commonNamesRealm = realm.objects( "CommonNamesRealm" )
        .filtered( `taxon_id == ${taxonID} and locale == '${searchLocale}'` );
      resolve( commonNamesRealm.length > 0 ? capitalizeNames( commonNamesRealm[0].name ) : null );
    } ).catch( ( err: Error ) => {
      console.log( "[DEBUG] Failed to open realm, error: ", err );
      reject( err );
    } );
  } )
);

const addCommonNamesFromFile = ( realm, commonNamesDict: { i: number; l: string; n: string }[], seekLocale: string ) => {
  commonNamesDict.forEach( ( commonNameRow ) => {
    if ( commonNameRow.l === seekLocale ) {
      // only create realm objects if language matches current locale
      realm.create( "CommonNamesRealm", {
        taxon_id: commonNameRow.i,
        locale: commonNameRow.l,
        name: commonNameRow.n,
      }, true );
    }
  } );
};

const PACK_NAMES_KEY = "model_pack_common_names";
const PACK_NAMES_CHUNK = 2000;

/**
 * Adds common names shipped with an installed model pack (common_names.json,
 * rows of { i: taxon id, l: locale, n: name }) for the current locale.
 * Only taxa without a name in that locale are added, so bundled names win and
 * repeated loads never create duplicates. Writes in chunks and yields between
 * them so a 100k-name pack doesn't block the UI. Skips work when this pack
 * revision was already loaded for this app version and locale.
 */
const loadModelPackCommonNames = async ( pack: ModelPack, seekLocale: string ): Promise<number> => {
  if ( !pack.commonNamesPath ) {
    return 0;
  }
  const marker = `${pack.id}|${pack.revision}|${getVersion( )}|${seekLocale}`;
  try {
    if ( await AsyncStorage.getItem( PACK_NAMES_KEY ) === marker ) {
      return 0;
    }
    const rows = JSON.parse( await readFile( pack.commonNamesPath, "utf8" ) )
      .filter( ( r ) => r && r.l === seekLocale && Number.isInteger( r.i ) && typeof r.n === "string" );
    const realm = await Realm.open( realmConfig.default );
    const known = new Set( );
    realm.objects( "CommonNamesRealm" ).filtered( "locale == $0", seekLocale ).forEach( ( row ) => {
      known.add( row.taxon_id );
    } );
    const missing = rows.filter( ( r ) => !known.has( r.i ) );
    for ( let i = 0; i < missing.length; i += PACK_NAMES_CHUNK ) {
      realm.write( ( ) => {
        missing.slice( i, i + PACK_NAMES_CHUNK ).forEach( ( r ) => {
          realm.create( "CommonNamesRealm", { taxon_id: r.i, locale: r.l, name: r.n } );
        } );
      } );
      await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
    }
    await AsyncStorage.setItem( PACK_NAMES_KEY, marker );
    return missing.length;
  } catch ( e ) {
    console.log( "[DEBUG] Failed to load model pack common names: ", e );
    return 0;
  }
};

const loadActivePackCommonNames = async ( seekLocale: string = localeNoHyphens( i18n.locale ) ) => (
  loadModelPackCommonNames( await getActiveModelPack( ), seekLocale )
);

const setupCommonNames = ( preferredLanguage: string ) => {
  let seekLocaleForPack = null;
  Realm.open( realmConfig.default )
    .then( ( realm ) => {
      realm.write( () => {
        const locale = setDisplayLanguage( preferredLanguage );
        // need to remove hyphens for pt-BR, es-MX, zh-CN, zh-TW
        const seekLocale = localeNoHyphens( locale );
        seekLocaleForPack = seekLocale;
        const realmLocale = realm.objects( "CommonNamesRealm" ).filtered( `locale == "${seekLocale}"` );

        const userSettings = realm.objects( "UserSettingsRealm" )[0];
        const prevAppVersion = userSettings?.appVersion;
        const currentAppVersion = getVersion( );

        // only reload common names when the app version changes or when the
        // user's desired locale changes, not on each app launch
        if ( prevAppVersion === currentAppVersion && realmLocale.length > 0 ) {
          return;
        } else {
          userSettings.appVersion = currentAppVersion;
        }

        // otherwise, delete all existing common names from Realm and update with preferred language
        realm.delete( realm.objects( "CommonNamesRealm" ) );
        // load names from each file. React-native requires need to be strings
        // so each file is listed here instead of some kind of loop
        Object.keys( commonNames ).forEach( ( key ) => {
          const commonNamesArray = commonNames[key];
          addCommonNamesFromFile( realm, commonNamesArray, seekLocale );
        } );
      } );
      // names that come with an installed model pack (e.g. BioCLIP 2) go in after
      // the bundled ones, which may just have been reloaded
      return loadActivePackCommonNames( seekLocaleForPack || undefined );
    } ).catch( ( err: Error ) => {
      console.log( "[DEBUG] Failed to setup common names: ", err );
    } );
};

export {
  loadModelPackCommonNames,
  loadActivePackCommonNames,
  getTaxonCommonName,
  setupCommonNames,
};
