// @ts-nocheck
import React, { useState, useCallback, useContext } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { readFile } from "@dr.pogodin/react-native-fs";
import { useFocusEffect } from "@react-navigation/native";

import i18n from "../../i18n";
import { colors } from "../../styles/global";
import { viewStyles, textStyles, imageStyles } from "../../styles/observations/queuedObservations";
import { baseTextStyles } from "../../styles/textStyles";
import ScrollWithHeader from "../UIComponents/Screens/ScrollWithHeader";
import StyledText from "../UIComponents/StyledText";
import GreenButton from "../UIComponents/Buttons/GreenButton";
import icons from "../../assets/icons";
import { UserContext } from "../UserContext";
import { formatDateToDisplayShort } from "../../utility/dateHelpers";
import {
  getQueuedObservations,
  parseObservedOnString,
  parsePhotoUris,
  deleteQueuedObservation,
  combineQueuedObservations,
  uploadAllQueuedObservations,
} from "../../utility/observationQueueHelpers";

interface QueuedDraft {
  uuid: string;
  thumbnailUri: string | null;
  photoCount: number;
  observedOn: string | null;
  latitude: number | null;
  longitude: number | null;
}

// module-scope so the in-flight guard survives component remounts; a second
// concurrent "upload all" run would duplicate photos server-side
let uploadAllInProgress = false;

// Resolves a stored backup photo path to a source RN <Image> can render.
// iOS can read the absolute path directly; Android needs base64.
const QueuedThumbnail = ( { uri }: { uri: string | null } ) => {
  const [source, setSource] = useState<string | null>( null );

  useFocusEffect(
    useCallback( ( ) => {
      let isCurrent = true;
      if ( !uri ) {
        return;
      }
      if ( Platform.OS === "ios" ) {
        if ( isCurrent ) {
          setSource( uri );
        }
      } else {
        readFile( uri, { encoding: "base64" } )
          .then( ( data ) => {
            if ( isCurrent ) {
              setSource( `data:image/jpeg;base64,${data}` );
            }
          } )
          .catch( ( ) => {
            if ( isCurrent ) {
              setSource( uri );
            }
          } );
      }
      return ( ) => {
        isCurrent = false;
      };
    }, [uri] )
  );

  if ( !source ) {
    return <View style={[imageStyles.thumbnail, viewStyles.thumbnailPlaceholder]} />;
  }
  return <Image style={imageStyles.thumbnail} source={{ uri: source }} />;
};

const QueuedObservations = ( ) => {
  const { login } = useContext( UserContext );
  const [drafts, setDrafts] = useState<QueuedDraft[]>( [] );
  const [selected, setSelected] = useState<string[]>( [] );
  const [uploading, setUploading] = useState( uploadAllInProgress );

  const loadDrafts = useCallback( async ( ) => {
    const queued = await getQueuedObservations( );
    const mapped: QueuedDraft[] = queued.map( ( obs ) => {
      const uris = parsePhotoUris( obs );
      return {
        uuid: obs.uuid,
        // photo.uri holds the small display copy; photoUris holds the
        // high-resolution copies reserved for upload
        thumbnailUri: obs.photo?.uri || uris[0] || null,
        photoCount: uris.length || 1,
        observedOn: obs.observed_on_string || null,
        latitude: obs.latitude ?? null,
        longitude: obs.longitude ?? null,
      };
    } );
    setDrafts( mapped );
    // drop any selections that no longer exist
    setSelected( ( prev ) => prev.filter( uuid => mapped.some( d => d.uuid === uuid ) ) );
  }, [] );

  useFocusEffect(
    useCallback( ( ) => {
      loadDrafts( );
    }, [loadDrafts] )
  );

  const toggleSelect = ( uuid: string ) => {
    setSelected( ( prev ) => (
      prev.includes( uuid )
        ? prev.filter( id => id !== uuid )
        : [...prev, uuid]
    ) );
  };

  const handleDelete = ( uuid: string ) => {
    if ( uploading || uploadAllInProgress ) {
      // deleting a draft mid-upload would pull realm objects out from under
      // the in-flight upload
      return;
    }
    Alert.alert(
      i18n.t( "queue.delete_title" ),
      i18n.t( "queue.delete_message" ),
      [
        { text: i18n.t( "delete.no" ), style: "cancel" },
        {
          text: i18n.t( "queue.delete_confirm" ),
          style: "destructive",
          onPress: async ( ) => {
            await deleteQueuedObservation( uuid );
            loadDrafts( );
          },
        },
      ]
    );
  };

  const handleCombine = async ( ) => {
    if ( selected.length < 2 || uploading || uploadAllInProgress ) {
      return;
    }
    await combineQueuedObservations( selected );
    setSelected( [] );
    loadDrafts( );
  };

  const handleUploadAll = async ( ) => {
    if ( uploadAllInProgress ) {
      return;
    }
    if ( !login ) {
      Alert.alert(
        i18n.t( "queue.login_required_title" ),
        i18n.t( "queue.login_required_message" )
      );
      return;
    }
    uploadAllInProgress = true;
    setUploading( true );
    try {
      const { success, failed } = await uploadAllQueuedObservations( );
      Alert.alert(
        i18n.t( "queue.upload_complete_title" ),
        i18n.t( "queue.upload_complete_message", { success, failed } )
      );
    } finally {
      uploadAllInProgress = false;
      setUploading( false );
      loadDrafts( );
    }
  };

  const formatLocation = ( draft: QueuedDraft ): string => {
    if ( draft.latitude != null && draft.longitude != null ) {
      return `${draft.latitude.toFixed( 4 )}, ${draft.longitude.toFixed( 4 )}`;
    }
    return i18n.t( "queue.no_location" );
  };

  const formatDate = ( observedOn: string | null ): string => {
    if ( !observedOn ) {
      return "";
    }
    const date = parseObservedOnString( observedOn );
    if ( !date ) {
      return observedOn;
    }
    return formatDateToDisplayShort( date );
  };

  return (
    <ScrollWithHeader header="queue.header">
      <View style={viewStyles.container}>
        {drafts.length === 0 ? (
          <StyledText style={[baseTextStyles.body, textStyles.empty]}>
            {i18n.t( "queue.empty" )}
          </StyledText>
        ) : (
          <>
            {drafts.map( ( draft ) => {
              const isSelected = selected.includes( draft.uuid );
              return (
                <View
                  key={draft.uuid}
                  style={[viewStyles.row, isSelected && viewStyles.rowSelected]}
                >
                  <TouchableOpacity
                    testID={`queuedDraft-${draft.uuid}`}
                    onPress={( ) => toggleSelect( draft.uuid )}
                    style={viewStyles.rowPressable}
                    accessibilityLabel={i18n.t( "queue.select_draft" )}
                    accessible
                  >
                    <View style={viewStyles.thumbnailWrapper}>
                      <QueuedThumbnail uri={draft.thumbnailUri} />
                      {draft.photoCount > 1 && (
                        <View style={viewStyles.photoCountBadge}>
                          <StyledText style={textStyles.photoCountText}>
                            {draft.photoCount}
                          </StyledText>
                        </View>
                      )}
                    </View>
                    <View style={viewStyles.info}>
                      <StyledText style={[baseTextStyles.body, textStyles.date]}>
                        {formatDate( draft.observedOn )}
                      </StyledText>
                      <StyledText style={[baseTextStyles.bodySmall, textStyles.location]}>
                        {formatLocation( draft )}
                      </StyledText>
                      {isSelected && (
                        <StyledText style={[baseTextStyles.bodySmall, textStyles.selectedLabel]}>
                          {i18n.t( "queue.selected" )}
                        </StyledText>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={( ) => handleDelete( draft.uuid )}
                    style={viewStyles.deleteButton}
                    accessibilityLabel={i18n.t( "queue.delete_confirm" )}
                    accessible
                    disabled={uploading}
                    testID={`deleteDraft-${draft.uuid}`}
                  >
                    <Image source={icons.delete} style={imageStyles.deleteIcon} />
                  </TouchableOpacity>
                </View>
              );
            } )}

            <View style={viewStyles.actions}>
              {selected.length >= 2 && (
                <>
                  <GreenButton
                    color={colors.seekTeal}
                    handlePress={handleCombine}
                    text="queue.combine"
                  />
                  <View style={viewStyles.spacer} />
                </>
              )}
              <GreenButton
                color={colors.seekGreen}
                handlePress={handleUploadAll}
                text="queue.upload_all"
                disabled={uploading}
              />
              {!login && (
                <StyledText style={[baseTextStyles.bodySmall, textStyles.loginHint]}>
                  {i18n.t( "queue.login_hint" )}
                </StyledText>
              )}
            </View>
          </>
        )}
      </View>
    </ScrollWithHeader>
  );
};

export default QueuedObservations;
