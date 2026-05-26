import {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import type {
  GestureStateChangeEvent,
  TapGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import {
  Gesture,
} from "react-native-gesture-handler";
import type { Camera } from "../helpers/visionCameraWrapper";

export const HALF_SIZE_FOCUS_BOX = 40;
const FOCUS_BOX_FADE_MS = 2000;

export interface Coordinates {
  x: number;
  y: number;
}

const useFocusTap = ( cameraRef: React.RefObject<Camera | null>, supportsFocus: boolean ) => {
  const [tappedCoordinates, setTappedCoordinates] = useState<Coordinates | null>( null );
  const clearFocusBoxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>( null );
  const focusOpacity = useSharedValue( 0 );
  const focusLeft = useSharedValue( 0 );
  const focusTop = useSharedValue( 0 );

  const clearFocusBoxTimeout = useCallback( () => {
    if ( clearFocusBoxTimeoutRef.current ) {
      clearTimeout( clearFocusBoxTimeoutRef.current );
      clearFocusBoxTimeoutRef.current = null;
    }
  }, [] );

  const animatedStyle = useAnimatedStyle( ( ) => ( {
    left: focusLeft.value,
    top: focusTop.value,
    opacity: focusOpacity.value,
  } ) );

  const onFocus = useCallback( async ( { x, y }: GestureStateChangeEvent<TapGestureHandlerEventPayload> ) => {
    // If the device doesn't support focus, we don't want the camera to focus
    if ( !supportsFocus ) {
      return;
    }
    focusLeft.set( x - HALF_SIZE_FOCUS_BOX );
    focusTop.set( y - HALF_SIZE_FOCUS_BOX );
    focusOpacity.set( 1 );
    clearFocusBoxTimeout();
    setTappedCoordinates( { x, y } );
    focusOpacity.set( withTiming( 0, { duration: FOCUS_BOX_FADE_MS } ) );
    clearFocusBoxTimeoutRef.current = setTimeout( () => {
      clearFocusBoxTimeoutRef.current = null;
      setTappedCoordinates( null );
    }, FOCUS_BOX_FADE_MS );
    await cameraRef?.current?.focus( { x, y } ).catch( () => null );
  }, [cameraRef, clearFocusBoxTimeout, focusLeft, focusTop, focusOpacity, supportsFocus] );

  useEffect( () => {
    if ( !supportsFocus ) {
      clearFocusBoxTimeout();
      focusOpacity.set( 0 );
      setTappedCoordinates( null );
    }
    return clearFocusBoxTimeout;
  }, [clearFocusBoxTimeout, focusOpacity, supportsFocus] );

  const tapToFocus = useMemo( ( ) => Gesture.Tap( )
    .enabled( supportsFocus )
    .runOnJS( true )
    .onStart( onFocus ), [onFocus, supportsFocus] );

  return {
    animatedStyle,
    tapToFocus,
    tappedCoordinates,
  };
};

export default useFocusTap;
