import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export interface PeakingPoint {
  x: number;
  y: number;
  width: number;
  height: number;
  strength: number;
}

interface Props {
  pathRef: React.RefObject<any>;
  visible: boolean;
}

const FocusPeakingOverlay = ( { pathRef, visible }: Props ) => {
  if ( !visible ) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay} testID="focus-peaking-overlay">
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 1000 1000" width="100%">
        <Path
          ref={pathRef}
          d=""
          fill="none"
          stroke="#dfff38"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.95}
          strokeWidth={3}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create( {
  overlay: {
    ...StyleSheet.absoluteFillObject,
    elevation: 10,
    opacity: 0.9,
    zIndex: 10,
  },
} );

export default React.memo( FocusPeakingOverlay );
