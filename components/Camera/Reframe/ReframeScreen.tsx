import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { StackActions, useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../../../i18n";
import { useTheme } from "../../Providers/ThemeProvider";
import { useObservation } from "../../Providers/ObservationProvider";
import type { ObservationImage } from "../../Providers/ObservationProvider";
import { ArrowLeftIcon } from "../../UIComponents/AppIcons";
import { getActiveModelPack } from "../../../utility/modelPacks";
import { getTaxonCommonName } from "../../../utility/commonNamesHelpers";
import InatVision from "../ARCamera/helpers/visionPluginWrapper";
import { detectPhotoSubjects } from "../ARCamera/helpers/subjectDetection";
import type { NormalizedRect } from "../ARCamera/helpers/previewGeometry";
import {
  applyDrag,
  containRect,
  DEFAULT_SUBJECT,
  hitTestBox,
  usableSubjects,
} from "./reframeGeometry";
import type { DragMode } from "./reframeGeometry";

export interface ReframeParams {
  // the observation image as the camera / gallery prepared it (predictions are replaced here)
  image: ObservationImage;
  // a local file of the photo the native side can read (the capture, not a content:// uri)
  photoPath: string;
  // pick mode: only choose the crop and hand it back to the photo identification screen
  returnTo?: "PhotoIdentify";
  photoIndex?: number;
  // the crop chosen before, shown as the first box
  initialRect?: NormalizedRect | null;
}

// what pick mode hands back; rect null means the whole photo
export interface ReframeCrop {
  index: number;
  rect: NormalizedRect | null;
}

interface Suggestion {
  taxonId: number;
  scientificName: string;
  commonName: string | null;
  score: number;
}

const SUGGEST_DEBOUNCE_MS = 350;
const DIM = "rgba(0, 0, 0, 0.38)";

const asFileUri = ( path: string ) => ( path.startsWith( "file://" ) || path.includes( "://" ) ? path : `file://${path}` );

const predictCrop = async (
  image: ObservationImage,
  photoPath: string,
  rect: NormalizedRect,
  commonAncestor: boolean
) => {
  const pack = await getActiveModelPack( );
  const hasLocation = image.latitude != null && image.longitude != null && pack.geomodelPath != null;
  return InatVision.getPredictionsForImage( {
    version: pack.version,
    uri: photoPath.replace( /^file:\/\//, "" ),
    modelPath: pack.modelPath,
    taxonomyPath: pack.taxonomyPath,
    useGeomodel: hasLocation,
    geomodelPath: pack.geomodelPath ?? undefined,
    location: hasLocation
      ? { latitude: image.latitude as number, longitude: image.longitude as number }
      : undefined,
    cropRect: rect,
    ...( commonAncestor ? { mode: InatVision.MODE.COMMON_ANCESTOR } : {} ),
  } );
};

// Design "Reframe after the photo": pick / adjust the subject box, suggestions follow it,
// then identify that crop (the full photo is still what gets saved).
const ReframeScreen = ( ) => {
  const navigation = useNavigation<any>( );
  const { params } = useRoute<any>( );
  const {
    image,
    photoPath,
    returnTo,
    photoIndex = 0,
    initialRect,
  } = ( params || {} ) as ReframeParams;
  const picking = returnTo === "PhotoIdentify";
  const { startObservationWithImage } = useObservation( );
  const { theme } = useTheme( );
  const styles = useMemo( ( ) => makeStyles( theme ), [theme] );

  const displayUri = asFileUri( photoPath );
  const [photoSize, setPhotoSize] = useState( { width: 0, height: 0 } );
  const [stage, setStage] = useState( { width: 0, height: 0 } );
  const [detected, setDetected] = useState<NormalizedRect[] | null>( null );
  const [boxes, setBoxes] = useState<NormalizedRect[]>( [initialRect || DEFAULT_SUBJECT] );
  const [selected, setSelected] = useState( 0 );
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>( null );
  const [busy, setBusy] = useState( false );

  useEffect( ( ) => {
    Image.getSize( displayUri, ( width, height ) => setPhotoSize( { width, height } ), ( ) => null );
  }, [displayUri] );

  // detected subjects (largest first) become the boxes; none -> centre box
  useEffect( ( ) => {
    let current = true;
    detectPhotoSubjects( photoPath ).then( subjects => {
      if ( !current ) { return; }
      const found = usableSubjects( subjects.map( s => s.box ) );
      setDetected( found );
      // a crop chosen before stays selected; the detected subjects come after it
      setBoxes( initialRect ? [initialRect, ...found] : found.length > 0 ? found : [DEFAULT_SUBJECT] );
      setSelected( 0 );
    } );
    return ( ) => { current = false; };
  }, [photoPath, initialRect] );

  const rect = boxes[selected] ?? DEFAULT_SUBJECT;

  // suggestions follow the selected box (debounced; stale answers are dropped)
  const requestId = useRef( 0 );
  useEffect( ( ) => {
    const id = ++requestId.current;
    const timer = setTimeout( async ( ) => {
      try {
        const result = await predictCrop( image, photoPath, rect, true );
        const top = ( result?.predictions || [] ).slice( 0, 3 );
        const named = await Promise.all( top.map( async p => ( {
          taxonId: p.taxon_id,
          scientificName: p.name,
          commonName: await getTaxonCommonName( p.taxon_id ).catch( ( ) => null ),
          score: Math.round( p.combined_score ?? p.score ?? 0 ),
        } ) ) );
        if ( id === requestId.current ) {
          setSuggestions( named );
        }
      } catch {
        if ( id === requestId.current ) {
          setSuggestions( [] );
        }
      }
    }, SUGGEST_DEBOUNCE_MS );
    return ( ) => clearTimeout( timer );
  }, [image, photoPath, rect] );

  const fit = containRect( photoSize.width, photoSize.height, stage.width, stage.height );
  const toPx = useCallback( ( r: NormalizedRect ) => ( {
    x: fit.x + ( r.left * fit.width ),
    y: fit.y + ( r.top * fit.height ),
    width: r.width * fit.width,
    height: r.height * fit.height,
  } ), [fit.x, fit.y, fit.width, fit.height] );

  // one pan for the selected box: corners / edges resize, inside moves
  const drag = useRef<{ mode: DragMode; start: NormalizedRect }>( { mode: null, start: rect } );
  const pan = useMemo( ( ) => Gesture.Pan( )
    .runOnJS( true )
    .minDistance( 2 )
    .onStart( event => {
      drag.current = { mode: hitTestBox( toPx( rect ), event.x, event.y ), start: rect };
    } )
    .onUpdate( event => {
      const { mode, start } = drag.current;
      if ( !mode || fit.width <= 0 || fit.height <= 0 ) {
        return;
      }
      const next = applyDrag( start, mode, event.translationX / fit.width, event.translationY / fit.height );
      setBoxes( current => current.map( ( b, i ) => ( i === selected ? next : b ) ) );
    } ), [rect, selected, toPx, fit.width, fit.height] );
  // tap another box to switch to it
  const tap = useMemo( ( ) => Gesture.Tap( )
    .runOnJS( true )
    .onEnd( event => {
      const hit = boxes.findIndex( ( b, i ) => i !== selected && hitTestBox( toPx( b ), event.x, event.y, 0 ) !== null );
      if ( hit >= 0 ) {
        setSelected( hit );
      }
    } ), [boxes, selected, toPx] );

  const reset = ( ) => {
    setBoxes( detected && detected.length > 0 ? detected : [DEFAULT_SUBJECT] );
    setSelected( 0 );
  };

  const returnCrop = ( cropRect: NormalizedRect | null ) => {
    const crop: ReframeCrop = { index: photoIndex, rect: cropRect };
    navigation.popTo( "PhotoIdentify", { crop }, { merge: true } );
  };

  const applyCrop = async ( ) => {
    if ( picking ) {
      returnCrop( rect );
      return;
    }
    setBusy( true );
    try {
      const result = await predictCrop( image, photoPath, rect, false );
      startObservationWithImage( { ...image, predictions: result?.predictions || [] }, ( ) => {
        navigation.dispatch( StackActions.replace( "Match", { origin: "camera" } ) );
      } );
    } catch {
      // the crop could not be classified: keep what the camera / gallery had
      startObservationWithImage( image, ( ) => {
        navigation.dispatch( StackActions.replace( "Match", { origin: "camera" } ) );
      } );
    }
  };

  const onStageLayout = ( e: LayoutChangeEvent ) => {
    const { width, height } = e.nativeEvent.layout;
    setStage( { width, height } );
  };

  const sel = toPx( rect );
  const multiple = boxes.length > 1;
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
        <Text accessibilityRole="header" style={styles.title}>{i18n.t( "reframe.title" )}</Text>
        <Pressable accessibilityRole="button" onPress={reset} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>{i18n.t( "reframe.reset" )}</Text>
        </Pressable>
      </View>

      <GestureDetector gesture={Gesture.Exclusive( pan, tap )}>
        <View onLayout={onStageLayout} style={styles.stage}>
          {photoSize.width > 0 && (
            <Image
              source={{ uri: displayUri }}
              style={[styles.photo, { left: fit.x, top: fit.y, width: fit.width, height: fit.height }]}
            />
          )}
          {fit.width > 0 && (
            <>
              {/* dim everything outside the selected box */}
              <View pointerEvents="none" style={[styles.dim, styles.dimTop, { height: sel.y }]} />
              <View pointerEvents="none" style={[styles.dim, styles.dimBottom, { top: sel.y + sel.height }]} />
              <View pointerEvents="none" style={[styles.dim, styles.dimLeft, { top: sel.y, width: sel.x, height: sel.height }]} />
              <View
                pointerEvents="none"
                style={[styles.dim, styles.dimRight, { left: sel.x + sel.width, top: sel.y, height: sel.height }]}
              />
              {boxes.map( ( b, i ) => {
                if ( i === selected ) { return null; }
                const p = toPx( b );
                return (
                  <View
                    accessibilityLabel={i18n.t( "reframe.subject_label", { number: i + 1 } )}
                    key={`box-${i}`}
                    pointerEvents="none"
                    style={[styles.otherBox, { left: p.x, top: p.y, width: p.width, height: p.height }]}
                  />
                );
              } )}
              <View
                accessibilityLabel={`${i18n.t( "reframe.subject_label", { number: selected + 1 } )}, ${i18n.t( "reframe.selected" )}`}
                pointerEvents="none"
                style={[styles.selectedBox, { left: sel.x, top: sel.y, width: sel.width, height: sel.height }]}
              >
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
                <View style={[styles.edgeH, styles.edgeTop]} />
                <View style={[styles.edgeH, styles.edgeBottom]} />
                <View style={[styles.edgeV, styles.edgeLeft]} />
                <View style={[styles.edgeV, styles.edgeRight]} />
              </View>
            </>
          )}
          <Text style={styles.hint}>
            {detected && detected.length === 0
              ? i18n.t( "reframe.no_subject" )
              : i18n.t( multiple ? "reframe.hint" : "reframe.hint_single" )}
          </Text>
        </View>
      </GestureDetector>

      <View accessibilityLiveRegion="polite" style={styles.card}>
        <Text style={styles.cardTitle}>{i18n.t( "reframe.live" )}</Text>
        {suggestions === null ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loading} />
        ) : suggestions.length === 0 ? (
          <Text style={styles.empty}>{i18n.t( "reframe.no_match" )}</Text>
        ) : suggestions.map( s => (
          <View key={s.taxonId} style={styles.row}>
            <View style={styles.names}>
              <Text numberOfLines={1} style={styles.common}>{s.commonName || s.scientificName}</Text>
              {s.commonName ? <Text numberOfLines={1} style={styles.sci}>{s.scientificName}</Text> : null}
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.min( 100, Math.max( 0, s.score ) )}%` }]} />
            </View>
            <Text style={styles.pct}>{`${s.score}%`}</Text>
          </View>
        ) )}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={( ) => ( picking ? returnCrop( null ) : navigation.goBack( ) )}
          style={styles.outlined}
        >
          <Text style={styles.outlinedLabel}>{i18n.t( picking ? "reframe.whole_photo" : "reframe.retake" )}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy }}
          disabled={busy}
          onPress={applyCrop}
          style={styles.filled}
        >
          {busy
            ? <ActivityIndicator color={theme.colors.onPrimary} />
            : <Text style={styles.filledLabel}>{i18n.t( "reframe.use" )}</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const HANDLE = 5;
const makeStyles = ( theme: any ) => StyleSheet.create( {
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: 8, paddingBottom: 8, paddingHorizontal: 12, paddingTop: 12 },
  iconButton: { alignItems: "center", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  title: { color: theme.colors.text, flex: 1, fontFamily: theme.typography.body, fontSize: 22, lineHeight: 28 },
  textButton: { borderRadius: 20, justifyContent: "center", minHeight: 40, paddingHorizontal: 12 },
  textButtonLabel: { color: theme.colors.primary, fontFamily: theme.typography.heading, fontSize: 15 },
  stage: {
    backgroundColor: "#0F1511",
    borderCurve: "continuous",
    borderRadius: 28,
    flex: 1,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  photo: { position: "absolute" },
  dim: { backgroundColor: DIM, position: "absolute" },
  dimTop: { left: 0, right: 0, top: 0 },
  dimBottom: { bottom: 0, left: 0, right: 0 },
  dimLeft: { left: 0 },
  dimRight: { right: 0 },
  otherBox: {
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 10,
    borderStyle: "dashed",
    borderWidth: 2,
    position: "absolute",
  },
  selectedBox: {
    borderColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 14,
    borderWidth: 1.5,
    position: "absolute",
  },
  corner: { borderColor: "#FFFFFF", height: 26, position: "absolute", width: 26 },
  tl: { borderLeftWidth: HANDLE, borderTopLeftRadius: 12, borderTopWidth: HANDLE, left: -HANDLE, top: -HANDLE },
  tr: { borderRightWidth: HANDLE, borderTopRightRadius: 12, borderTopWidth: HANDLE, right: -HANDLE, top: -HANDLE },
  bl: { borderBottomLeftRadius: 12, borderBottomWidth: HANDLE, borderLeftWidth: HANDLE, bottom: -HANDLE, left: -HANDLE },
  br: { borderBottomRightRadius: 12, borderBottomWidth: HANDLE, borderRightWidth: HANDLE, bottom: -HANDLE, right: -HANDLE },
  edgeH: { alignSelf: "center", backgroundColor: "#FFFFFF", borderRadius: 3, height: HANDLE, position: "absolute", width: 24 },
  edgeTop: { top: -HANDLE },
  edgeBottom: { bottom: -HANDLE },
  edgeV: { backgroundColor: "#FFFFFF", borderRadius: 3, height: 24, position: "absolute", top: "50%", marginTop: -12, width: HANDLE },
  edgeLeft: { left: -HANDLE },
  edgeRight: { right: -HANDLE },
  hint: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 8,
    bottom: 12,
    color: "#FFFFFF",
    fontFamily: theme.typography.heading,
    fontSize: 12,
    left: 12,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    right: 12,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: { color: theme.colors.primary, fontFamily: theme.typography.heading, fontSize: 14, lineHeight: 20 },
  loading: { minHeight: 44 },
  empty: { color: theme.colors.onSurfaceVariant, fontFamily: theme.typography.body, fontSize: 14, minHeight: 44 },
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 44 },
  names: { flex: 1, minWidth: 0 },
  common: { color: theme.colors.text, fontFamily: theme.typography.heading, fontSize: 16, lineHeight: 20 },
  sci: { color: theme.colors.onSurfaceVariant, fontFamily: theme.typography.body, fontSize: 13, fontStyle: "italic" },
  barTrack: { backgroundColor: theme.colors.secondaryContainer, borderRadius: 2, height: 4, overflow: "hidden", width: 72 },
  barFill: { backgroundColor: theme.colors.primary, borderRadius: 2, height: 4 },
  pct: { color: theme.colors.text, fontFamily: theme.typography.heading, fontSize: 14, textAlign: "right", width: 40 },
  actions: { flexDirection: "row", gap: 10, padding: 16 },
  outlined: {
    alignItems: "center",
    borderColor: theme.colors.outline,
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
  },
  outlinedLabel: { color: theme.colors.primary, fontFamily: theme.typography.heading, fontSize: 16 },
  filled: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    flex: 2,
    justifyContent: "center",
    minHeight: 56,
  },
  filledLabel: { color: theme.colors.onPrimary, fontFamily: theme.typography.heading, fontSize: 16 },
} );

export default ReframeScreen;
