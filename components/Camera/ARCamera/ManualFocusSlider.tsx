import React, { useCallback, useMemo, useRef } from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AccessibilityActionEvent, LayoutChangeEvent } from "react-native";

import i18n from "../../../i18n";
import { colors } from "../../../styles/global";

interface Props {
  focusValue: number;
  setFocusValue: ( value: number ) => void;
}

const clampFocusValue = ( value: number ) => Math.min( Math.max( value, 0 ), 1 );

const ManualFocusSlider = ( {
  focusValue,
  setFocusValue,
}: Props ) => {
  const trackMetricsRef = useRef( {
    pageX: 0,
    width: 1,
  } );
  const trackRef = useRef<View>( null );
  const clampedFocusValue = clampFocusValue( focusValue );

  const measureTrack = useCallback( (
    onMeasured?: ( metrics: { pageX: number; width: number } ) => void
  ) => {
    trackRef.current?.measureInWindow( ( pageX, _pageY, width ) => {
      const metrics = {
        pageX,
        width: Math.max( width, 1 ),
      };
      trackMetricsRef.current = metrics;
      onMeasured?.( metrics );
    } );
  }, [] );

  const updateFocusFromPageX = useCallback( (
    pageX: number,
    metrics = trackMetricsRef.current
  ) => {
    setFocusValue( clampFocusValue( ( pageX - metrics.pageX ) / metrics.width ) );
  }, [setFocusValue] );

  const panResponder = useMemo( () => PanResponder.create( {
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: event => {
      const { pageX } = event.nativeEvent;
      measureTrack( metrics => updateFocusFromPageX( pageX, metrics ) );
    },
    onPanResponderMove: event => updateFocusFromPageX( event.nativeEvent.pageX ),
    onPanResponderRelease: event => updateFocusFromPageX( event.nativeEvent.pageX ),
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  } ), [measureTrack, updateFocusFromPageX] );

  const onTrackLayout = ( _event: LayoutChangeEvent ) => {
    measureTrack();
  };

  const handleAccessibilityAction = ( event: AccessibilityActionEvent ) => {
    if ( event.nativeEvent.actionName === "increment" ) {
      setFocusValue( clampFocusValue( clampedFocusValue + 0.05 ) );
    } else if ( event.nativeEvent.actionName === "decrement" ) {
      setFocusValue( clampFocusValue( clampedFocusValue - 0.05 ) );
    }
  };

  return (
    <View
      accessibilityActions={[
        { name: "increment", label: i18n.t( "accessibility.increase_focus_distance" ) },
        { name: "decrement", label: i18n.t( "accessibility.decrease_focus_distance" ) },
      ]}
      accessibilityLabel={i18n.t( "accessibility.manual_focus" )}
      accessibilityRole="adjustable"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round( clampedFocusValue * 100 ),
      }}
      onAccessibilityAction={handleAccessibilityAction}
      style={styles.container}
      testID="manual-focus-slider"
    >
      <Text maxFontSizeMultiplier={1.2} style={styles.label}>MF</Text>
      <View
        ref={trackRef}
        onLayout={onTrackLayout}
        style={styles.track}
        {...panResponder.panHandlers}
      >
        <View style={[styles.trackFill, { width: `${clampedFocusValue * 100}%` }]} />
        <View style={[styles.thumb, { left: `${clampedFocusValue * 100}%` }]} />
      </View>
      <Text maxFontSizeMultiplier={1.2} style={styles.valueLabel}>
        {Math.round( clampedFocusValue * 100 )}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create( {
  container: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
    height: 44,
    paddingHorizontal: 14,
    width: 292,
  },
  label: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    width: 24,
  },
  track: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  trackFill: {
    backgroundColor: colors.seekGreen,
    borderRadius: 2,
    height: 4,
    position: "absolute",
  },
  thumb: {
    backgroundColor: colors.white,
    borderColor: colors.seekGreen,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    marginLeft: -10,
    position: "absolute",
    width: 20,
  },
  valueLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    width: 28,
  },
} );

export default ManualFocusSlider;
