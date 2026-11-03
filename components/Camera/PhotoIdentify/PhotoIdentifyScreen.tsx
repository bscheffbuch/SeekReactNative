import React, { useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../../../i18n";
import { useTheme } from "../../Providers/ThemeProvider";
import { useObservation } from "../../Providers/ObservationProvider";
import { UserContext } from "../../UserContext";
import { ArrowLeftIcon } from "../../UIComponents/AppIcons";
import { getTaxonCommonName } from "../../../utility/commonNamesHelpers";
import {
  ALL_BRANCH_SCORES,
  MAX_PHOTOS,
  buildObservationImage,
  identifyPhoto,
} from "../../../utility/photoIdentification";
import type { PickedPhoto } from "../../../utility/photoIdentification";
import {
  bestPhotoFor,
  combinePredictions,
  confidentTaxon,
  lineageOf,
} from "../../../utility/combinePredictions";
import type { PhotoPrediction } from "../../../utility/combinePredictions";
import { log } from "../../../react-native-logs.config";

const logger = log.extend( "PhotoIdentifyScreen.tsx" );

type Mode = "same" | "separate";

// undefined: not identified yet; null: the classifier failed on this photo
type PhotoResult = PhotoPrediction[] | null | undefined;

interface Params {
  photos: PickedPhoto[];
  // photos past MAX_PHOTOS the picker returned anyway
  skipped: number;
}

const NO_PHOTOS: PickedPhoto[] = [];

const useCommonNames = ( taxonIds: number[] ) => {
  const [names, setNames] = useState<Record<number, string | null>>( {} );
  const key = taxonIds.join( "," );
  useEffect( ( ) => {
    let current = true;
    // a local lookup per taxon, cheap enough to repeat for the few ids shown
    const ids = key.split( "," ).filter( Boolean ).map( Number );
    Promise.all( ids.map( id => getTaxonCommonName( id ).catch( ( ) => null ) ) ).then( found => {
      if ( current ) {
        setNames( known => {
          const next = { ...known };
          ids.forEach( ( id, i ) => { next[id] = found[i]; } );
          return next;
        } );
      }
    } );
    return ( ) => { current = false; };
  }, [key] );
  return names;
};

// Several gallery photos: identify each on its own, or combine them as one organism.
const PhotoIdentifyScreen = ( ) => {
  const navigation = useNavigation<any>( );
  const { params } = useRoute<any>( );
  const { photos = NO_PHOTOS, skipped = 0 } = ( params || {} ) as Params;
  const { startObservationWithImage } = useObservation( );
  const { login } = useContext( UserContext );
  const { theme } = useTheme( );
  const styles = useMemo( ( ) => makeStyles( theme ), [theme] );

  const [mode, setMode] = useState<Mode>( "same" );
  const [results, setResults] = useState<PhotoResult[]>( ( ) => photos.map( ( ) => undefined ) );
  const [opening, setOpening] = useState( false );

  // one photo at a time: the native side runs one classifier anyway
  useEffect( ( ) => {
    let current = true;
    const run = async ( ) => {
      for ( let i = 0; i < photos.length; i += 1 ) {
        let result: PhotoResult = null;
        try {
          result = await identifyPhoto( photos[i], ALL_BRANCH_SCORES );
        } catch ( e ) {
          logger.error( `photo ${i + 1} couldn't be identified:`, e );
        }
        if ( !current ) {
          return;
        }
        setResults( previous => previous.map( ( r, j ) => ( j === i ? result : r ) ) );
      }
    };
    run( );
    return ( ) => { current = false; };
  }, [photos] );

  const done = results.filter( r => r !== undefined ).length;
  const identifying = done < photos.length;
  const identified = useMemo( ( ) => results
    .map( ( predictions, index ) => ( { predictions, index } ) )
    .filter( ( r ): r is { predictions: PhotoPrediction[]; index: number } => !!r.predictions ), [results] );
  const combined = useMemo(
    ( ) => combinePredictions( identified.map( r => r.predictions ) ),
    [identified]
  );
  const combinedTaxon = identifying ? null : confidentTaxon( combined.predictions );
  const perPhotoTaxa = results.map( r => ( r ? confidentTaxon( r ) : null ) );
  const names = useCommonNames( [
    ...( combinedTaxon ? [combinedTaxon.taxon_id] : [] ),
    ...perPhotoTaxa.filter( Boolean ).map( t => ( t as PhotoPrediction ).taxon_id ),
  ] );

  const openMatch = ( photo: PickedPhoto, predictions: PhotoPrediction[] ) => {
    setOpening( true );
    const image = buildObservationImage( photo, predictions as any, login );
    Promise.resolve( startObservationWithImage( image, ( ) => {
      navigation.navigate( "Match", { origin: "photos" } );
    } ) ).finally( ( ) => setOpening( false ) );
  };

  const openCombinedMatch = ( ) => {
    const best = combinedTaxon
      ? identified[bestPhotoFor( identified.map( r => r.predictions ), combinedTaxon.taxon_id )]
      : identified[0];
    const photo = photos[best?.index ?? 0];
    openMatch( photo, lineageOf( combined.predictions, combinedTaxon ) );
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

  const combinedName = label( combinedTaxon );
  const agreeing = combinedTaxon ? combined.agreement[combinedTaxon.taxon_id] : 0;
  const combinedScore = combinedTaxon ? Math.round( combinedTaxon.combined_score ) : 0;

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
      </View>

      <View accessibilityRole="tablist" style={styles.segments}>
        {renderModeButton( "same", i18n.t( "photo_id.same_species" ) )}
        {renderModeButton( "separate", i18n.t( "photo_id.separately" ) )}
      </View>
      <Text style={styles.hint}>
        {i18n.t( mode === "same" ? "photo_id.same_species_hint" : "photo_id.separately_hint" )}
        {skipped > 0 ? ` ${i18n.t( "photo_id.skipped", { max: MAX_PHOTOS } )}` : ""}
      </Text>

      <ScrollView contentContainerStyle={styles.content}>
        {mode === "same" && (
          <View accessibilityLiveRegion="polite" style={styles.card}>
            {identifying ? (
              <View style={styles.row}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={styles.progress}>
                  {i18n.t( "photo_id.identifying", { done: done + 1, count: photos.length } )}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.row}>
                  <View style={styles.names}>
                    <Text numberOfLines={1} style={styles.common}>{combinedName.primary}</Text>
                    {combinedName.secondary
                      ? <Text numberOfLines={1} style={styles.sci}>{combinedName.secondary}</Text>
                      : null}
                  </View>
                  {combinedTaxon && (
                    <>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${combinedScore}%` }]} />
                      </View>
                      <Text style={styles.pct}>{`${combinedScore}%`}</Text>
                    </>
                  )}
                </View>
                {/* only worth saying when the photos disagree */}
                {combinedTaxon && agreeing < combined.photoCount && (
                  <Text style={styles.agreement}>
                    {i18n.t( "photo_id.agreement", { agree: agreeing, count: combined.photoCount } )}
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        <View style={styles.grid}>
          {photos.map( ( photo, i ) => {
            const result = results[i];
            const taxon = perPhotoTaxa[i];
            const name = result === null ? { primary: i18n.t( "photo_id.failed" ), secondary: null } : label( taxon );
            const disagrees = mode === "same" && combinedTaxon && result
              && !result.some( p => p.taxon_id === combinedTaxon.taxon_id );
            const tappable = mode === "separate" && !!result && !opening;
            return (
              <Pressable
                accessibilityLabel={result === undefined ? undefined : name.primary}
                accessibilityRole={mode === "separate" ? "button" : "image"}
                disabled={!tappable}
                key={photo.uri}
                onPress={( ) => result && openMatch( photo, result )}
                style={styles.tile}
              >
                <Image source={{ uri: photo.uri }} style={[styles.thumb, disagrees && styles.thumbDimmed]} />
                {result === undefined
                  ? <ActivityIndicator color={theme.colors.primary} style={styles.tileSpinner} />
                  : (
                    <Text numberOfLines={2} style={[styles.tileLabel, !taxon && styles.tileLabelMuted]}>
                      {taxon ? `${name.primary} · ${Math.round( taxon.combined_score )}%` : name.primary}
                    </Text>
                  )}
              </Pressable>
            );
          } )}
        </View>
      </ScrollView>

      {mode === "same" && (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: opening, disabled: identifying || opening || identified.length === 0 }}
            disabled={identifying || opening || identified.length === 0}
            onPress={openCombinedMatch}
            style={[styles.filled, ( identifying || identified.length === 0 ) && styles.filledDisabled]}
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
  card: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 44 },
  progress: { color: theme.colors.text, fontFamily: theme.typography.body, fontSize: 15 },
  names: { flex: 1, minWidth: 0 },
  common: { color: theme.colors.text, fontFamily: theme.typography.heading, fontSize: 17, lineHeight: 22 },
  sci: { color: theme.colors.onSurfaceVariant, fontFamily: theme.typography.body, fontSize: 13, fontStyle: "italic" },
  barTrack: { backgroundColor: theme.colors.secondaryContainer, borderRadius: 2, height: 4, overflow: "hidden", width: 72 },
  barFill: { backgroundColor: theme.colors.primary, borderRadius: 2, height: 4 },
  pct: { color: theme.colors.text, fontFamily: theme.typography.heading, fontSize: 14, textAlign: "right", width: 40 },
  agreement: { color: theme.colors.onSurfaceVariant, fontFamily: theme.typography.body, fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { gap: 4, width: "31.5%" },
  thumb: { aspectRatio: 1, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 8, width: "100%" },
  thumbDimmed: { opacity: 0.45 },
  tileSpinner: { left: 0, position: "absolute", right: 0, top: "35%" },
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
