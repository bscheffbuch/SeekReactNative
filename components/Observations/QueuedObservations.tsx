// @ts-nocheck
import React, { useState, useCallback, useContext, useMemo } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { readFile } from "@dr.pogodin/react-native-fs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import i18n from "../../i18n";
import { colors } from "../../styles/global";
import { baseTextStyles } from "../../styles/textStyles";
import ScrollWithHeader from "../UIComponents/Screens/ScrollWithHeader";
import StyledText from "../UIComponents/StyledText";
import GreenButton from "../UIComponents/Buttons/GreenButton";
import { UserContext } from "../UserContext";
import { useObservation } from "../Providers/ObservationProvider";
import { formatDateToDisplayShort } from "../../utility/dateHelpers";
import { CheckIcon, ChevronRightIcon, TrashIcon } from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";
import {
  getQueuedObservations,
  parsePhotoUris,
  parsePredictions,
  parseObservedOnString,
  representativePrediction,
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
  speciesName: string | null;
  predictions: any[];
}

const thumbnailSourceCache = new Map<string, string>();

// Resolves a stored backup photo path to a source RN <Image> can render.
// iOS can read the absolute path directly; Android needs base64.
const QueuedThumbnail = ( { uri }: { uri: string | null } ) => {
  const [source, setSource] = useState<string | null>( null );
  const { theme } = useTheme( );

  useFocusEffect(
    useCallback( ( ) => {
      let isCurrent = true;
      if ( !uri ) {
        setSource( null );
        return;
      }
      const cachedSource = thumbnailSourceCache.get( uri );
      if ( cachedSource ) {
        setSource( cachedSource );
        return;
      }
      setSource( null );
      if ( Platform.OS === "ios" ) {
        if ( isCurrent ) {
          thumbnailSourceCache.set( uri, uri );
          setSource( uri );
        }
      } else {
        readFile( uri, { encoding: "base64" } )
          .then( ( data ) => {
            if ( isCurrent ) {
              const base64Source = `data:image/jpeg;base64,${data}`;
              thumbnailSourceCache.set( uri, base64Source );
              setSource( base64Source );
            }
          } )
          .catch( ( ) => {
            if ( isCurrent ) {
              thumbnailSourceCache.set( uri, uri );
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
    return (
      <View
        style={[
          styles.thumbnail,
          styles.thumbnailPlaceholder,
          { backgroundColor: theme.colors.elevatedSurface },
        ]}
      />
    );
  }
  return <Image style={styles.thumbnail} source={{ uri: source }} />;
};

// module-scope so the in-flight guard survives component remounts; a second
// concurrent "upload all" run would duplicate photos server-side
let uploadAllInProgress = false;

const QueuedObservations = ( ) => {
  const { login } = useContext( UserContext );
  const { theme } = useTheme( );
  const { startObservationWithImage } = useObservation( );
  const navigation = useNavigation( );
  const [drafts, setDrafts] = useState<QueuedDraft[]>( [] );
  const [selected, setSelected] = useState<string[]>( [] );
  const [selectMode, setSelectMode] = useState( false );
  const [uploading, setUploading] = useState( uploadAllInProgress );

  const loadDrafts = useCallback( async ( ) => {
    const queued = await getQueuedObservations( );
    const mapped: QueuedDraft[] = queued.map( ( obs ) => {
      const uris = parsePhotoUris( obs );
      const predictions = parsePredictions( obs );
      const top = representativePrediction( predictions );
      return {
        uuid: obs.uuid,
        // photo.uri holds the small display copy; photoUris holds the
        // high-resolution copies reserved for upload
        thumbnailUri: obs.photo?.uri || uris[0] || null,
        photoCount: uris.length || 1,
        observedOn: obs.observed_on_string || null,
        latitude: obs.latitude ?? null,
        longitude: obs.longitude ?? null,
        speciesName: top?.name || null,
        predictions,
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

  // Long-press enters multi-select mode (for combine / bulk actions) and
  // selects the pressed row.
  const enterSelectMode = ( uuid: string ) => {
    setSelectMode( true );
    setSelected( ( prev ) => ( prev.includes( uuid ) ? prev : [...prev, uuid] ) );
  };

  const exitSelectMode = ( ) => {
    setSelectMode( false );
    setSelected( [] );
  };

  // Reconstruct the AR-camera observation from the stored draft and open the
  // identification (Match) screen for it.
  const openIdentification = ( draft: QueuedDraft ) => {
    if ( !draft.thumbnailUri ) {
      return;
    }
    const time = draft.observedOn ? Date.parse( draft.observedOn ) : Date.now( );
    const image = {
      predictions: draft.predictions || [],
      errorCode: 0,
      latitude: draft.latitude,
      longitude: draft.longitude,
      arCamera: true,
      uri: draft.thumbnailUri,
      time: Number.isNaN( time ) ? Date.now( ) : time,
    };
    startObservationWithImage( image, ( ) => {
      navigation.navigate( "Match", { origin: "queue" } );
    } );
  };

  const handleRowPress = ( draft: QueuedDraft ) => {
    if ( selectMode ) {
      toggleSelect( draft.uuid );
      return;
    }
    openIdentification( draft );
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
    setSelectMode( false );
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
    if ( uploadAllInProgress ) {
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
    // Hermes can't reliably parse the GMT-weekday format stored in
    // observed_on_string; parseObservedOnString knows the exact pattern
    const date = parseObservedOnString( observedOn );
    if ( !date ) {
      return observedOn;
    }
    return formatDateToDisplayShort( date );
  };
  const themedStyles = useMemo( () => StyleSheet.create( {
    container: {
      backgroundColor: theme.colors.canvas,
    },
    empty: {
      color: theme.colors.muted,
    },
    row: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    rowSelected: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    selectBarText: {
      color: theme.colors.text,
    },
    selectBarDone: {
      color: theme.colors.primary,
    },
    checkbox: {
      borderColor: theme.colors.primary,
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
    },
    photoCountBadge: {
      backgroundColor: theme.colors.primary,
    },
    species: {
      color: theme.colors.text,
    },
    meta: {
      color: theme.colors.muted,
    },
    loginHint: {
      color: theme.colors.muted,
    },
  } ), [theme] );

  return (
    <ScrollWithHeader header="queue.header">
      <View style={[styles.container, themedStyles.container]}>
        {drafts.length === 0 ? (
          <StyledText style={[baseTextStyles.body, styles.empty, themedStyles.empty]}>
            {i18n.t( "queue.empty" )}
          </StyledText>
        ) : (
          <>
            {selectMode && (
              <View style={styles.selectBar}>
                <StyledText style={[baseTextStyles.bodySmall, styles.selectBarText, themedStyles.selectBarText]}>
                  {i18n.t( "queue.selected" )}: {selected.length}
                </StyledText>
                <TouchableOpacity onPress={exitSelectMode} accessible>
                  <StyledText style={[baseTextStyles.bodySmall, styles.selectBarDone, themedStyles.selectBarDone]}>
                    {i18n.t( "queue.done" )}
                  </StyledText>
                </TouchableOpacity>
              </View>
            )}
            {drafts.map( ( draft ) => {
              const isSelected = selected.includes( draft.uuid );
              return (
                <TouchableOpacity
                  key={draft.uuid}
                  testID={`queuedDraft-${draft.uuid}`}
                  onPress={( ) => handleRowPress( draft )}
                  onLongPress={( ) => enterSelectMode( draft.uuid )}
                  delayLongPress={300}
                  style={[
                    styles.row,
                    themedStyles.row,
                    isSelected && styles.rowSelected,
                    isSelected && themedStyles.rowSelected,
                  ]}
                  accessibilityLabel={
                    selectMode
                      ? i18n.t( "queue.select_draft" )
                      : i18n.t( "queue.open_id" )
                  }
                  accessible
                >
                  {selectMode && (
                    <View style={[
                      styles.checkbox,
                      themedStyles.checkbox,
                      isSelected && styles.checkboxChecked,
                      isSelected && themedStyles.checkboxChecked,
                    ]}>
                      {isSelected && (
                        <CheckIcon color={theme.colors.inverseText} size={15} strokeWidth={3} />
                      )}
                    </View>
                  )}
                  <View style={styles.thumbnailWrapper}>
                    <QueuedThumbnail uri={draft.thumbnailUri} />
                    {draft.photoCount > 1 && (
                      <View style={[styles.photoCountBadge, themedStyles.photoCountBadge]}>
                        <StyledText style={styles.photoCountText}>
                          {draft.photoCount}
                        </StyledText>
                      </View>
                    )}
                  </View>
                  <View style={styles.info}>
                    <StyledText
                      style={[baseTextStyles.body, styles.species, themedStyles.species]}
                      numberOfLines={1}
                    >
                      {draft.speciesName || i18n.t( "queue.unidentified" )}
                    </StyledText>
                    <StyledText style={[baseTextStyles.bodySmall, styles.date, themedStyles.meta]}>
                      {formatDate( draft.observedOn )}
                    </StyledText>
                    <StyledText style={[baseTextStyles.bodySmall, styles.location, themedStyles.meta]}>
                      {formatLocation( draft )}
                    </StyledText>
                  </View>
                  {selectMode ? null : (
                    <View style={styles.rowActions}>
                      <ChevronRightIcon color={theme.colors.muted} size={22} strokeWidth={2.2} />
                      <TouchableOpacity
                        onPress={( ) => handleDelete( draft.uuid )}
                        style={styles.deleteButton}
                        accessibilityLabel={i18n.t( "queue.delete_confirm" )}
                        accessible
                        testID={`deleteDraft-${draft.uuid}`}
                      >
                        <TrashIcon color={theme.colors.destructive} size={24} strokeWidth={2.2} />
                      </TouchableOpacity>
                    </View>
                  )}
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
                <StyledText style={[baseTextStyles.bodySmall, styles.loginHint, themedStyles.loginHint]}>
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
    color: colors.seekDeepGreen,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: "#f6f7f5",
    borderWidth: 1,
    borderColor: "#ececec",
  },
  rowSelected: {
    backgroundColor: "#eaf6ee",
    borderColor: colors.seekGreen,
  },
  selectBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  selectBarText: {
    color: colors.seekDeepGreen,
    fontWeight: "700",
  },
  selectBarDone: {
    color: colors.seekTeal,
    fontWeight: "700",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.seekTeal,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: colors.seekTeal,
  },
  thumbnailWrapper: {
    width: 64,
    height: 64,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
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
  species: {
    color: colors.black,
    fontWeight: "700",
    fontSize: 16,
  },
  date: {
    color: "#6b6b6b",
    marginTop: 3,
  },
  location: {
    color: "#6b6b6b",
    marginTop: 1,
  },
  selectedLabel: {
    color: colors.seekTeal,
    marginTop: 2,
    fontWeight: "700",
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
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
