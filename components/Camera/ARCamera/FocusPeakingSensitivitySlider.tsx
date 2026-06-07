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
  sensitivity: number;
  setSensitivity: ( value: number ) => void;
}

const clampSensitivity = ( value: number ) => Math.min( Math.max( value, 0 ), 1 );

const FocusPeakingSensitivitySlider = ( {
  sensitivity,
  setSensitivity,
}: Props ) => {
  const trackMetricsRef = useRef( {
    pageX: 0,
    width: 1,
  } );
  const trackRef = useRef<View>( null );
  const clampedSensitivity = clampSensitivity( sensitivity );

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

  const updateSensitivityFromPageX = useCallback( (
    pageX: number,
    metrics = trackMetricsRef.current
  ) => {
    setSensitivity( clampSensitivity( ( pageX - metrics.pageX ) / metrics.width ) );
  }, [setSensitivity] );

  const panResponder = useMemo( () => PanResponder.create( {
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: event => {
      const { pageX } = event.nativeEvent;
      measureTrack( metrics => updateSensitivityFromPageX( pageX, metrics ) );
    },
    onPanResponderMove: event => updateSensitivityFromPageX( event.nativeEvent.pageX ),
    onPanResponderRelease: event => updateSensitivityFromPageX( event.nativeEvent.pageX ),
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  } ), [measureTrack, updateSensitivityFromPageX] );

  const onTrackLayout = ( _event: LayoutChangeEvent ) => {
    measureTrack();
  };

  const handleAccessibilityAction = ( event: AccessibilityActionEvent ) => {
    if ( event.nativeEvent.actionName === "increment" ) {
      setSensitivity( clampSensitivity( clampedSensitivity + 0.05 ) );
    } else if ( event.nativeEvent.actionName === "decrement" ) {
      setSensitivity( clampSensitivity( clampedSensitivity - 0.05 ) );
    }
  };

  return (
    <View
      accessibilityActions={[
        { name: "increment", label: i18n.t( "accessibility.increase_peaking_sensitivity" ) },
        { name: "decrement", label: i18n.t( "accessibility.decrease_peaking_sensitivity" ) },
      ]}
      accessibilityLabel={i18n.t( "accessibility.focus_peaking_sensitivity" )}
      accessibilityRole="adjustable"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round( clampedSensitivity * 100 ),
      }}
      onAccessibilityAction={handleAccessibilityAction}
      style={styles.container}
      testID="focus-peaking-sensitivity-slider"
    >
      <Text maxFontSizeMultiplier={1.2} style={styles.label}>PEAK</Text>
      <View
        ref={trackRef}
        onLayout={onTrackLayout}
        style={styles.track}
        {...panResponder.panHandlers}
      >
        <View style={[styles.trackFill, { width: `${clampedSensitivity * 100}%` }]} />
        <View style={[styles.thumb, { left: `${clampedSensitivity * 100}%` }]} />
      </View>
      <Text maxFontSizeMultiplier={1.2} style={styles.valueLabel}>
        {Math.round( clampedSensitivity * 100 )}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create( {
  container: {
    alignItems: "center",
    backgroundColor: "rgba(10, 14, 11, 0.68)",
    borderColor: "rgba(224, 168, 46, 0.72)",
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
    height: 44,
    paddingHorizontal: 14,
    width: 292,
  },
  label: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    width: 36,
  },
  track: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  trackFill: {
    backgroundColor: colors.seekGold,
    borderRadius: 2,
    height: 4,
    position: "absolute",
  },
  thumb: {
    backgroundColor: colors.white,
    borderColor: colors.seekGold,
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

export default FocusPeakingSensitivitySlider;
