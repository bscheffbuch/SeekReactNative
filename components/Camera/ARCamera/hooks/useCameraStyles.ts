import { useTheme } from "../../../Providers/ThemeProvider";
import { getCameraOverlayStyles } from "../../../../styles/camera/arCameraOverlay";

// Camera controls always use the dark variant of the active color scheme
// (static Seek green or Material You).
const useCameraStyles = ( ) => getCameraOverlayStyles( useTheme( ).cameraTheme );

export default useCameraStyles;
