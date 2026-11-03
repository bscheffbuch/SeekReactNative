import React, { useContext, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "react-native-image-picker";
import {
  TouchableOpacity,
  View,
} from "react-native";

import i18n from "../../../i18n";
import { UserContext } from "../../UserContext";
import { useObservation } from "../../Providers/ObservationProvider";
import {
  MAX_PHOTOS,
  buildObservationImage,
  identifyPhoto,
  readPickedPhoto,
} from "../../../utility/photoIdentification";
import type { PickedPhoto } from "../../../utility/photoIdentification";
import { viewStyles } from "../../../styles/camera/arCameraOverlay";
import LoadingWheel from "../../UIComponents/LoadingWheel";
import { log } from "../../../react-native-logs.config";
import { LogLevels, logToApi } from "../../../utility/apiCalls";
import { ImageIcon } from "../../UIComponents/AppIcons";
import { colors } from "../../../styles/global";

const logger = log.extend( "GalleryButton.tsx" );

interface Props {
  setIsActive: ( arg0: boolean ) => void;
  // pick / adjust the subject on the Reframe screen, which then identifies the crop
  // (one photo only; several photos go to the photo identification screen)
  reframe?: boolean;
}

const GalleryButton = ( { setIsActive, reframe = false }: Props ) => {
  const { startObservationWithImage } = useObservation();
  const { login } = useContext( UserContext );
  const navigation = useNavigation( );
  const [imageSelected, setImageSelected] = useState( false );

  const showCameraAgain = ( ) => {
    setImageSelected( false );
    setIsActive( true );
  };

  const identifySinglePhoto = async ( photo: PickedPhoto ) => {
    if ( reframe ) {
      // Reframe runs the model on the chosen crop; allow coming back ("Retake")
      setImageSelected( false );
      navigation.navigate( "Reframe", {
        image: buildObservationImage( photo, [], login ),
        photoPath: photo.uri.replace( /^file:\/\//, "" ),
      } );
      return;
    }
    const predictions = await identifyPhoto( photo );
    const rankLevel = [...predictions].sort( ( a, b ) => a.rank_level - b.rank_level )[0]?.rank_level || 100;
    logToApi( {
      level: LogLevels.INFO,
      message: `rankLevel ${rankLevel}`,
      context: "getPredictionsForImage rankLevel",
    } ).catch( ( logError ) => logger.error( "logToApi failed:", logError ) );
    // no predictions above the threshold opens the "no match" result
    startObservationWithImage( buildObservationImage( photo, predictions, login ), () => {
      navigation.navigate( "Match", { origin: "camera" } );
    } );
  };

  const showPhotoGallery = async () => {
    setIsActive( false );
    // According to the native code of the image picker library, it never rejects the promise,
    // just returns a response object with errorCode
    const response = await ImagePicker.launchImageLibrary( {
      selectionLimit: MAX_PHOTOS,
      mediaType: "photo",
      includeBase64: false,
      forceOldAndroidPhotoPicker: true,
      chooserTitle: i18n.t( "gallery.import_photos_from" ),
      presentationStyle: "overFullScreen",
    } );

    if ( !response || response.didCancel || !response.assets?.length || response.errorCode ) {
      // User cancelled selection of photos - nothing to do here
      setIsActive( true );
      return;
    }

    setImageSelected( true );
    try {
      // the old Android picker doesn't enforce the selection limit
      const assets = response.assets.slice( 0, MAX_PHOTOS );
      const photos = ( await Promise.all( assets.map( readPickedPhoto ) ) )
        .filter( ( photo ): photo is PickedPhoto => photo !== null );
      if ( photos.length === 0 ) {
        throw new Error( "No URI in pick photo response" );
      }
      if ( photos.length === 1 ) {
        await identifySinglePhoto( photos[0] );
        return;
      }
      setImageSelected( false );
      navigation.navigate( "PhotoIdentify", {
        photos,
        skipped: response.assets.length - assets.length,
      } );
    } catch ( e ) {
      logger.error( "gallery photos couldn't be identified:", e );
      showCameraAgain( );
    }
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
