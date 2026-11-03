import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import i18n from "../../../i18n";
import { useTheme } from "../../Providers/ThemeProvider";
import type { NormalizedRect } from "./helpers/previewGeometry";

interface Props {
  // fractions of the preview; null hides the box
  rect: NormalizedRect | null;
  previewWidth: number;
  previewHeight: number;
  // a box the user placed by tapping (not tracked)
  manual: boolean;
}

const CORNER = 24;
const STROKE = 3;
const MOVE_MS = 160;

// Design "On subject": corner brackets around the tracked subject, accent colored.
const SubjectBox = ( { rect, previewWidth, previewHeight, manual }: Props ) => {
  const { cameraTheme } = useTheme( );
  const left = useSharedValue( 0 );
  const top = useSharedValue( 0 );
  const width = useSharedValue( 0 );
  const height = useSharedValue( 0 );
  const opacity = useSharedValue( 0 );

  useEffect( ( ) => {
    if ( !rect ) {
      opacity.set( withTiming( 0, { duration: MOVE_MS } ) );
      return;
    }
    const target = {
      left: rect.left * previewWidth,
      top: rect.top * previewHeight,
      width: Math.max( rect.width * previewWidth, CORNER * 2 ),
      height: Math.max( rect.height * previewHeight, CORNER * 2 ),
    };
    const appearing = opacity.get( ) < 0.05;
    // jump into place when appearing, glide while tracking
    left.set( appearing ? target.left : withTiming( target.left, { duration: MOVE_MS } ) );
    top.set( appearing ? target.top : withTiming( target.top, { duration: MOVE_MS } ) );
    width.set( appearing ? target.width : withTiming( target.width, { duration: MOVE_MS } ) );
    height.set( appearing ? target.height : withTiming( target.height, { duration: MOVE_MS } ) );
    opacity.set( withTiming( 1, { duration: MOVE_MS } ) );
  }, [rect, previewWidth, previewHeight, left, top, width, height, opacity] );

  const animatedStyle = useAnimatedStyle( ( ) => ( {
    left: left.get( ),
    top: top.get( ),
    width: width.get( ),
    height: height.get( ),
    opacity: opacity.get( ),
  } ) );

  const color = manual ? "#FFFFFF" : cameraTheme.colors.primary;
  const corner = { borderColor: color };
  return (
    <Animated.View
      accessibilityLabel={i18n.t( "camera.subject_found" )}
      pointerEvents="none"
      style={[styles.box, animatedStyle]}
    >
      <View style={[styles.corner, styles.topLeft, corner]} />
      <View style={[styles.corner, styles.topRight, corner]} />
      <View style={[styles.corner, styles.bottomLeft, corner]} />
      <View style={[styles.corner, styles.bottomRight, corner]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create( {
  box: {
    position: "absolute",
  },
  corner: {
    height: CORNER,
    position: "absolute",
    width: CORNER,
  },
  topLeft: {
    borderLeftWidth: STROKE,
    borderTopLeftRadius: 12,
    borderTopWidth: STROKE,
    left: 0,
    top: 0,
  },
  topRight: {
    borderRightWidth: STROKE,
    borderTopRightRadius: 12,
    borderTopWidth: STROKE,
    right: 0,
    top: 0,
  },
  bottomLeft: {
    borderBottomLeftRadius: 12,
    borderBottomWidth: STROKE,
    borderLeftWidth: STROKE,
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    borderBottomRightRadius: 12,
    borderBottomWidth: STROKE,
    borderRightWidth: STROKE,
    bottom: 0,
    right: 0,
  },
} );

export default SubjectBox;
