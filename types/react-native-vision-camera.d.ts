// Type augmentation for the APIs added to react-native-vision-camera by
// patches/react-native-vision-camera+4.7.3.patch. The patch modifies the
// package's src/ files, but tsc reads the shipped lib/typescript
// declarations, so the patched-in members are declared here instead.
import "react-native-vision-camera";

declare module "react-native-vision-camera" {
  interface Camera {
    /**
     * Lock focus to a manual lens position.
     * @param focusValue A value from 0.0 (closest focus) to 1.0 (infinity).
     */
    setManualFocus( focusValue: number ): Promise<void>;
    /**
     * Restore continuous auto-focus.
     */
    resetFocus( ): Promise<void>;
  }

  interface CameraProps {
    /**
     * Enables a preview-only native focus peaking shader on Android.
     * The shader modifies the displayed preview stream only, not captured photos.
     *
     * @platform Android
     * @default false
     */
    focusPeakingEnabled?: boolean;
    /**
     * Toggles highlights in an already-enabled native focus peaking shader pipeline.
     * This can change without rebinding the Android camera session.
     *
     * @platform Android
     * @default false
     */
    focusPeakingActive?: boolean;
    /**
     * Controls the native focus peaking threshold. Values closer to 1 show more highlights.
     *
     * @platform Android
     * @default 0.35
     */
    focusPeakingSensitivity?: number;
  }
}
