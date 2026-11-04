import React, { useContext, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  TouchableOpacity,
  View,
} from "react-native";

import i18n from "../../../i18n";
import { UserContext } from "../../UserContext";
import { useObservation } from "../../Providers/ObservationProvider";
import {
  buildObservationImage,
  identifyPhoto,
  launchPhotoPicker,
  readPickedPhotos,
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
    const assets = await launchPhotoPicker( );
    if ( !assets ) {
      setIsActive( true );
      return;
    }

    setImageSelected( true );
    try {
      const { photos, skipped } = await readPickedPhotos( assets );
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
        skipped,
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
