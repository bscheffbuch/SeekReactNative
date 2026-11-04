// Identifying photos picked from the gallery: reading their date and place, running the
// classifier on them and turning the result into the observation the Match screen shows.
import { Platform } from "react-native";
import { getUnixTime } from "date-fns";
import * as ImagePicker from "react-native-image-picker";

import i18n from "../i18n";
import InatVision from "../components/Camera/ARCamera/helpers/visionPluginWrapper";
import type { ObservationImage } from "../components/Providers/ObservationProvider";
import { getActiveModelPack } from "./modelPacks";
import readExifFromMultiplePhotos from "./parseExif";
import { checkForPhotoMetaData } from "./photoHelpers";
import type { NormalizedRect } from "../components/Camera/ARCamera/helpers/previewGeometry";

export interface PickedPhoto {
  uri: string;
  // unix seconds
  time: number;
  latitude?: number;
  longitude?: number;
}

interface PickerAsset {
  uri?: string;
  timestamp?: string | number;
}

// The old Android picker ignores the selection limit, so callers cut the selection to this.
export const MAX_PHOTOS = 10;

// Below this the plugin drops a taxon from a photo's branch. The single-photo flow keeps
// its default of 70; combining photos needs the weaker ancestors and species too.
export const ALL_BRANCH_SCORES = 0.01;

const readPickedPhoto = async ( asset: PickerAsset ): Promise<PickedPhoto | null> => {
  const { uri, timestamp } = asset;
  if ( !uri ) {
    return null;
  }
  const exif = await readExifFromMultiplePhotos( [uri] );
  const { latitude, longitude, observed_on_string: observedOn } = exif;
  const exifTime = observedOn
    ? getUnixTime( new Date( observedOn ) )
    : Math.floor( Date.now( ) / 1000 );
  const time = typeof timestamp === "string"
    ? getUnixTime( new Date( timestamp ) )
    : timestamp || exifTime;
  return { uri, time, latitude, longitude };
};

const hasLocation = ( photo: PickedPhoto ) => photo.latitude != null && photo.longitude != null;

const imageOptions = async ( photo: PickedPhoto, cropRect?: NormalizedRect | null ) => {
  const pack = await getActiveModelPack( );
  const uri = Platform.OS === "android" ? photo.uri.replace( /^file:\/\//, "" ) : photo.uri;
  const useGeomodel = hasLocation( photo ) && pack.geomodelPath != null;
  return {
    version: pack.version,
    uri,
    modelPath: pack.modelPath,
    taxonomyPath: pack.taxonomyPath,
    useGeomodel,
    geomodelPath: pack.geomodelPath ?? undefined,
    location: useGeomodel
      ? { latitude: photo.latitude as number, longitude: photo.longitude as number }
      : undefined,
    ...( cropRect ? { cropRect } : {} ),
  };
};

// The best branch: life down to the top leaf. cropRect limits the model to that part of
// the photo (normalised to the photo as displayed).
const identifyPhoto = async (
  photo: PickedPhoto,
  confidenceThreshold?: number,
  cropRect?: NormalizedRect | null
): Promise<InatVision.Prediction[]> => {
  const options = await imageOptions( photo, cropRect );
  const { predictions } = await InatVision.getPredictionsForImage( { ...options, confidenceThreshold } );
  return predictions;
};

// The model's top leaves (mostly species), best first: the alternatives to the best branch.
const suggestAlternatives = async (
  photo: PickedPhoto,
  cropRect?: NormalizedRect | null
): Promise<InatVision.Prediction[]> => {
  const options = await imageOptions( photo, cropRect );
  const { predictions } = await InatVision.getPredictionsForImage( {
    ...options,
    mode: InatVision.MODE.COMMON_ANCESTOR,
  } );
  return predictions;
};

// Precise coordinates are filled for logged-in users only (they can post the observation).
const buildObservationImage = (
  photo: PickedPhoto,
  predictions: ObservationImage["predictions"],
  login: boolean
): ObservationImage => {
  const located = checkForPhotoMetaData( hasLocation( photo )
    ? { latitude: photo.latitude as number, longitude: photo.longitude as number }
    : null );
  const latitude = located ? photo.latitude ?? null : null;
  const longitude = located ? photo.longitude ?? null : null;
  const image: ObservationImage = {
    time: photo.time,
    uri: photo.uri,
    predictions,
    errorCode: 0,
    latitude,
    longitude,
    preciseCoords: login
      ? { latitude, longitude, accuracy: null }
      : { latitude: null, longitude: null, accuracy: null },
  };
  return image;
};

// Opens the photo library; null when nothing usable was picked. The picker never rejects,
// it reports problems in errorCode.
const launchPhotoPicker = async ( ): Promise<PickerAsset[] | null> => {
  const response = await ImagePicker.launchImageLibrary( {
    selectionLimit: MAX_PHOTOS,
    mediaType: "photo",
    includeBase64: false,
    forceOldAndroidPhotoPicker: true,
    chooserTitle: i18n.t( "gallery.import_photos_from" ),
    presentationStyle: "overFullScreen",
  } );
  if ( !response || response.didCancel || !response.assets?.length || response.errorCode ) {
    return null;
  }
  return response.assets;
};

export interface PickedPhotos {
  photos: PickedPhoto[];
  // photos past MAX_PHOTOS the picker returned anyway
  skipped: number;
}

const readPickedPhotos = async ( assets: PickerAsset[] ): Promise<PickedPhotos> => {
  const kept = assets.slice( 0, MAX_PHOTOS );
  const photos = ( await Promise.all( kept.map( readPickedPhoto ) ) )
    .filter( ( photo ): photo is PickedPhoto => photo !== null );
  return { photos, skipped: assets.length - kept.length };
};

export {
  readPickedPhoto,
  identifyPhoto,
  suggestAlternatives,
  buildObservationImage,
  launchPhotoPicker,
  readPickedPhotos,
};
