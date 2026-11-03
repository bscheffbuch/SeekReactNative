import type { NormalizedRect } from "../ARCamera/helpers/previewGeometry";

/** Where a photo of imageWidth x imageHeight lands when fitted ("contain") into the stage. */
export const containRect = (
  imageWidth: number,
  imageHeight: number,
  stageWidth: number,
  stageHeight: number
): { x: number; y: number; width: number; height: number } => {
  if ( imageWidth <= 0 || imageHeight <= 0 || stageWidth <= 0 || stageHeight <= 0 ) {
    return { x: 0, y: 0, width: Math.max( stageWidth, 0 ), height: Math.max( stageHeight, 0 ) };
  }
  const scale = Math.min( stageWidth / imageWidth, stageHeight / imageHeight );
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { x: ( stageWidth - width ) / 2, y: ( stageHeight - height ) / 2, width, height };
};

export type DragMode =
  | "move"
  | "left" | "right" | "top" | "bottom"
  | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  | null;

/**
 * What a touch at (x, y) grabs on a box drawn at `box` (all in px): a corner, an edge, the
 * inside (move) or nothing. `slop` widens the handles to a comfortable touch target.
 */
export const hitTestBox = (
  box: { x: number; y: number; width: number; height: number },
  x: number,
  y: number,
  slop = 24
): DragMode => {
  const left = box.x;
  const right = box.x + box.width;
  const top = box.y;
  const bottom = box.y + box.height;
  if ( x < left - slop || x > right + slop || y < top - slop || y > bottom + slop ) {
    return null;
  }
  // on small boxes keep a usable "move" area in the middle
  const edge = Math.min( slop, box.width / 4, box.height / 4 );
  const nearLeft = Math.abs( x - left ) <= Math.max( edge, 8 ) || x < left;
  const nearRight = Math.abs( x - right ) <= Math.max( edge, 8 ) || x > right;
  const nearTop = Math.abs( y - top ) <= Math.max( edge, 8 ) || y < top;
  const nearBottom = Math.abs( y - bottom ) <= Math.max( edge, 8 ) || y > bottom;
  if ( nearTop && nearLeft ) { return "top-left"; }
  if ( nearTop && nearRight ) { return "top-right"; }
  if ( nearBottom && nearLeft ) { return "bottom-left"; }
  if ( nearBottom && nearRight ) { return "bottom-right"; }
  if ( nearLeft ) { return "left"; }
  if ( nearRight ) { return "right"; }
  if ( nearTop ) { return "top"; }
  if ( nearBottom ) { return "bottom"; }
  return "move";
};

const clamp = ( v: number, lo: number, hi: number ) => Math.min( hi, Math.max( lo, v ) );

/**
 * The rect after dragging by (dx, dy) (fractions of the photo) from `start` with `mode`.
 * Stays inside the photo and at least `minSize` on each side.
 */
export const applyDrag = (
  start: NormalizedRect,
  mode: DragMode,
  dx: number,
  dy: number,
  minSize = 0.08
): NormalizedRect => {
  if ( !mode ) {
    return start;
  }
  if ( mode === "move" ) {
    return {
      left: clamp( start.left + dx, 0, 1 - start.width ),
      top: clamp( start.top + dy, 0, 1 - start.height ),
      width: start.width,
      height: start.height,
    };
  }
  let left = start.left;
  let top = start.top;
  let right = start.left + start.width;
  let bottom = start.top + start.height;
  if ( mode.includes( "left" ) ) {
    left = clamp( left + dx, 0, right - minSize );
  }
  if ( mode.includes( "right" ) ) {
    right = clamp( right + dx, left + minSize, 1 );
  }
  if ( mode.includes( "top" ) ) {
    top = clamp( top + dy, 0, bottom - minSize );
  }
  if ( mode.includes( "bottom" ) ) {
    bottom = clamp( bottom + dy, top + minSize, 1 );
  }
  return { left, top, width: right - left, height: bottom - top };
};

/** Starting box when nothing was detected: the centre 60% of the photo. */
export const DEFAULT_SUBJECT: NormalizedRect = { left: 0.2, top: 0.2, width: 0.6, height: 0.6 };

/** Detected subjects worth offering: not specks, not the whole photo; at most `max`. */
export const usableSubjects = ( boxes: NormalizedRect[], max = 4 ): NormalizedRect[] => boxes
  .filter( b => b.width * b.height >= 0.01 && b.width * b.height <= 0.9 )
  .slice( 0, max );
