import { NativeModules, Platform } from "react-native";
import { VisionCameraProxy } from "react-native-vision-camera";
import type { Frame } from "react-native-vision-camera";

import type { NormalizedRect } from "./previewGeometry";

/**
 * Subject detection (ML Kit object detection, Android). Live frames go through the
 * "detectSubjects" frame-processor plugin; photos through the SeekSubjects module.
 * Without the native side (iOS for now, tests) both return no subjects, and the
 * camera / reframe screen fall back to the centre of the frame.
 */

export interface FrameSubject {
  // ML Kit tracking id, stable while the subject stays in view (-1 when unknown)
  id: number;
  // fractions of the upright image
  box: NormalizedRect;
  // fractions of the frame in sensor orientation (classifier cropRect space)
  frameRect: NormalizedRect;
}

export interface PhotoSubject {
  // fractions of the photo as displayed (EXIF rotation applied)
  box: NormalizedRect;
}

const subjectPlugin = VisionCameraProxy.initFrameProcessorPlugin( "detectSubjects", {} );

export const detectFrameSubjects = ( frame: Frame ): FrameSubject[] => {
  "worklet";

  if ( subjectPlugin == null ) {
    return [];
  }
  try {
    return subjectPlugin.call( frame ) as unknown as FrameSubject[];
  } catch {
    return [];
  }
};

export const subjectDetectionAvailable = ( ): boolean => Platform.OS === "android"
  && NativeModules?.SeekSubjects?.detect != null;

export const detectPhotoSubjects = async ( uri: string ): Promise<PhotoSubject[]> => {
  if ( !subjectDetectionAvailable( ) ) {
    return [];
  }
  try {
    const subjects = await NativeModules.SeekSubjects.detect( uri );
    return Array.isArray( subjects ) ? subjects : [];
  } catch {
    return [];
  }
};
