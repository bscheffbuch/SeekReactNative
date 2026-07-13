import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  AccessibilityActionEvent,
  LayoutChangeEvent,
  PanResponderGestureState,
} from "react-native";

import { colors } from "../../../styles/global";

interface MajorTick {
  value: number;
  label: string;
}

interface Props {
  accessibilityLabel: string;
  commitOnRelease?: boolean;
  format: ( value: number ) => string;
  majors: MajorTick[];
  max: number;
  min: number;
  minorStep: number;
  onChange: ( value: number ) => void;
  pxPerUnit: number;
  testID?: string;
  value: number;
}

const clamp = ( value: number, min: number, max: number ) => (
  Math.min( Math.max( value, min ), max )
);

const WHEEL_COMMIT_INTERVAL_MS = 40;
const TICK_WIDTH = 44;

const CameraJogWheel = ( {
  accessibilityLabel,
  commitOnRelease = false,
  format,
  majors,
  max,
  min,
  minorStep,
  onChange,
  pxPerUnit,
  testID,
  value,
}: Props ) => {
  const [wheelWidth, setWheelWidth] = useState( 1 );
  const startPageXRef = useRef( 0 );
  const startValueRef = useRef( value );
  const clampedValue = clamp( value, min, max );
  const [displayValue, setDisplayValue] = useState( clampedValue );
  const isDraggingRef = useRef( false );
  const lastCommitMsRef = useRef( 0 );
  const pendingCommitValueRef = useRef( clampedValue );
  const pendingCommitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>( null );

  useEffect( () => {
    if ( !isDraggingRef.current ) {
      setDisplayValue( clampedValue );
    }
  }, [clampedValue] );

  const clearPendingCommit = useCallback( () => {
    if ( pendingCommitTimeoutRef.current ) {
      clearTimeout( pendingCommitTimeoutRef.current );
      pendingCommitTimeoutRef.current = null;
    }
  }, [] );

  useEffect( () => clearPendingCommit, [clearPendingCommit] );

  const commitValue = useCallback( ( nextValue: number, immediate: boolean = false ) => {
    const nextClampedValue = clamp( nextValue, min, max );
    setDisplayValue( nextClampedValue );
    pendingCommitValueRef.current = nextClampedValue;

    if ( immediate ) {
      clearPendingCommit( );
      lastCommitMsRef.current = Date.now( );
      onChange( nextClampedValue );
      return;
    }

    const now = Date.now( );
    const elapsed = now - lastCommitMsRef.current;
    if ( elapsed >= WHEEL_COMMIT_INTERVAL_MS ) {
      clearPendingCommit( );
      lastCommitMsRef.current = now;
      onChange( nextClampedValue );
      return;
    }

    if ( !pendingCommitTimeoutRef.current ) {
      pendingCommitTimeoutRef.current = setTimeout( () => {
        pendingCommitTimeoutRef.current = null;
        lastCommitMsRef.current = Date.now( );
        onChange( pendingCommitValueRef.current );
      }, WHEEL_COMMIT_INTERVAL_MS - elapsed );
    }
  }, [clearPendingCommit, max, min, onChange] );

  const updateFromPageX = useCallback( ( pageX: number, immediate: boolean = false ) => {
    const dx = pageX - startPageXRef.current;
    const nextValue = clamp( startValueRef.current - dx / pxPerUnit, min, max );
    if ( commitOnRelease && !immediate ) {
      setDisplayValue( nextValue );
      pendingCommitValueRef.current = nextValue;
      return;
    }
    commitValue( nextValue, immediate );
  }, [commitOnRelease, commitValue, max, min, pxPerUnit] );

  const updateFromGesture = useCallback( (
    gestureState: PanResponderGestureState,
    immediate: boolean = false
  ) => {
    const pageX = gestureState.moveX || startPageXRef.current + gestureState.dx;
    updateFromPageX( pageX, immediate );
  }, [updateFromPageX] );

  const panResponder = useMemo( () => PanResponder.create( {
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: event => {
      isDraggingRef.current = true;
      startPageXRef.current = event.nativeEvent.pageX;
      startValueRef.current = displayValue;
    },
    onPanResponderMove: ( _event, gestureState ) => updateFromGesture( gestureState ),
    onPanResponderRelease: ( _event, gestureState ) => {
      updateFromGesture( gestureState, true );
      isDraggingRef.current = false;
    },
    onPanResponderTerminate: ( _event, gestureState ) => {
      updateFromGesture( gestureState, true );
      isDraggingRef.current = false;
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  } ), [displayValue, updateFromGesture] );

  const ticks = useMemo( () => {
    const count = Math.round( ( max - min ) / minorStep );
    return Array.from( { length: count + 1 }, ( _unused, index ) => {
      const tickValue = min + index * minorStep;
      const major = majors.find( item => (
        Math.abs( item.value - tickValue ) < minorStep / 2
      ) );
      return {
        label: major?.label,
        major: Boolean( major ),
        offset: ( tickValue - min ) * pxPerUnit,
        value: tickValue,
      };
    } );
  }, [majors, max, min, minorStep, pxPerUnit] );

  const onLayout = ( event: LayoutChangeEvent ) => {
    setWheelWidth( Math.max( event.nativeEvent.layout.width, 1 ) );
  };

  const handleAccessibilityAction = ( event: AccessibilityActionEvent ) => {
    if ( event.nativeEvent.actionName === "increment" ) {
      commitValue( displayValue + minorStep, true );
    } else if ( event.nativeEvent.actionName === "decrement" ) {
      commitValue( displayValue - minorStep, true );
    }
  };

  const trackWidth = Math.max( ( max - min ) * pxPerUnit + TICK_WIDTH, wheelWidth );
  const trackOffset = wheelWidth / 2 - ( displayValue - min ) * pxPerUnit;

  return (
    <View
      accessibilityActions={[
        { name: "increment" },
        { name: "decrement" },
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{
        min: Math.round( min * 100 ),
        max: Math.round( max * 100 ),
        now: Math.round( displayValue * 100 ),
        text: format( displayValue ),
      }}
      onAccessibilityAction={handleAccessibilityAction}
      onLayout={onLayout}
      style={styles.container}
      testID={testID}
      {...panResponder.panHandlers}
    >
      <View pointerEvents="none" style={styles.tickViewport}>
        <View
          style={[
            styles.tickTrack,
            {
              transform: [{ translateX: trackOffset }],
              width: trackWidth,
            },
          ]}
        >
          {ticks.map( tick => (
            <View
              key={`${tick.value}`}
              style={[styles.tick, { left: tick.offset - TICK_WIDTH / 2 }]}
            >
              <View style={[styles.tickLine, tick.major && styles.majorTickLine]} />
              {tick.label && (
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={styles.tickLabel}
                >
                  {tick.label}
                </Text>
              )}
            </View>
          ) )}
        </View>
      </View>
      <View pointerEvents="none" style={styles.centerReadout}>
        <Text maxFontSizeMultiplier={1.1} style={styles.valueLabel}>
          {format( displayValue )}
        </Text>
        <View style={styles.playhead} />
      </View>
      <View pointerEvents="none" style={styles.shade} />
    </View>
  );
};

const styles = StyleSheet.create( {
  centerReadout: {
    alignItems: "center",
    bottom: 8,
    left: 0,
    position: "absolute",
    right: 0,
    top: 6,
  },
  container: {
    backgroundColor: "rgba(12, 16, 13, 0.68)",
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 20,
    borderWidth: 1,
    height: 66,
    overflow: "hidden",
  },
  majorTickLine: {
    backgroundColor: colors.seekGold,
    height: 26,
    width: 3,
  },
  playhead: {
    backgroundColor: colors.seekGold,
    borderRadius: 2,
    flex: 1,
    marginBottom: 0,
    marginTop: 4,
    width: 3,
  },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  tick: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 15,
    width: TICK_WIDTH,
  },
  tickLabel: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 5,
    textAlign: "center",
  },
  tickLine: {
    backgroundColor: "rgba(255, 255, 255, 0.44)",
    borderRadius: 2,
    height: 13,
    width: 2,
  },
  tickTrack: {
    height: "100%",
    position: "absolute",
  },
  tickViewport: {
    ...StyleSheet.absoluteFillObject,
  },
  valueLabel: {
    backgroundColor: colors.seekGold,
    borderRadius: 99,
    color: colors.seekInk,
    fontSize: 14,
    fontWeight: "800",
    minWidth: 56,
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 3,
    textAlign: "center",
  },
} );

export default CameraJogWheel;
