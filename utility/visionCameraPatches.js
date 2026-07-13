/*
    This file contains patches for handling the react-native-vision-camera library.
*/
import { useEffect, useMemo } from "react";
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

  // All of the run-on-other-context wrappers are created once (the shared values
  // are stable), so the returned function identity is stable and does not force
  // useFrameProcessor to rebuild the frame processor on every render.
  const { customRunAsync, drainQueuedFrame } = useMemo( () => {
    /**
     * Print worklets logs/errors on js thread
     */
    const logOnJs = Worklets.createRunOnJS( ( log, error ) => {
      console.log( "logOnJs - ", log, " - error?:", error?.message ?? "no error" );
    } );

    // Note: this worklet must not call itself by name. A worklet's closure is
    // captured when the worklet is created, and at that point the (var-hoisted)
    // binding for the const holding this function is still undefined, so a
    // recursive call would invoke undefined. Queued frames are therefore drained
    // with a loop instead of recursion.
    const customRunOnAsyncContext = Worklets.defaultContext.createRunAsync(
      ( frame, func ) => {
        "worklet";

        let currentFrame = frame;
        while ( currentFrame != null ) {
          try {
            func( currentFrame );
          } catch ( e ) {
            logOnJs( "customRunOnAsyncContext error", e );
          } finally {
            currentFrame.decrementRefCount();
          }
          currentFrame = queuedFrame.value;
          queuedFrame.value = null;
        }
        isAsyncContextBusy.value = false;
      }
    );

    // Releases a frame that is still queued when the camera tears down, so its
    // native buffer is not leaked. This runs on the same async context as the
    // processing worklet above, so the two cannot race on queuedFrame.
    const drainQueuedFrameOnAsyncContext = Worklets.defaultContext.createRunAsync( () => {
      "worklet";

      const frame = queuedFrame.value;
      queuedFrame.value = null;
      if ( frame != null ) {
        frame.decrementRefCount();
      }
    } );

    function runAsync( frame, func ) {
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

    return {
      customRunAsync: runAsync,
      drainQueuedFrame: drainQueuedFrameOnAsyncContext,
    };
  }, [isAsyncContextBusy, queuedFrame] );

  useEffect( () => () => {
    drainQueuedFrame().catch( ( e ) => {
      console.log( "drainQueuedFrame error", e?.message ?? e );
    } );
  }, [drainQueuedFrame] );

  return customRunAsync;
};

export default usePatchedRunAsync;
