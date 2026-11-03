import {
  frameRectToPreview,
  previewRectToFrame,
  previewSquareAround,
  rectContains,
  rotateNormalizedPoint,
  unrotateNormalizedPoint,
} from "../../../../components/Camera/ARCamera/helpers/previewGeometry";

const orientations = ["portrait", "landscape-left", "landscape-right", "portrait-upside-down"];
const close = ( a, b ) => {
  ["left", "top", "width", "height"].forEach( k => expect( a[k] ).toBeCloseTo( b[k], 5 ) );
};

describe( "preview geometry", () => {
  test.each( orientations.flatMap( o => [[o, false], [o, true]] ) )(
    "rotate and unrotate are inverses (%s, mirrored %s)", ( o, m ) => {
      const p = rotateNormalizedPoint( 0.2, 0.7, o, m );
      const q = unrotateNormalizedPoint( p.x, p.y, o, m );
      expect( q.x ).toBeCloseTo( 0.2, 6 );
      expect( q.y ).toBeCloseTo( 0.7, 6 );
    }
  );

  // 4:3 sensor frame (landscape) shown on a tall phone preview, the usual Seek case
  const g = {
    frameWidth: 1440,
    frameHeight: 1080,
    frameOrientation: "landscape-right",
    previewOrientation: "portrait",
    isMirrored: false,
    previewWidth: 412,
    previewHeight: 892,
  };

  test( "a frame rect round-trips through the preview", () => {
    const rect = { left: 0.3, top: 0.35, width: 0.25, height: 0.2 };
    const onPreview = frameRectToPreview( rect, g );
    close( previewRectToFrame( onPreview, g ), rect );
  } );

  test( "frame centre stays at the preview centre", () => {
    const r = frameRectToPreview( { left: 0.45, top: 0.45, width: 0.1, height: 0.1 }, g );
    expect( r.left + ( r.width / 2 ) ).toBeCloseTo( 0.5, 5 );
    expect( r.top + ( r.height / 2 ) ).toBeCloseTo( 0.5, 5 );
  } );

  test( "regions cropped away by 'cover' are not shown", () => {
    // rotated frame is 1080x1440 (3:4) on a 412x892 view: the sides are cropped,
    // so a box at the frame's far edge (preview x near 0) falls outside
    const r = frameRectToPreview( { left: 0.4, top: 0.9, width: 0.1, height: 0.1 }, g );
    expect( r ).toBeNull( );
  } );

  test( "tap square stays inside the view and is square on screen", () => {
    const s = previewSquareAround( 0.02, 0.98, 0.4, 412, 892 );
    expect( s.left ).toBeGreaterThanOrEqual( 0 );
    expect( s.top + s.height ).toBeLessThanOrEqual( 1 + 1e-9 );
    expect( s.width * 412 ).toBeCloseTo( s.height * 892, 5 );
    expect( rectContains( s, s.left + 0.01, s.top + 0.01 ) ).toBe( true );
  } );
} );
