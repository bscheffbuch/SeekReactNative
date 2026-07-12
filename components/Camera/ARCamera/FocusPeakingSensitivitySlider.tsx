import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Text,
  View,
} from "react-native";
import type { AccessibilityActionEvent, LayoutChangeEvent } from "react-native";

import i18n from "../../../i18n";
import { viewStyles, textStyles } from "../../../styles/camera/cameraControls";

interface Props {
  sensitivity: number;
  setSensitivity: ( value: number ) => void;
}

const clampSensitivity = ( value: number ) => Math.min( Math.max( value, 0 ), 1 );

// The slider UI updates locally on every pan move, but commits to the parent
// (which re-renders the whole camera tree) at a bounded rate plus on gesture
// end.
const COMMIT_INTERVAL_MS = 66; // ~15Hz

const FocusPeakingSensitivitySlider = ( {
  sensitivity,
  setSensitivity,
}: Props ) => {
  const trackMetricsRef = useRef( {
    pageX: 0,
    width: 1,
  } );
  const trackRef = useRef<View>( null );
  const [localSensitivity, setLocalSensitivity] = useState( sensitivity );
  const isDraggingRef = useRef( false );
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>( null );
  const lastCommitAtRef = useRef( 0 );
  const pendingValueRef = useRef<number | null>( null );
  const clampedSensitivity = clampSensitivity( localSensitivity );

  // Keep the local value in sync with external changes, but not mid-gesture,
  // when the parent echoes back throttled commits.
  useEffect( () => {
    if ( !isDraggingRef.current ) {
      setLocalSensitivity( sensitivity );
    }
  }, [sensitivity] );

  useEffect( () => () => {
    if ( commitTimeoutRef.current ) {
      clearTimeout( commitTimeoutRef.current );
      commitTimeoutRef.current = null;
    }
  }, [] );

  const commitValue = useCallback( ( value: number ) => {
    lastCommitAtRef.current = Date.now();
    pendingValueRef.current = null;
    setSensitivity( value );
  }, [setSensitivity] );

  const scheduleCommit = useCallback( ( value: number ) => {
    pendingValueRef.current = value;
    if ( commitTimeoutRef.current ) {
      // a trailing commit is already scheduled and will pick up the latest value
      return;
    }

    const elapsed = Date.now() - lastCommitAtRef.current;
    if ( elapsed >= COMMIT_INTERVAL_MS ) {
      commitValue( value );
      return;
    }

    commitTimeoutRef.current = setTimeout( () => {
      commitTimeoutRef.current = null;
      if ( pendingValueRef.current != null ) {
        commitValue( pendingValueRef.current );
      }
    }, COMMIT_INTERVAL_MS - elapsed );
  }, [commitValue] );

  const flushCommit = useCallback( ( value: number ) => {
    if ( commitTimeoutRef.current ) {
      clearTimeout( commitTimeoutRef.current );
      commitTimeoutRef.current = null;
    }
    commitValue( value );
  }, [commitValue] );

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

  const valueFromPageX = useCallback( (
    pageX: number,
    metrics = trackMetricsRef.current
  ) => clampSensitivity( ( pageX - metrics.pageX ) / metrics.width ), [] );

  const updateSensitivityFromPageX = useCallback( (
    pageX: number,
    metrics = trackMetricsRef.current
  ) => {
    const value = valueFromPageX( pageX, metrics );
    setLocalSensitivity( value );
    scheduleCommit( value );
  }, [scheduleCommit, valueFromPageX] );

  const panResponder = useMemo( () => PanResponder.create( {
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: event => {
      isDraggingRef.current = true;
      const { pageX } = event.nativeEvent;
      measureTrack( metrics => updateSensitivityFromPageX( pageX, metrics ) );
    },
    onPanResponderMove: event => updateSensitivityFromPageX( event.nativeEvent.pageX ),
    onPanResponderRelease: event => {
      isDraggingRef.current = false;
      const value = valueFromPageX( event.nativeEvent.pageX );
      setLocalSensitivity( value );
      flushCommit( value );
    },
    onPanResponderTerminate: () => {
      isDraggingRef.current = false;
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  } ), [flushCommit, measureTrack, updateSensitivityFromPageX, valueFromPageX] );

  const onTrackLayout = ( _event: LayoutChangeEvent ) => {
    measureTrack();
  };

  const handleAccessibilityAction = ( event: AccessibilityActionEvent ) => {
    let value: number | null = null;
    if ( event.nativeEvent.actionName === "increment" ) {
      value = clampSensitivity( clampedSensitivity + 0.05 );
    } else if ( event.nativeEvent.actionName === "decrement" ) {
      value = clampSensitivity( clampedSensitivity - 0.05 );
    }
    if ( value !== null ) {
      setLocalSensitivity( value );
      flushCommit( value );
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
      style={viewStyles.sliderContainer}
      testID="focus-peaking-sensitivity-slider"
    >
      <Text maxFontSizeMultiplier={1.2} style={textStyles.peakingSliderLabel}>PEAK</Text>
      <View
        ref={trackRef}
        onLayout={onTrackLayout}
        style={viewStyles.sliderTrack}
        {...panResponder.panHandlers}
      >
        <View style={[viewStyles.sliderTrackFill, viewStyles.peakingSliderTrackFill, { width: `${clampedSensitivity * 100}%` }]} />
        <View style={[viewStyles.sliderThumb, viewStyles.peakingSliderThumb, { left: `${clampedSensitivity * 100}%` }]} />
      </View>
      <Text maxFontSizeMultiplier={1.2} style={textStyles.sliderValueLabel}>
        {Math.round( clampedSensitivity * 100 )}
      </Text>
    </View>
  );
};

export default FocusPeakingSensitivitySlider;
