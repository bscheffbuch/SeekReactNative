import type { Orientation } from "react-native-vision-camera";

/**
 * Geometry between camera frames (sensor orientation, fractions of the frame) and the
 * preview view (which shows the frame rotated to the preview orientation and scaled to
 * cover the view). All functions are worklets, so the frame processor can use them.
 */

export interface NormalizedRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FrameGeometry {
  frameWidth: number;
  frameHeight: number;
  frameOrientation: Orientation;
  previewOrientation: Orientation;
  isMirrored: boolean;
  previewWidth: number;
  previewHeight: number;
}

export const orientationToDegrees = ( orientation: Orientation ): number => {
  "worklet";

  switch ( orientation ) {
    case "portrait":
      return 0;
    case "landscape-left":
      return 90;
    case "portrait-upside-down":
      return 180;
    case "landscape-right":
      return 270;
    default:
      return 0;
  }
};

export const degreesToOrientation = ( degrees: number ): Orientation => {
  "worklet";

  const clampedDegrees = ( degrees + 360 ) % 360;
  if ( clampedDegrees >= 315 || clampedDegrees <= 45 ) {
    return "portrait";
  }
  if ( clampedDegrees > 45 && clampedDegrees <= 135 ) {
    return "landscape-left";
  }
  if ( clampedDegrees > 135 && clampedDegrees <= 225 ) {
    return "portrait-upside-down";
  }
  return "landscape-right";
};

export const getRelativeOrientation = (
  frameOrientation: Orientation,
  previewOrientation: Orientation
): Orientation => {
  "worklet";

  return degreesToOrientation(
    orientationToDegrees( frameOrientation ) - orientationToDegrees( previewOrientation )
  );
};

/** Frame point (fractions) -> the same point in the rotated (preview-oriented) frame. */
export const rotateNormalizedPoint = (
  x: number,
  y: number,
  orientation: Orientation,
  isMirrored: boolean
): { x: number; y: number } => {
  "worklet";

  let rotatedX = x;
  let rotatedY = y;

  switch ( orientation ) {
    case "landscape-left":
      rotatedX = y;
      rotatedY = 1 - x;
      break;
    case "landscape-right":
      rotatedX = 1 - y;
      rotatedY = x;
      break;
    case "portrait-upside-down":
      rotatedX = 1 - x;
      rotatedY = 1 - y;
      break;
    case "portrait":
    default:
      break;
  }

  return {
    x: isMirrored ? 1 - rotatedX : rotatedX,
    y: rotatedY,
  };
};

/** Inverse of rotateNormalizedPoint. */
export const unrotateNormalizedPoint = (
  x: number,
  y: number,
  orientation: Orientation,
  isMirrored: boolean
): { x: number; y: number } => {
  "worklet";

  const rx = isMirrored ? 1 - x : x;
  switch ( orientation ) {
    case "landscape-left":
      return { x: 1 - y, y: rx };
    case "landscape-right":
      return { x: y, y: 1 - rx };
    case "portrait-upside-down":
      return { x: 1 - rx, y: 1 - y };
    case "portrait":
    default:
      return { x: rx, y };
  }
};

export const getRotatedFrameSize = (
  frameWidth: number,
  frameHeight: number,
  orientation: Orientation
) => {
  "worklet";

  if ( orientation === "landscape-left" || orientation === "landscape-right" ) {
    return { width: frameHeight, height: frameWidth };
  }
  return { width: frameWidth, height: frameHeight };
};

const coverTransform = (
  sourceWidth: number,
  sourceHeight: number,
  previewWidth: number,
  previewHeight: number
) => {
  "worklet";

  const safeSourceWidth = Math.max( sourceWidth, 1 );
  const safeSourceHeight = Math.max( sourceHeight, 1 );
  const safePreviewWidth = Math.max( previewWidth, 1 );
  const safePreviewHeight = Math.max( previewHeight, 1 );
  const scale = Math.max(
    safePreviewWidth / safeSourceWidth,
    safePreviewHeight / safeSourceHeight
  );
  const renderedWidth = safeSourceWidth * scale;
  const renderedHeight = safeSourceHeight * scale;
  return {
    renderedWidth,
    renderedHeight,
    offsetX: ( renderedWidth - safePreviewWidth ) / 2,
    offsetY: ( renderedHeight - safePreviewHeight ) / 2,
    previewWidth: safePreviewWidth,
    previewHeight: safePreviewHeight,
  };
};

/** Point in the (rotated) source -> point in a preview that shows the source with "cover". */
export const mapNormalizedPointToCoveredPreview = (
  x: number,
  y: number,
  sourceWidth: number,
  sourceHeight: number,
  previewWidth: number,
  previewHeight: number
): { x: number; y: number } => {
  "worklet";

  const t = coverTransform( sourceWidth, sourceHeight, previewWidth, previewHeight );
  return {
    x: ( ( x * t.renderedWidth ) - t.offsetX ) / t.previewWidth,
    y: ( ( y * t.renderedHeight ) - t.offsetY ) / t.previewHeight,
  };
};

/** Inverse of mapNormalizedPointToCoveredPreview. */
export const mapCoveredPreviewPointToSource = (
  x: number,
  y: number,
  sourceWidth: number,
  sourceHeight: number,
  previewWidth: number,
  previewHeight: number
): { x: number; y: number } => {
  "worklet";

  const t = coverTransform( sourceWidth, sourceHeight, previewWidth, previewHeight );
  return {
    x: ( ( x * t.previewWidth ) + t.offsetX ) / t.renderedWidth,
    y: ( ( y * t.previewHeight ) + t.offsetY ) / t.renderedHeight,
  };
};

const clamp01 = ( v: number ) => {
  "worklet";

  return Math.min( 1, Math.max( 0, v ) );
};

/** Rect in frame coordinates -> rect on the preview (fractions of the view), clipped to it. */
export const frameRectToPreview = ( rect: NormalizedRect, g: FrameGeometry ): NormalizedRect | null => {
  "worklet";

  const relative = getRelativeOrientation( g.frameOrientation, g.previewOrientation );
  const size = getRotatedFrameSize( g.frameWidth, g.frameHeight, relative );
  const corners = [
    rotateNormalizedPoint( rect.left, rect.top, relative, g.isMirrored ),
    rotateNormalizedPoint( rect.left + rect.width, rect.top + rect.height, relative, g.isMirrored ),
  ];
  const xs = [corners[0].x, corners[1].x];
  const ys = [corners[0].y, corners[1].y];
  const a = mapNormalizedPointToCoveredPreview(
    Math.min( xs[0], xs[1] ), Math.min( ys[0], ys[1] ), size.width, size.height, g.previewWidth, g.previewHeight
  );
  const b = mapNormalizedPointToCoveredPreview(
    Math.max( xs[0], xs[1] ), Math.max( ys[0], ys[1] ), size.width, size.height, g.previewWidth, g.previewHeight
  );
  const left = clamp01( a.x );
  const top = clamp01( a.y );
  const right = clamp01( b.x );
  const bottom = clamp01( b.y );
  if ( right - left <= 0 || bottom - top <= 0 ) {
    return null;
  }
  return { left, top, width: right - left, height: bottom - top };
};

/** Rect on the preview (fractions of the view) -> the same region in frame coordinates. */
export const previewRectToFrame = ( rect: NormalizedRect, g: FrameGeometry ): NormalizedRect => {
  "worklet";

  const relative = getRelativeOrientation( g.frameOrientation, g.previewOrientation );
  const size = getRotatedFrameSize( g.frameWidth, g.frameHeight, relative );
  const toFrame = ( x: number, y: number ) => {
    const s = mapCoveredPreviewPointToSource( x, y, size.width, size.height, g.previewWidth, g.previewHeight );
    return unrotateNormalizedPoint( s.x, s.y, relative, g.isMirrored );
  };
  const a = toFrame( rect.left, rect.top );
  const b = toFrame( rect.left + rect.width, rect.top + rect.height );
  const left = clamp01( Math.min( a.x, b.x ) );
  const top = clamp01( Math.min( a.y, b.y ) );
  const right = clamp01( Math.max( a.x, b.x ) );
  const bottom = clamp01( Math.max( a.y, b.y ) );
  return { left, top, width: right - left, height: bottom - top };
};

/** Square on the preview centred on a point, `size` as a fraction of the view's shorter side. */
export const previewSquareAround = (
  x: number,
  y: number,
  size: number,
  previewWidth: number,
  previewHeight: number
): NormalizedRect => {
  "worklet";

  const side = size * Math.min( previewWidth, previewHeight );
  const w = side / Math.max( previewWidth, 1 );
  const h = side / Math.max( previewHeight, 1 );
  const left = Math.min( Math.max( x - ( w / 2 ), 0 ), 1 - w );
  const top = Math.min( Math.max( y - ( h / 2 ), 0 ), 1 - h );
  return { left, top, width: w, height: h };
};

export const rectContains = ( rect: NormalizedRect, x: number, y: number ): boolean => {
  "worklet";

  return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;
};
