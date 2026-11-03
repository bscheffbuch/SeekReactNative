import React, { useContext, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "react-native-image-picker";
import {
  TouchableOpacity,
  View,
  Platform,
} from "react-native";

import i18n from "../../../i18n";
import { checkForPhotoMetaData } from "../../../utility/photoHelpers";
import { getActiveModelPack } from "../../../utility/modelPacks";
import { UserContext } from "../../UserContext";
import { useObservation } from "../../Providers/ObservationProvider";
import type { ObservationImage } from "../../Providers/ObservationProvider";
import { viewStyles } from "../../../styles/camera/arCameraOverlay";
import readExifFromMultiplePhotos from "../../../utility/parseExif";
import { getUnixTime } from "date-fns";
import LoadingWheel from "../../UIComponents/LoadingWheel";
import InatVision from "./helpers/visionPluginWrapper";
import { log } from "../../../react-native-logs.config";
import { LogLevels, logToApi } from "../../../utility/apiCalls";
import { ImageIcon } from "../../UIComponents/AppIcons";
import { colors } from "../../../styles/global";

const logger = log.extend( "GalleryButton.tsx" );

interface Props {
  setIsActive: ( arg0: boolean ) => void;
  // pick / adjust the subject on the Reframe screen, which then identifies the crop
  reframe?: boolean;
}

interface PhotoLocation {
  latitude?: number;
  longitude?: number;
}

const GalleryButton = ( { setIsActive, reframe = false }: Props ) => {
  const { startObservationWithImage } = useObservation();
  const { login } = useContext( UserContext );
  const navigation = useNavigation( );
  const [imageSelected, setImageSelected] = useState( false );

  const navigateToResults = (
    uri: string,
    time: number,
    location: PhotoLocation,
    predictions: InatVision.Prediction[]
  ) => {
    const image: ObservationImage = {
      time,
      uri,
      predictions: [],
      errorCode: 0,
      latitude: null,
      longitude: null,
      preciseCoords: {
        latitude: null,
        longitude: null,
        accuracy: null,
      },
    };

    const metadataLocation = location.latitude != null && location.longitude != null
      ? {
        latitude: location.latitude,
        longitude: location.longitude,
      }
      : null;

    if ( checkForPhotoMetaData( metadataLocation ) ) {
      const { latitude, longitude } = location;
      image.latitude = latitude ?? null;
      image.longitude = longitude ?? null;

      if ( login ) {
        image.preciseCoords = {
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          accuracy: null,
        };
      }
    } else if ( login ) {
      image.preciseCoords = {
        latitude: null,
        longitude: null,
        accuracy: null,
      };
    }

    if ( reframe ) {
      const path = uri.replace( /^file:\/\//, "" );
      // allow coming back to the camera from Reframe ("Retake")
      setImageSelected( false );
      navigation.navigate( "Reframe", { image, photoPath: path } );
      return;
    }

    if ( predictions && predictions.length > 0 ) {
      image.predictions = predictions;
      const rankLevel = predictions.sort( ( a, b ) => a.rank_level - b.rank_level )[0]?.rank_level || 100;
      logToApi( {
        level: LogLevels.INFO,
        message: `rankLevel ${rankLevel}`,
        context: "getPredictionsForImage rankLevel",
      } ).catch( ( logError ) => logger.error( "logToApi failed:", logError ) );
      startObservationWithImage( image, () => {
        navigation.navigate( "Match", { origin: "camera" } );
      } );
    } else {
      logToApi( {
        level: LogLevels.INFO,
        message: "Online vision would have been used here, but fetching online results has been removed, " +
          "if you see this message it means that some device was not able to get offline vision.",
        context: "GalleryButton",
      } ).catch( ( logError ) => logger.error( "logToApi failed:", logError ) );
    }
  };

  const getPredictions = async ( uri: string, timestamp: number, location: PhotoLocation ) => {
    const pack = await getActiveModelPack( );
    const path = uri.split( "file://" );
    const reactUri = Platform.OS === "android" ? path[1] : uri;

    const hasLocation = location.latitude != null && location.longitude != null && pack.geomodelPath != null;
    const geomodelLocation = hasLocation
      ? {
        latitude: location.latitude as number,
        longitude: location.longitude as number,
      }
      : undefined;
    InatVision.getPredictionsForImage( {
      version: pack.version,
      uri: reactUri,
      modelPath: pack.modelPath,
      taxonomyPath: pack.taxonomyPath,
      useGeomodel: hasLocation,
      geomodelPath: pack.geomodelPath ?? undefined,
      location: geomodelLocation,
    } )
      .then( ( result ) => {
        const { predictions } = result;
        navigateToResults( uri, timestamp, location, predictions );
      } )
      .catch( ( err ) => {
        console.log( "Error", err );
      } );
  };

  const showPhotoGallery = async () => {
    setIsActive( false );
    // According to the native code of the image picker library, it never rejects the promise,
    // just returns a response object with errorCode
    const response = await ImagePicker.launchImageLibrary( {
      selectionLimit: 1,
      mediaType: "photo",
      includeBase64: false,
      forceOldAndroidPhotoPicker: true,
      chooserTitle: i18n.t( "gallery.import_photos_from" ),
      presentationStyle: "overFullScreen",
    } );

    if ( !response || response.didCancel || !response.assets || response.errorCode ) {
      // User cancelled selection of photos - nothing to do here
      setIsActive( true );
      return;
    }

    setImageSelected( true );

    const asset = response.assets[0];
    const { timestamp, uri } = asset;
    if ( !uri ) {
      throw new Error( "No URI in pick photo response" );
    }

    const exif = await readExifFromMultiplePhotos( [uri] );
    const { latitude, longitude, observed_on_string } = exif;
    const location = { latitude, longitude };
    const unixTimestamp = observed_on_string
      ? getUnixTime( new Date( observed_on_string ) )
      : Math.floor( Date.now() / 1000 );
    const selectedTimestamp = typeof timestamp === "string"
      ? getUnixTime( new Date( timestamp ) )
      : timestamp || unixTimestamp;
    if ( reframe ) {
      // Reframe runs the model on the chosen crop
      navigateToResults( uri, selectedTimestamp, location, [] );
      return;
    }
    getPredictions( uri, selectedTimestamp, location ).catch( ( e ) => console.log( "[GalleryButton] predictions failed", e ) );
  };

  if ( imageSelected ) {
    return <View
      style={viewStyles.galleryButton}
    >
      <LoadingWheel color="white" />
    </View>;
  }

  return (
    <TouchableOpacity
        accessibilityLabel={i18n.t( "accessibility.open_gallery" )}
        accessible
        onPress={showPhotoGallery}
        style={viewStyles.galleryButton}
      >
      <ImageIcon color={colors.white} size={27} strokeWidth={2.35} />
    </TouchableOpacity>
  );
};

export default GalleryButton;
