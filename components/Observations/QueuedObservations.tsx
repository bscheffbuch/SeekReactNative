// @ts-nocheck
import React, { useState, useCallback, useContext } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { readFile } from "@dr.pogodin/react-native-fs";
import { useFocusEffect } from "@react-navigation/native";

import i18n from "../../i18n";
import { colors } from "../../styles/global";
import { baseTextStyles } from "../../styles/textStyles";
import ScrollWithHeader from "../UIComponents/Screens/ScrollWithHeader";
import StyledText from "../UIComponents/StyledText";
import GreenButton from "../UIComponents/Buttons/GreenButton";
import icons from "../../assets/icons";
import { UserContext } from "../UserContext";
import { formatDateToDisplayShort } from "../../utility/dateHelpers";
import {
  getQueuedObservations,
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
    return <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />;
  }
  return <Image style={styles.thumbnail} source={{ uri: source }} />;
};

const QueuedObservations = ( ) => {
  const { login } = useContext( UserContext );
  const [drafts, setDrafts] = useState<QueuedDraft[]>( [] );
  const [selected, setSelected] = useState<string[]>( [] );
  const [uploading, setUploading] = useState( false );

  const loadDrafts = useCallback( async ( ) => {
    const queued = await getQueuedObservations( );
    const mapped: QueuedDraft[] = queued.map( ( obs ) => {
      const uris = parsePhotoUris( obs );
      return {
        uuid: obs.uuid,
        thumbnailUri: uris[0] || obs.photo?.uri || null,
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
    Alert.alert(
      i18n.t( "queue.delete_title" ),
      i18n.t( "queue.delete_message" ),
      [
        { text: i18n.t( "results.no" ), style: "cancel" },
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
    if ( selected.length < 2 ) {
      return;
    }
    await combineQueuedObservations( selected );
    setSelected( [] );
    loadDrafts( );
  };

  const handleUploadAll = async ( ) => {
    if ( !login ) {
      Alert.alert(
        i18n.t( "queue.login_required_title" ),
        i18n.t( "queue.login_required_message" )
      );
      return;
    }
    setUploading( true );
    const { success, failed } = await uploadAllQueuedObservations( );
    setUploading( false );
    Alert.alert(
      i18n.t( "queue.upload_complete_title" ),
      i18n.t( "queue.upload_complete_message", { success, failed } )
    );
    loadDrafts( );
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
    const date = new Date( observedOn );
    if ( Number.isNaN( date.getTime( ) ) ) {
      return observedOn;
    }
    return formatDateToDisplayShort( date );
  };

  return (
    <ScrollWithHeader header="queue.header">
      <View style={styles.container}>
        {drafts.length === 0 ? (
          <StyledText style={[baseTextStyles.body, styles.empty]}>
            {i18n.t( "queue.empty" )}
          </StyledText>
        ) : (
          <>
            {drafts.map( ( draft ) => {
              const isSelected = selected.includes( draft.uuid );
              return (
                <TouchableOpacity
                  key={draft.uuid}
                  testID={`queuedDraft-${draft.uuid}`}
                  onPress={( ) => toggleSelect( draft.uuid )}
                  style={[styles.row, isSelected && styles.rowSelected]}
                  accessibilityLabel={i18n.t( "queue.select_draft" )}
                  accessible
                >
                  <View style={styles.thumbnailWrapper}>
                    <QueuedThumbnail uri={draft.thumbnailUri} />
                    {draft.photoCount > 1 && (
                      <View style={styles.photoCountBadge}>
                        <StyledText style={styles.photoCountText}>
                          {draft.photoCount}
                        </StyledText>
                      </View>
                    )}
                  </View>
                  <View style={styles.info}>
                    <StyledText style={[baseTextStyles.body, styles.date]}>
                      {formatDate( draft.observedOn )}
                    </StyledText>
                    <StyledText style={[baseTextStyles.bodySmall, styles.location]}>
                      {formatLocation( draft )}
                    </StyledText>
                    {isSelected && (
                      <StyledText style={[baseTextStyles.bodySmall, styles.selectedLabel]}>
                        {i18n.t( "queue.selected" )}
                      </StyledText>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={( ) => handleDelete( draft.uuid )}
                    style={styles.deleteButton}
                    accessibilityLabel={i18n.t( "queue.delete_confirm" )}
                    accessible
                    testID={`deleteDraft-${draft.uuid}`}
                  >
                    <Image source={icons.delete} style={styles.deleteIcon} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            } )}

            <View style={styles.actions}>
              {selected.length >= 2 && (
                <>
                  <GreenButton
                    color={colors.seekTeal}
                    handlePress={handleCombine}
                    text="queue.combine"
                  />
                  <View style={styles.spacer} />
                </>
              )}
              <GreenButton
                color={colors.seekGreen}
                handlePress={handleUploadAll}
                text="queue.upload_all"
                disabled={uploading}
              />
              {!login && (
                <StyledText style={[baseTextStyles.bodySmall, styles.loginHint]}>
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

const styles = StyleSheet.create( {
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: colors.seekForestGreen,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  rowSelected: {
    backgroundColor: "#eef7f0",
  },
  thumbnailWrapper: {
    width: 64,
    height: 64,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    backgroundColor: "#dddddd",
  },
  photoCountBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.seekTeal,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  photoCountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    paddingHorizontal: 14,
  },
  date: {
    color: colors.black,
  },
  location: {
    color: "#666666",
    marginTop: 2,
  },
  selectedLabel: {
    color: colors.seekTeal,
    marginTop: 2,
    fontWeight: "700",
  },
  deleteButton: {
    padding: 6,
  },
  deleteIcon: {
    width: 28,
    height: 28,
  },
  actions: {
    marginTop: 24,
    alignItems: "center",
  },
  spacer: {
    height: 14,
  },
  loginHint: {
    color: "#666666",
    textAlign: "center",
    marginTop: 10,
  },
} );

export default QueuedObservations;
