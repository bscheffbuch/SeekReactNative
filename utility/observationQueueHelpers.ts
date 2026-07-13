// @ts-nocheck
import Realm from "realm";
import * as createUUID from "uuid";

import { parse } from "date-fns";
import { enUS } from "date-fns/locale";

import realmConfig from "../models/index";
import { createBackupUri, createUploadBackupUri, deleteBackupFile } from "./photoHelpers";
import { setISOTime, formatGMTTimeWithTimeZone } from "./dateHelpers";
import { uploadQueuedObservation } from "./uploadHelpers";
import { log } from "../react-native-logs.config";

const logger = log.extend( "observationQueueHelpers.js" );

interface QueueCoords {
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
}

interface QueuePrediction {
  name?: string;
  taxon_id?: number;
  rank_level?: number;
  rank?: number;
  combined_score?: number;
  ancestor_ids?: number[];
}

// observed_on_string is stored in the iNat-iOS-style format produced by
// formatGMTTimeWithTimeZone, e.g. "Sun Mar 18 2012 17:07:20 GMT -0700 (PDT)".
// That string starts with a weekday name, so it can't be compared lexically;
// parse it back to a real Date. Hermes' native Date parsing is unreliable, so
// use date-fns with the exact known pattern (minus the trailing zone name).
const parseObservedOnString = ( observedOn?: string | null ): Date | null => {
  if ( !observedOn ) {
    return null;
  }
  const withoutTimeZoneName = observedOn.replace( / *\([^)]*\) *$/, "" ).trim( );
  const parsed = parse(
    withoutTimeZoneName,
    "EEE MMM dd yyyy HH:mm:ss 'GMT' xxxx",
    new Date( ),
    { locale: enUS }
  );
  if ( !Number.isNaN( parsed.getTime( ) ) ) {
    return parsed;
  }
  const fallback = new Date( observedOn );
  return Number.isNaN( fallback.getTime( ) ) ? null : fallback;
};

const observedOnTime = ( obs ): number => {
  const date = parseObservedOnString( obs?.observed_on_string );
  return date ? date.getTime( ) : 0;
};

// Returns the AR-camera predictions stored with a queued draft, or [] when the
// draft was saved without an identification (older drafts / unidentified).
const parsePredictions = ( obs ): QueuePrediction[] => {
  if ( !obs || !obs.predictions ) {
    return [];
  }
  try {
    const parsed = JSON.parse( obs.predictions );
    return Array.isArray( parsed ) ? parsed : [];
  } catch {
    return [];
  }
};

// Picks the most specific (lowest rank_level) prediction as the representative
// identification for a queued draft.
const representativePrediction = ( predictions: QueuePrediction[] ): QueuePrediction | null => {
  if ( !predictions || predictions.length === 0 ) {
    return null;
  }
  return [...predictions].sort(
    ( a, b ) => ( a.rank_level ?? 100 ) - ( b.rank_level ?? 100 )
  )[0];
};

// Returns the list of photo paths attached to a queued observation. Newly
// queued drafts hold a single photo; combined drafts hold several. Falls back
// to the representative `photo.uri` for any record missing the JSON array.
const parsePhotoUris = ( obs ): string[] => {
  if ( !obs ) {
    return [];
  }
  if ( !obs.photoUris ) {
    return obs.photo?.uri ? [obs.photo.uri] : [];
  }
  try {
    const parsed = JSON.parse( obs.photoUris );
    return Array.isArray( parsed ) ? parsed : [];
  } catch {
    return obs.photo?.uri ? [obs.photo.uri] : [];
  }
};

// Saves a photo + GPS coordinates + timestamp as a single-photo queued draft.
const saveQueuedObservation = async (
  coords: QueueCoords,
  time: number,
  uri: string,
  predictions: any[] = []
): Promise<void> => {
  const realm = await Realm.open( realmConfig );
  const obsUUID = createUUID.v4( );
  const photoUUID = createUUID.v4( );

  // back the photo up to persistent app storage so it survives the OS clearing
  // the camera cache: a small screen-width copy for list thumbnails, plus a
  // high-resolution (2048px max) copy that is the one actually uploaded later
  const displayUri = ( await createBackupUri( uri, photoUUID ) ) || uri;
  const uploadUri = ( await createUploadBackupUri( uri, `${photoUUID}-upload` ) ) || uri;
  const date = formatGMTTimeWithTimeZone( setISOTime( time ) );
  const topPrediction = representativePrediction( predictions );

  try {
    realm.write( ( ) => {
      const photo = realm.create( "UploadPhotoRealm", {
        uri: displayUri,
        uploadSucceeded: false,
        uuid: photoUUID,
        notificationShown: false,
      } );
      realm.create( "UploadObservationRealm", {
        uuid: obsUUID,
        observed_on_string: date.dateForServer,
        taxon_id: topPrediction?.taxon_id ?? null,
        geoprivacy: "open",
        captive_flag: false,
        place_guess: null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        positional_accuracy: coords?.accuracy != null ? Math.trunc( coords.accuracy ) : null,
        description: null,
        photo,
        vision: predictions.length > 0,
        queued: true,
        photoUris: JSON.stringify( [uploadUri] ),
        predictions: predictions.length > 0 ? JSON.stringify( predictions ) : null,
      }, true );
    } );
  } catch ( e ) {
    logger.debug( `saveQueuedObservation error: ${e}` );
    console.log( "couldn't save queued observation", e );
  }
};

const getQueuedObservations = async ( ) => {
  const realm = await Realm.open( realmConfig );
  const queued = realm.objects( "UploadObservationRealm" ).filtered( "queued == true" );
  // newest first; observed_on_string can't be sorted lexically (see parseObservedOnString)
  return Array.from( queued ).sort( ( a, b ) => observedOnTime( b ) - observedOnTime( a ) );
};

const getQueuedCount = async ( ): Promise<number> => {
  const realm = await Realm.open( realmConfig );
  return realm.objects( "UploadObservationRealm" ).filtered( "queued == true" ).length;
};

const deleteQueuedObservation = async ( uuid: string ): Promise<void> => {
  const realm = await Realm.open( realmConfig );
  try {
    const backupFilesToDelete: string[] = [];
    realm.write( ( ) => {
      const obs = realm.objects( "UploadObservationRealm" ).filtered( `uuid == '${uuid}'` )[0];
      if ( !obs ) {
        return;
      }
      // clean up this draft's backup files (thumbnail + upload copies);
      // deleteBackupFile only removes files inside Seek's own backup directory
      parsePhotoUris( obs ).forEach( u => backupFilesToDelete.push( u ) );
      if ( obs.photo?.uri ) {
        backupFilesToDelete.push( obs.photo.uri );
      }
      if ( obs.photo ) {
        realm.delete( obs.photo );
      }
      realm.delete( obs );
    } );
    backupFilesToDelete.forEach( deleteBackupFile );
  } catch ( e ) {
    logger.debug( `deleteQueuedObservation error: ${e}` );
    console.log( "couldn't delete queued observation", e );
  }
};

// Merges several queued drafts into one multi-photo observation. The earliest
// draft keeps its metadata and accumulates every photo path; the others (and
// their representative photo objects) are removed.
const combineQueuedObservations = async ( uuids: string[] ): Promise<void> => {
  if ( !uuids || uuids.length < 2 ) {
    return;
  }
  const realm = await Realm.open( realmConfig );
  try {
    const backupFilesToDelete: string[] = [];
    realm.write( ( ) => {
      const observations = uuids
        .map( uuid => realm.objects( "UploadObservationRealm" ).filtered( `uuid == '${uuid}'` )[0] )
        .filter( Boolean );
      if ( observations.length < 2 ) {
        return;
      }
      // chronological order, so the earliest draft keeps its metadata
      observations.sort( ( a, b ) => observedOnTime( a ) - observedOnTime( b ) );
      const [primary, ...rest] = observations;
      let allUris = parsePhotoUris( primary );
      const mergedThumbUris: ( string | null )[] = [];
      rest.forEach( ( obs ) => {
        allUris = allUris.concat( parsePhotoUris( obs ) );
        mergedThumbUris.push( obs.photo?.uri || null );
        if ( obs.photo ) {
          realm.delete( obs.photo );
        }
        realm.delete( obs );
      } );
      primary.photoUris = JSON.stringify( allUris );
      // merged-away drafts' upload copies moved into the primary draft; only
      // their display thumbnails become unreferenced (unless a legacy record
      // reused the thumbnail as its upload uri)
      mergedThumbUris.forEach( ( thumbUri ) => {
        if ( thumbUri && !allUris.includes( thumbUri ) ) {
          backupFilesToDelete.push( thumbUri );
        }
      } );
    } );
    backupFilesToDelete.forEach( deleteBackupFile );
  } catch ( e ) {
    logger.debug( `combineQueuedObservations error: ${e}` );
    console.log( "couldn't combine queued observations", e );
  }
};

// Uploads every queued draft to iNaturalist. Caller is responsible for ensuring
// the user is logged in. Returns counts of successes and failures.
const uploadAllQueuedObservations = async ( ): Promise<{ success: number; failed: number }> => {
  const realm = await Realm.open( realmConfig );
  // skip drafts already marked as permanently failed (e.g. unreadable photos)
  // so they don't retry forever
  const uuids = realm.objects( "UploadObservationRealm" )
    .filtered( "queued == true AND photo.uploadFailed == false" )
    .map( o => o.uuid );

  let success = 0;
  let failed = 0;

  for ( const uuid of uuids ) {
    const obs = realm.objects( "UploadObservationRealm" ).filtered( `uuid == '${uuid}'` )[0];
    if ( !obs ) {
      continue;
    }
    const result = await uploadQueuedObservation( obs );
    if ( result === true ) {
      success += 1;
      realm.write( ( ) => {
        if ( obs.photo ) {
          obs.photo.uploadSucceeded = true;
          obs.photo.notificationShown = true;
        }
        // no longer a draft now that it's been uploaded
        obs.queued = false;
      } );
    } else {
      failed += 1;
    }
  }

  return { success, failed };
};

export {
  parsePhotoUris,
  parsePredictions,
  parseObservedOnString,
  representativePrediction,
  saveQueuedObservation,
  getQueuedObservations,
  getQueuedCount,
  deleteQueuedObservation,
  combineQueuedObservations,
  uploadAllQueuedObservations,
};
