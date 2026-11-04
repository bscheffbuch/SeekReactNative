import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../../../i18n";
import { useTheme } from "../../Providers/ThemeProvider";
import { useObservation } from "../../Providers/ObservationProvider";
import { UserContext } from "../../UserContext";
import { ArrowLeftIcon, ChevronDownIcon, CropIcon, ImageIcon } from "../../UIComponents/AppIcons";
import TaxonChoiceList from "../../UIComponents/TaxonChoiceList";
import { useCommonNames } from "../../../utility/customHooks/useCommonNames";
import {
  ALL_BRANCH_SCORES,
  MAX_PHOTOS,
  buildObservationImage,
  identifyPhoto,
  launchPhotoPicker,
  readPickedPhotos,
  suggestAlternatives,
} from "../../../utility/photoIdentification";
import type { PickedPhoto, PickedPhotos } from "../../../utility/photoIdentification";
import {
  bestPhotoFor,
  combinePredictions,
  confidentTaxon,
  lineageWith,
  taxonChoices,
} from "../../../utility/combinePredictions";
import type { PhotoPrediction } from "../../../utility/combinePredictions";
import type { NormalizedRect } from "../ARCamera/helpers/previewGeometry";
import type { ReframeCrop, ReframeParams } from "../Reframe/ReframeScreen";
import { log } from "../../../react-native-logs.config";

const logger = log.extend( "PhotoIdentifyScreen.tsx" );

type Mode = "same" | "separate";

// branch: the best branch, life down to the top leaf; alternatives: the model's top leaves
interface Identified {
  branch: PhotoPrediction[];
  alternatives: PhotoPrediction[];
}

// undefined: not identified yet; null: the classifier failed on this photo
type PhotoResult = Identified | null | undefined;

// "all" for the combined result, else the photo's index
type Source = "all" | number;

const NO_PHOTOS: PickedPhoto[] = [];

const withoutKeys = <T, >( record: Record<string, T>, keys: string[] ) => {
  const next = { ...record };
  keys.forEach( k => { delete next[k]; } );
  return next;
};

// Gallery photos: identify each on its own, or combine them as one organism. Each photo
// can be cropped to its subject, and the user can pick another of the suggested taxa.
// Opened from the camera with photos already picked, or on its own (it opens the picker).
const PhotoIdentifyScreen = ( ) => {
  const navigation = useNavigation<any>( );
  const { params } = useRoute<any>( );
  const [selection, setSelection] = useState<PickedPhotos>( ( ) => ( {
    photos: params?.photos || NO_PHOTOS,
    skipped: params?.skipped || 0,
  } ) );
  const { photos, skipped } = selection;
  const { startObservationWithImage } = useObservation( );
  const { login } = useContext( UserContext );
  const { theme } = useTheme( );
  const styles = useMemo( ( ) => makeStyles( theme ), [theme] );

  const [mode, setMode] = useState<Mode>( "same" );
  const [results, setResults] = useState<PhotoResult[]>( ( ) => photos.map( ( ) => undefined ) );
  const [crops, setCrops] = useState<Record<number, NormalizedRect>>( {} );
  // taxon the user picked, per source; unset means the confident taxon
  const [chosen, setChosen] = useState<Record<string, number>>( {} );
  const [selectedPhoto, setSelectedPhoto] = useState( 0 );
  const [listOpen, setListOpen] = useState( false );
  const [opening, setOpening] = useState( false );
  const [picking, setPicking] = useState( false );

  const choosePhotos = useCallback( async ( ) => {
    setPicking( true );
    const assets = await launchPhotoPicker( );
    const picked = assets ? await readPickedPhotos( assets ).catch( ( e ) => {
      logger.error( "picked photos couldn't be read:", e );
      return null;
    } ) : null;
    setPicking( false );
    if ( !picked || picked.photos.length === 0 ) {
      // nothing to show when opened without photos
      if ( photos.length === 0 ) {
        navigation.goBack( );
      }
      return;
    }
    setSelection( picked );
  }, [navigation, photos.length] );

  // opened without photos: start with the picker, once
  const pickedOnOpen = useRef( false );
  useEffect( ( ) => {
    if ( !pickedOnOpen.current && photos.length === 0 ) {
      pickedOnOpen.current = true;
      choosePhotos( );
    }
  }, [choosePhotos, photos.length] );

  // One photo at a time through a queue: the native side runs one classifier anyway.
  // A new selection bumps the generation and a new crop the photo's token, so answers
  // for photos or crops that are gone are dropped.
  const queue = useRef<Promise<void>>( Promise.resolve( ) );
  const generation = useRef( 0 );
  const tokens = useRef<number[]>( [] );
  const photosRef = useRef( photos );
  const cropsRef = useRef<Record<number, NormalizedRect>>( {} );

  const identifyAt = useCallback( ( index: number ) => {
    const gen = generation.current;
    tokens.current[index] = ( tokens.current[index] || 0 ) + 1;
    const token = tokens.current[index];
    const stale = ( ) => gen !== generation.current || token !== tokens.current[index];
    setResults( previous => previous.map( ( r, j ) => ( j === index ? undefined : r ) ) );
    queue.current = queue.current.then( async ( ) => {
      if ( stale( ) ) { return; }
      const photo = photosRef.current[index];
      const crop = cropsRef.current[index] ?? null;
      let result: PhotoResult = null;
      try {
        const branch = await identifyPhoto( photo, ALL_BRANCH_SCORES, crop );
        const alternatives = await suggestAlternatives( photo, crop ).catch( ( e ) => {
          logger.error( `no alternatives for photo ${index + 1}:`, e );
          return [];
        } );
        result = { branch, alternatives } as Identified;
      } catch ( e ) {
        logger.error( `photo ${index + 1} couldn't be identified:`, e );
      }
      if ( stale( ) ) { return; }
      setResults( previous => previous.map( ( r, j ) => ( j === index ? result : r ) ) );
      // a new result for this photo invalidates what was picked from the old one
      setChosen( previous => withoutKeys( previous, [String( index ), "all"] ) );
    } );
  }, [] );

  useEffect( ( ) => {
    generation.current += 1;
    tokens.current = [];
    photosRef.current = photos;
    cropsRef.current = {};
    setCrops( {} );
    setChosen( {} );
    setSelectedPhoto( 0 );
    setResults( photos.map( ( ) => undefined ) );
    photos.forEach( ( _, i ) => identifyAt( i ) );
    return ( ) => { generation.current += 1; };
  }, [photos, identifyAt] );

  // a crop handed back from the reframe screen
  const returnedCrop: ReframeCrop | undefined = params?.crop;
  useEffect( ( ) => {
    if ( !returnedCrop ) { return; }
    navigation.setParams( { crop: undefined } );
    const { index, rect } = returnedCrop;
    if ( index < 0 || index >= photosRef.current.length ) { return; }
    const next = { ...cropsRef.current };
    if ( rect ) {
      next[index] = rect;
    } else if ( next[index] ) {
      delete next[index];
    } else {
      // whole photo before and after: nothing changed
      return;
    }
    cropsRef.current = next;
    setCrops( next );
    identifyAt( index );
  }, [returnedCrop, navigation, identifyAt] );

  const openCrop = ( index: number ) => {
    const photo = photos[index];
    const reframe: ReframeParams = {
      image: buildObservationImage( photo, [], login ),
      photoPath: photo.uri.replace( /^file:\/\//, "" ),
      returnTo: "PhotoIdentify",
      photoIndex: index,
      initialRect: crops[index] || null,
    };
    navigation.navigate( "Reframe", reframe );
  };

  const single = photos.length === 1;
  const source: Source = mode === "same" || single ? "all" : selectedPhoto;
  const sourceKey = String( source );
  useEffect( ( ) => setListOpen( false ), [sourceKey] );

  const identified = useMemo( ( ) => results
    .map( ( result, index ) => ( { result, index } ) )
    .filter( ( r ): r is { result: Identified; index: number } => !!r.result ), [results] );
  const combined = useMemo(
    ( ) => combinePredictions( identified.map( r => r.result.branch ) ),
    [identified]
  );
  const combinedAlternatives = useMemo(
    ( ) => combinePredictions( identified.map( r => r.result.alternatives ) ).predictions,
    [identified]
  );

  // what the card shows and the user picks from, for the combined result or one photo
  const view = useMemo( ( ) => {
    if ( source === "all" ) {
      const pending = results.some( r => r === undefined );
      return {
        pending,
        failed: !pending && identified.length === 0,
        branch: combined.predictions,
        choices: pending ? [] : taxonChoices( combined.predictions, combinedAlternatives ),
      };
    }
    const result = results[source];
    return {
      pending: result === undefined,
      failed: result === null,
      branch: result?.branch || [],
      choices: result ? taxonChoices( result.branch, result.alternatives ) : [],
    };
  }, [source, results, identified, combined, combinedAlternatives] );

  const chosenFor = ( key: string, choices: PhotoPrediction[], branch: PhotoPrediction[] ) => {
    const picked = chosen[key];
    const fromList = picked != null ? choices.find( c => c.taxon_id === picked ) : undefined;
    return fromList || confidentTaxon( branch );
  };
  const chosenTaxon = view.pending || view.failed ? null : chosenFor( sourceKey, view.choices, view.branch );

  const perPhotoTaxa = results.map( ( r, i ) => (
    r ? chosenFor( String( i ), taxonChoices( r.branch, r.alternatives ), r.branch ) : null
  ) );
  const names = useCommonNames( [
    ...( chosenTaxon ? [chosenTaxon.taxon_id] : [] ),
    ...perPhotoTaxa.filter( Boolean ).map( t => ( t as PhotoPrediction ).taxon_id ),
  ] );

  const choose = ( choice: PhotoPrediction ) => {
    setChosen( previous => ( { ...previous, [sourceKey]: choice.taxon_id } ) );
    setListOpen( false );
  };

  const openMatch = ( ) => {
    let photoIndex: number;
    if ( source === "all" ) {
      const pools = identified.map( r => [...r.result.branch, ...r.result.alternatives] );
      const best = chosenTaxon ? bestPhotoFor( pools, chosenTaxon.taxon_id ) : 0;
      photoIndex = identified[best]?.index ?? 0;
    } else {
      photoIndex = source;
    }
    const predictions = chosenTaxon ? lineageWith( view.branch, chosenTaxon ) : view.branch;
    const image = buildObservationImage( photos[photoIndex], predictions as any, login );
    setOpening( true );
    Promise.resolve( startObservationWithImage( image, ( ) => {
      navigation.navigate( "Match", { origin: "photos" } );
    }, {
      taxonId: chosenTaxon?.taxon_id,
      suggestions: view.choices as any,
    } ) ).finally( ( ) => setOpening( false ) );
  };

  const label = ( taxon: PhotoPrediction | null ) => {
    if ( !taxon ) {
      return { primary: i18n.t( "photo_id.no_id" ), secondary: null };
    }
    const common = names[taxon.taxon_id];
    return { primary: common || taxon.name, secondary: common ? taxon.name : null };
  };

  const renderModeButton = ( value: Mode, text: string ) => {
    const active = mode === value;
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={( ) => setMode( value )}
        style={[styles.segment, active && styles.segmentActive]}
      >
        <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{text}</Text>
      </Pressable>
    );
  };

  const done = results.filter( r => r !== undefined ).length;
  const chosenName = label( chosenTaxon );
  const chosenScore = chosenTaxon ? Math.round( Math.min( 100, chosenTaxon.combined_score ) ) : 0;
  const agreeing = source === "all" && chosenTaxon ? combined.agreement[chosenTaxon.taxon_id] || 0 : 0;
  const canOpen = !view.pending && !view.failed && !opening;

  const renderCard = ( ) => {
    if ( view.pending ) {
      return (
        <View style={styles.row}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.progress}>
            {source === "all"
              ? i18n.t( "photo_id.identifying", { done: Math.min( done + 1, photos.length ), count: photos.length } )
              : i18n.t( "photo_id.identifying", { done: source + 1, count: photos.length } )}
          </Text>
        </View>
      );
    }
    if ( view.failed ) {
      return <Text style={styles.progress}>{i18n.t( "photo_id.failed" )}</Text>;
    }
    const hasChoices = view.choices.length > 0;
    return (
      <>
        {source !== "all" && (
          <Text style={styles.cardTitle}>{i18n.t( "photo_id.photo_number", { number: source + 1 } )}</Text>
        )}
        <Pressable
          accessibilityHint={hasChoices ? i18n.t( "photo_id.suggested" ) : undefined}
          accessibilityLabel={chosenTaxon ? `${chosenName.primary}, ${chosenScore}%` : chosenName.primary}
          accessibilityRole={hasChoices ? "button" : "text"}
          accessibilityState={hasChoices ? { expanded: listOpen } : undefined}
          disabled={!hasChoices}
          onPress={( ) => setListOpen( open => !open )}
          style={styles.row}
        >
          <View style={styles.names}>
            <Text numberOfLines={1} style={styles.common}>{chosenName.primary}</Text>
            {chosenName.secondary
              ? <Text numberOfLines={1} style={styles.sci}>{chosenName.secondary}</Text>
              : null}
          </View>
          {chosenTaxon && (
            <>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${chosenScore}%` }]} />
              </View>
              <Text style={styles.pct}>{`${chosenScore}%`}</Text>
            </>
          )}
          {hasChoices && (
            <View style={[styles.chevron, listOpen && styles.chevronOpen]}>
              <ChevronDownIcon color={theme.colors.onSurfaceVariant} size={22} strokeWidth={2} />
            </View>
          )}
        </Pressable>
        {/* only worth saying when the photos disagree */}
        {source === "all" && chosenTaxon && agreeing < combined.photoCount && (
          <Text style={styles.agreement}>
            {i18n.t( "photo_id.agreement", { agree: agreeing, count: combined.photoCount } )}
          </Text>
        )}
        {!listOpen && hasChoices && !chosenTaxon && (
          <Text style={styles.agreement}>{i18n.t( "photo_id.choose_species" )}</Text>
        )}
        {listOpen && (
          <View style={styles.dropdown}>
            <Text style={styles.cardTitle}>{i18n.t( "photo_id.suggested" )}</Text>
            <TaxonChoiceList
              choices={view.choices}
              onSelect={choose}
              selectedId={chosenTaxon?.taxon_id}
            />
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={i18n.t( "accessibility.back" )}
          accessibilityRole="button"
          onPress={( ) => navigation.goBack( )}
          style={styles.iconButton}
        >
          <ArrowLeftIcon color={theme.colors.text} size={24} strokeWidth={2} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>{i18n.t( "photo_id.header" )}</Text>
        <Pressable
          accessibilityLabel={i18n.t( "photo_id.choose_photos" )}
          accessibilityRole="button"
          disabled={picking || opening}
          onPress={choosePhotos}
          style={styles.iconButton}
        >
          <ImageIcon color={theme.colors.text} size={24} strokeWidth={2} />
        </Pressable>
      </View>

      {photos.length === 0 && (
        <View style={styles.empty}>
          {picking
            ? <ActivityIndicator color={theme.colors.primary} />
            : (
              <Pressable accessibilityRole="button" onPress={choosePhotos} style={styles.filled}>
                <Text style={styles.filledLabel}>{i18n.t( "photo_id.choose_photos" )}</Text>
              </Pressable>
            )}
        </View>
      )}

      {/* the two views only differ with several photos */}
      {photos.length > 1 && (
        <>
          <View accessibilityRole="tablist" style={styles.segments}>
            {renderModeButton( "same", i18n.t( "photo_id.same_species" ) )}
            {renderModeButton( "separate", i18n.t( "photo_id.separately" ) )}
          </View>
          <Text style={styles.hint}>
            {i18n.t( mode === "same" ? "photo_id.same_species_hint" : "photo_id.separately_hint" )}
            {skipped > 0 ? ` ${i18n.t( "photo_id.skipped", { max: MAX_PHOTOS } )}` : ""}
          </Text>
        </>
      )}

      {photos.length > 0 && (
        <ScrollView contentContainerStyle={styles.content}>
          <View accessibilityLiveRegion="polite" style={styles.card}>
            {renderCard( )}
          </View>

          <View style={styles.grid}>
            {photos.map( ( photo, i ) => {
              const result = results[i];
              const taxon = perPhotoTaxa[i];
              const name = result === null ? { primary: i18n.t( "photo_id.failed" ), secondary: null } : label( taxon );
              const disagrees = source === "all" && chosenTaxon && result
                && ![...result.branch, ...result.alternatives].some( p => p.taxon_id === chosenTaxon.taxon_id );
              const selectable = mode === "separate" && !single;
              const isSelected = selectable && selectedPhoto === i;
              return (
                <View key={photo.uri} style={styles.tile}>
                  <Pressable
                    accessibilityLabel={result === undefined
                      ? i18n.t( "photo_id.photo_number", { number: i + 1 } )
                      : `${i18n.t( "photo_id.photo_number", { number: i + 1 } )}, ${name.primary}`}
                    accessibilityRole={selectable ? "button" : "image"}
                    accessibilityState={selectable ? { selected: isSelected } : undefined}
                    disabled={!selectable}
                    onPress={( ) => setSelectedPhoto( i )}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={[styles.thumb, disagrees && styles.thumbDimmed, isSelected && styles.thumbSelected]}
                    />
                    {result === undefined && <ActivityIndicator color={theme.colors.primary} style={styles.tileSpinner} />}
                    {crops[i] && (
                      <View pointerEvents="none" style={styles.croppedBadge}>
                        <Text style={styles.croppedLabel}>{i18n.t( "photo_id.cropped" )}</Text>
                      </View>
                    )}
                  </Pressable>
                  <Pressable
                    accessibilityLabel={i18n.t( "photo_id.crop", { number: i + 1 } )}
                    accessibilityRole="button"
                    disabled={opening}
                    hitSlop={8}
                    onPress={( ) => openCrop( i )}
                    style={styles.cropButton}
                  >
                    <CropIcon color="#FFFFFF" size={18} strokeWidth={2.2} />
                  </Pressable>
                  {result !== undefined && (
                    <Text numberOfLines={2} style={[styles.tileLabel, !taxon && styles.tileLabelMuted]}>
                      {taxon ? `${name.primary} · ${Math.round( Math.min( 100, taxon.combined_score ) )}%` : name.primary}
                    </Text>
                  )}
                </View>
              );
            } )}
          </View>
        </ScrollView>
      )}

      {photos.length > 0 && (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: opening, disabled: !canOpen }}
            disabled={!canOpen}
            onPress={openMatch}
            style={[styles.filled, !canOpen && !opening && styles.filledDisabled]}
          >
            {opening
              ? <ActivityIndicator color={theme.colors.onPrimary} />
              : <Text style={styles.filledLabel}>{i18n.t( "photo_id.view_match" )}</Text>}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

const makeStyles = ( theme: any ) => StyleSheet.create( {
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: 8, paddingBottom: 8, paddingHorizontal: 12, paddingTop: 12 },
  iconButton: { alignItems: "center", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  title: { color: theme.colors.text, flex: 1, fontFamily: theme.typography.body, fontSize: 22, lineHeight: 28 },
  segments: {
    borderColor: theme.colors.outline,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 16,
    overflow: "hidden",
  },
  segment: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 40 },
  segmentActive: { backgroundColor: theme.colors.secondaryContainer },
  segmentLabel: { color: theme.colors.text, fontFamily: theme.typography.heading, fontSize: 14 },
  segmentLabelActive: { color: theme.colors.onSecondaryContainer },
  hint: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: theme.typography.body,
    fontSize: 13,
    lineHeight: 18,
    marginHorizontal: 16,
    marginTop: 8,
  },
  content: { gap: 16, padding: 16 },
  empty: { alignItems: "stretch", flex: 1, justifyContent: "center", padding: 16 },
  card: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: { color: theme.colors.primary, fontFamily: theme.typography.heading, fontSize: 14, lineHeight: 20 },
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 44 },
  progress: { color: theme.colors.text, fontFamily: theme.typography.body, fontSize: 15 },
  names: { flex: 1, minWidth: 0 },
  common: { color: theme.colors.text, fontFamily: theme.typography.heading, fontSize: 17, lineHeight: 22 },
  sci: { color: theme.colors.onSurfaceVariant, fontFamily: theme.typography.body, fontSize: 13, fontStyle: "italic" },
  barTrack: { backgroundColor: theme.colors.secondaryContainer, borderRadius: 2, height: 4, overflow: "hidden", width: 56 },
  barFill: { backgroundColor: theme.colors.primary, borderRadius: 2, height: 4 },
  pct: { color: theme.colors.text, fontFamily: theme.typography.heading, fontSize: 14, textAlign: "right", width: 40 },
  chevron: { alignItems: "center", height: 24, justifyContent: "center", width: 24 },
  chevronOpen: { transform: [{ rotate: "180deg" }] },
  agreement: { color: theme.colors.onSurfaceVariant, fontFamily: theme.typography.body, fontSize: 13 },
  dropdown: {
    borderTopColor: theme.colors.outlineVariant,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    paddingTop: 10,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { gap: 4, width: "31.5%" },
  thumb: { aspectRatio: 1, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 8, width: "100%" },
  thumbDimmed: { opacity: 0.45 },
  thumbSelected: { borderColor: theme.colors.primary, borderWidth: 3 },
  tileSpinner: { left: 0, position: "absolute", right: 0, top: "40%" },
  cropButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    top: 6,
    width: 32,
  },
  croppedBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 6,
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: "absolute",
  },
  croppedLabel: { color: "#FFFFFF", fontFamily: theme.typography.heading, fontSize: 11 },
  tileLabel: { color: theme.colors.text, fontFamily: theme.typography.body, fontSize: 12, lineHeight: 16 },
  tileLabelMuted: { color: theme.colors.onSurfaceVariant },
  actions: { padding: 16 },
  filled: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    justifyContent: "center",
    minHeight: 56,
  },
  filledDisabled: { opacity: 0.5 },
  filledLabel: { color: theme.colors.onPrimary, fontFamily: theme.typography.heading, fontSize: 16 },
} );

export default PhotoIdentifyScreen;
