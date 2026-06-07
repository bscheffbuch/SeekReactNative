/*
    This file contains patches for handling the react-native-vision-camera library.
*/
import { useMemo } from "react";
import {
  useSharedValue as useWorkletSharedValue,
  Worklets,
} from "react-native-worklets-core";

// This patch is currently required because we are using react-native-vision-camera v4.0.3
// together wit react-native-reanimated. The problem is that the runAsync function
// from react-native-vision-camera does not work in release mode with this reanimated.
// Uses this workaround: https://gist.github.com/nonam4/7a6409cd1273e8ed7466ba3a48dd1ecc but adapted it to
// version 4 of vision-camera.
// Originally, posted on this currently open issue: https://github.com/mrousavy/react-native-vision-camera/issues/2589
const usePatchedRunAsync = () => {
  const isAsyncContextBusy = useWorkletSharedValue( false );
  const queuedFrame = useWorkletSharedValue( null );

  // Everything below is memoized so the returned customRunAsync keeps a stable
  // identity across renders. It is captured by the frame-processor worklet's
  // dependency list, so a fresh function each render would rebuild that worklet
  // (and re-create the async context) on every render.
  return useMemo( () => {
    /**
     * Print worklets logs/errors on js thread
     */
    const logOnJs = Worklets.createRunOnJS( ( log, error ) => {
      console.log( "logOnJs - ", log, " - error?:", error?.message ?? "no error" );
    } );
    const customRunOnAsyncContext = Worklets.defaultContext.createRunAsync(
      ( frame, func ) => {
        "worklet";

        try {
          func( frame );
        } catch ( e ) {
          logOnJs( "customRunOnAsyncContext error", e );
        } finally {
          frame.decrementRefCount();
          const nextFrame = queuedFrame.value;
          queuedFrame.value = null;

          if ( nextFrame != null ) {
            customRunOnAsyncContext( nextFrame, func );
          } else {
            isAsyncContextBusy.value = false;
          }
        }
      }
    );

    function customRunAsync( frame, func ) {
      "worklet";

      const internal = frame;
      internal.incrementRefCount();
      if ( isAsyncContextBusy.value ) {
        const previousQueuedFrame = queuedFrame.value;
        if ( previousQueuedFrame != null ) {
          previousQueuedFrame.decrementRefCount();
        }
        queuedFrame.value = internal;
        return;
      }
      isAsyncContextBusy.value = true;
      customRunOnAsyncContext( internal, func );
    }

    return customRunAsync;
  }, [isAsyncContextBusy, queuedFrame] );
};

export default usePatchedRunAsync;
