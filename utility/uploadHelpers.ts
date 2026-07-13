// @ts-nocheck
import Realm from "realm";
import inatjs, { FileUpload } from "inaturalistjs";
import * as createUUID from "uuid";

import realmConfig from "../models/index";
import { resizeImage, deleteBackupFile } from "./photoHelpers";
import { fetchAccessToken } from "./loginHelpers";
import { fetchJSONWebToken } from "./tokenHelpers";
import i18n from "../i18n";
import { log } from "../react-native-logs.config";

const logger = log.extend( "uploadHelpers.js" );

// this was causing some users to only see internet errors, so removing this for the moment
// const fetchWithTimeout = ( timeout, fetch ) => Promise.race( [
//   fetch,
//   new Promise( ( _, reject ) =>
//       setTimeout( ( ) => reject( new Error( "timeout" ) ), timeout )
//     )
// ] );

const saveUploadSucceeded = async ( id: number ): Promise<void> => {
  const realm = await Realm.open( realmConfig );
  const photo = realm.objects( "UploadPhotoRealm" ).filtered( `id == ${id}` )[0];

  try {
    realm.write( ( ) => {
      photo.uploadSucceeded = true;
    } );
  } catch ( e ) {
    console.log( "couldn't set succeeded status: ", e );
  }
};

const saveUploadFailed = async ( id: number ): Promise<void> => {
  const realm = await Realm.open( realmConfig );
  const photo = realm.objects( "UploadPhotoRealm" ).filtered( `id == ${id}` )[0];

  try {
    realm.write( ( ) => {
      photo.uploadFailed = true;
    } );
  } catch ( e ) {
    console.log( "couldn't set failed status: ", e );
  }
};

const resizeImageForUpload = async ( uri: string, outputPath?: string ): Promise<string> => {
  return await resizeImage( uri, 2048, 2048, outputPath );
};

interface ErrorType {
  error: {
    type: string;
    errorText?: string;
  };
}

const appendPhotoToObservation = async ( photo: {
  id: number;
  uuid: string;
  uri: string;
}, token: string, uri: string ): Promise<boolean | ErrorType | undefined> => {
  const { id, uuid } = photo;
  const photoParams = {
    "observation_photo[observation_id]": id,
    "observation_photo[uuid]": uuid,
    file: new FileUpload( {
      uri,
      name: "photo.jpeg",
      type: "image/jpeg",
    } ),
  };

  const options = { api_token: token };

  try {
    await inatjs.observation_photos.create( photoParams, options );
    return true;
  } catch ( e ) {
    if ( e.message === "timeout" ) {
      return {
        error: {
          type: "timeout",
        },
      };
    }

    // when there's no error message, this can be caused by upload starting when user first posts from posting screen
    // and then immediately going to home screen, where a second upload will start while first is still in progress
    if ( e.message ) {
      return {
        error: {
          type: "photo",
          errorText: e.message,
        },
      };
    }
  }
};

const uploadPhoto = async ( photo: Photo, token: string ): Promise<boolean | ErrorType | undefined> => {
  const { uri, id } = photo;

  // const alreadyResized = uri.includes( "/SeekUploads" );

  // now that we're resizing when creating the realm observation, this is unnecessary
  // except for photos that were already stored with the cameraroll uri
  const resizedPhoto = await resizeImageForUpload( uri );

  if ( !resizedPhoto ) {
    // if upload cannot complete because there is no longer a photo to upload
    // save this setting so Seek does not keep trying to upload it (and crashing each time)
    saveUploadFailed( id );
    return {
      error: {
        type: "photo",
        errorText: i18n.t( "post_to_inat_card.error_photo" ),
      },
    };
  }
  const photoUpload = await appendPhotoToObservation( photo, token, resizedPhoto );

  if ( photoUpload === true ) {
    saveUploadSucceeded( id );
    return true;
  }
  return photoUpload;
};

const saveObservationId = async ( id: number, photo: Photo ): Promise<Photo | undefined> => {
  const realm = await Realm.open( realmConfig );
  try {
    realm.write( ( ) => {
      photo.id = id;
    } );
    return photo;
  } catch ( e ) {
    console.log( "couldn't save id to UploadPhotoRealm", e );
  }
};

const checkInactiveTaxonIds = async ( id ) => {
  try {
    const { results } = await inatjs.taxa.fetch( id );
    const isActive = results[0].is_active;
    const synonymousTaxonIds = results[0].current_synonymous_taxon_ids;
    const ancestorIds = results[0].ancestor_ids;

    if ( isActive ) { return id; }

    // if taxon replaced by 1 taxon, swap in the new taxon id
    if ( synonymousTaxonIds.length === 1 ) {
      return synonymousTaxonIds[0];
    } else {
      // if no longer active or taxon replaced by 2 taxa, roll up to nearest common ancestor
      return ancestorIds[ancestorIds.length - 1];
    }
  } catch {
    return id;
  }
};

interface Photo {
  id: number;
  uri: string;
  uuid: string;
}

interface Observation {
  uuid: string;
  observed_on_string: string | null;
  taxon_id: number | null;
  geoprivacy: string;
  captive_flag: boolean;
  place_guess: string | null;
  latitude: number | null;
  longitude: number | null;
  positional_accuracy: number | null;
  description: string | null;
  photo: Photo;
  vision: boolean;
}

const uploadObservation = async ( observation: Observation ): Promise<boolean | ErrorType | undefined> => {
  const login = await fetchAccessToken( );
  logger.debug( `login: ${login}` );
  const taxonId = await checkInactiveTaxonIds( observation.taxon_id );
  logger.debug( `taxonId: ${taxonId}` );


  const params = {
    // realm doesn't let you use spread operator, apparently
    observation: {
      uuid: observation.uuid,
      observed_on_string: observation.observed_on_string,
      taxon_id: taxonId,
      geoprivacy: observation.geoprivacy,
      captive_flag: observation.captive_flag,
      place_guess: observation.place_guess,
      latitude: observation.latitude,
      longitude: observation.longitude,
      positional_accuracy: observation.positional_accuracy,
      description: observation.description,
      // this shows that the id is recommended by computer vision
      owners_identification_from_vision_requested: observation.vision,
    },
  };

  const token = await fetchJSONWebToken( login );

  // catch server downtime or login token error
  if ( typeof token === "object" ) {
    logger.debug( "token is an object that indicates a server downtime or login token error" );
    return token;
  }
  const options = { api_token: token };
  logger.debug( `options.api_token: ${options.api_token}` );

  try {
    if ( !observation.photo.id ) {
      const response = await inatjs.observations.create( params, options );
      const { id } = response[0];
      logger.debug( `id: ${id}` );

      const photo = await saveObservationId( id, observation.photo );
      return await uploadPhoto( photo, token );
    } else {
      // don't try to create an observation which has already been uploaded to
      // iNat; this leads to limitless repeat identifications if a user suggests a different identification
      // than what's stored in observation.taxon_id via iNat web/apps
      return await uploadPhoto( observation.photo, token );
    }
  } catch ( e ) {
    logger.debug( `error: ${e}` );
    if ( e.message === "timeout" ) {
      return {
        error: {
          type: "timeout",
        },
      };
    }
    return {
      error: {
        type: "observation",
        errorText: e.message,
      },
    };
  }
};

// Uploads a queued "save for later" draft. Unlike uploadObservation, this
// supports multiple photos per observation (stored as a JSON array in
// observation.photoUris) so combined drafts upload as a single iNat observation.
const uploadQueuedObservation = async ( observation ): Promise<boolean | ErrorType | undefined> => {
  const login = await fetchAccessToken( );
  const token = await fetchJSONWebToken( login );

  if ( typeof token === "object" ) {
    return token;
  }
  const options = { api_token: token };

  const genericPhotoError: ErrorType = {
    error: {
      type: "photo",
      errorText: i18n.t( "post_to_inat_card.error_photo" ),
    },
  };

  // mark the draft as permanently failed (analogous to uploadFailed on the
  // normal upload path) so Seek doesn't retry an upload that can never succeed
  const markQueuedUploadFailed = async ( ) => {
    if ( !observation.photo ) {
      return;
    }
    try {
      const realm = await Realm.open( realmConfig );
      realm.write( ( ) => {
        observation.photo.uploadFailed = true;
      } );
    } catch ( e ) {
      console.log( "couldn't set failed status on queued observation: ", e );
    }
  };

  let photoUris: string[] = [];
  let hasStoredPhotoUris = false;
  try {
    if ( observation.photoUris ) {
      const parsed = JSON.parse( observation.photoUris );
      if ( Array.isArray( parsed ) ) {
        photoUris = parsed;
        hasStoredPhotoUris = true;
      }
    }
  } catch {
    photoUris = [];
  }
  // fall back to the representative photo only for legacy records that never
  // stored a photoUris array; an empty stored array means nothing is left
  if ( !hasStoredPhotoUris && photoUris.length === 0 && observation.photo?.uri ) {
    photoUris = [observation.photo.uri];
  }

  if ( photoUris.length === 0 ) {
    await markQueuedUploadFailed( );
    return genericPhotoError;
  }

  const params = {
    observation: {
      uuid: observation.uuid,
      observed_on_string: observation.observed_on_string,
      taxon_id: observation.taxon_id || undefined,
      geoprivacy: observation.geoprivacy,
      captive_flag: observation.captive_flag,
      place_guess: observation.place_guess,
      latitude: observation.latitude,
      longitude: observation.longitude,
      positional_accuracy: observation.positional_accuracy,
      description: observation.description,
      owners_identification_from_vision_requested: observation.vision,
    },
  };

  try {
    let id = observation.photo?.id;
    if ( !id ) {
      const response = await inatjs.observations.create( params, options );
      id = response[0].id;
      // persist the observation id immediately so a crash after this point
      // doesn't re-create the observation on the next attempt
      if ( observation.photo ) {
        await saveObservationId( id, observation.photo );
      }
      logger.debug( `queued observation created with id: ${id}` );
    }

    let uploadedPhotoCount = 0;
    let remainingPhotoUris: string[] = [...photoUris];
    let firstPhotoError: ErrorType | undefined;

    // persist the remaining list after every removal so a crash mid-loop
    // doesn't re-upload photos that already made it to iNat
    const persistRemainingPhotoUris = async ( ) => {
      const realm = await Realm.open( realmConfig );
      realm.write( ( ) => {
        observation.photoUris = JSON.stringify( remainingPhotoUris );
      } );
    };

    for ( const uri of photoUris ) {
      const resizedPhoto = await resizeImageForUpload( uri );
      if ( !resizedPhoto ) {
        // photo is missing/unreadable and can never upload; drop it for good
        remainingPhotoUris = remainingPhotoUris.filter( u => u !== uri );
        await persistRemainingPhotoUris( );
        deleteBackupFile( uri );
        firstPhotoError = firstPhotoError || genericPhotoError;
        continue;
      }
      const photoUpload = await appendPhotoToObservation(
        { id, uuid: createUUID.v4(), uri: resizedPhoto },
        token,
        resizedPhoto
      );
      if ( photoUpload === true ) {
        uploadedPhotoCount += 1;
        remainingPhotoUris = remainingPhotoUris.filter( u => u !== uri );
        await persistRemainingPhotoUris( );
        // uploaded, so the local backup copy is no longer needed
        deleteBackupFile( uri );
      } else {
        // transient failure: keep the uri around so it retries next time
        firstPhotoError = firstPhotoError || photoUpload || genericPhotoError;
      }
    }

    if ( remainingPhotoUris.length === 0 ) {
      if ( uploadedPhotoCount > 0 ) {
        // everything that could upload has uploaded; any unreadable photos
        // were dropped permanently above
        return true;
      }
      // nothing uploaded and nothing left to retry
      await markQueuedUploadFailed( );
      return firstPhotoError || genericPhotoError;
    }

    return firstPhotoError || genericPhotoError;
  } catch ( e ) {
    logger.debug( `uploadQueuedObservation error: ${e}` );
    if ( e.message === "timeout" ) {
      return { error: { type: "timeout" } };
    }
    return { error: { type: "observation", errorText: e.message } };
  }
};

const saveObservationToRealm = async ( observation: Observation, uri: string ): Promise<boolean | ErrorType | undefined> => {
  const realm = await Realm.open( realmConfig );
  const obsUUID = createUUID.v4();
  const photoUUID = createUUID.v4();

  // I'm not sure how much hidden space this will take up on a user's device
  // but we probably need to delete photos from this directory regularly after they have been uploaded
  // const outputPath = Platform.OS === "ios"
    // ? `${dirPhotosForUpload}/${photoUUID}`
    // for whatever reason, the resize library doesn't return anything if I add the photoUUID
    // but we can at least store these uris in the SeekUploads folder on Android
    // : `${dirPhotosForUpload}`;
  // const resizedPhoto = await resizeImageForUpload( uri, outputPath );

  try {
    realm.write( ( ) => {
      const photo = realm.create( "UploadPhotoRealm", {
        uri,
        uploadSucceeded: false,
        uuid: photoUUID,
        notificationShown: false,
      } );
      realm.create( "UploadObservationRealm", {
        ...observation,
        uuid: obsUUID,
        photo,
      }, true );
    } );

    const latestObs = realm.objects( "UploadObservationRealm" ).filtered( `uuid == '${obsUUID}'` )[0];
    return uploadObservation( latestObs );
  } catch ( e ) {
    console.log( "couldn't save observation to UploadObservationRealm", e );
    logger.debug( `saveObservationToRealm error: ${e}` );
  }
};

const checkForNumSuccessfulUploads = async ( ): Promise<number> => {
  const realm = await Realm.open( realmConfig );

  return realm.objects( "UploadPhotoRealm" )
    .filtered( "uploadSucceeded == true AND notificationShown == false" ).length;
};

const markUploadsAsSeen = async ( ): Promise<void> => {
  const realm = await Realm.open( realmConfig );
  const uploads = realm.objects( "UploadPhotoRealm" );

  try {
    uploads.forEach( upload => {
      if ( upload.uploadSucceeded === true && upload.notificationShown === false ) {
        realm.write( ( ) => {
          upload.notificationShown = true;
        } );
      }
    } );
  } catch ( e ) {
    console.log( "couldn't mark uploads as seen in UploadPhotoRealm", e );
  }
};

const markCurrentUploadAsSeen = async ( upload: {
  photo: {
    notificationShown: boolean;
  };
} ): Promise<void> => {
  const realm = await Realm.open( realmConfig );

  try {
    if ( upload.photo.notificationShown === false ) {
      realm.write( ( ) => {
        upload.photo.notificationShown = true;
      } );
    }
  } catch ( e ) {
    console.log( "couldn't mark current upload as seen", e );
  }
};

const checkForUploads = async ( ) => {
  const realm = await Realm.open( realmConfig );
  return realm.objects( "UploadObservationRealm" );
};

export {
  resizeImageForUpload,
  saveObservationToRealm,
  checkForNumSuccessfulUploads,
  markUploadsAsSeen,
  checkForUploads,
  uploadObservation,
  uploadQueuedObservation,
  markCurrentUploadAsSeen,
};
