import {
  applyDrag,
  containRect,
  hitTestBox,
  usableSubjects,
} from "../../../../components/Camera/Reframe/reframeGeometry";

describe( "reframe geometry", () => {
  test( "a tall photo is centred with bars on the sides", () => {
    const r = containRect( 3000, 4000, 358, 420 );
    expect( r.height ).toBeCloseTo( 420 );
    expect( r.width ).toBeCloseTo( 315 );
    expect( r.x ).toBeCloseTo( 21.5 );
    expect( r.y ).toBeCloseTo( 0 );
  } );

  const box = { x: 100, y: 100, width: 150, height: 150 };
  test.each( [
    [100, 100, "top-left"], [250, 100, "top-right"], [100, 250, "bottom-left"], [250, 250, "bottom-right"],
    [100, 175, "left"], [250, 175, "right"], [175, 100, "top"], [175, 250, "bottom"],
    [175, 175, "move"], [20, 20, null],
  ] )( "touch at (%d, %d) grabs %s", ( x, y, mode ) => {
    expect( hitTestBox( box, x, y ) ).toBe( mode );
  } );

  test( "a small box still has a move area", () => {
    expect( hitTestBox( { x: 0, y: 0, width: 40, height: 40 }, 20, 20 ) ).toBe( "move" );
  } );

  test( "moving stays inside the photo", () => {
    const r = applyDrag( { left: 0.6, top: 0.6, width: 0.3, height: 0.3 }, "move", 0.5, 0.5 );
    expect( r.left ).toBeCloseTo( 0.7 );
    expect( r.top ).toBeCloseTo( 0.7 );
    expect( r.width ).toBeCloseTo( 0.3 );
  } );

  test( "resizing a corner keeps the opposite corner and a minimum size", () => {
    const start = { left: 0.2, top: 0.2, width: 0.4, height: 0.4 };
    const grown = applyDrag( start, "top-left", -0.1, -0.1 );
    expect( grown ).toEqual( { left: expect.closeTo( 0.1 ), top: expect.closeTo( 0.1 ),
      width: expect.closeTo( 0.5 ), height: expect.closeTo( 0.5 ) } );
    const crushed = applyDrag( start, "bottom-right", -1, -1 );
    expect( crushed.width ).toBeCloseTo( 0.08 );
    expect( crushed.left ).toBeCloseTo( 0.2 );
  } );

  test( "only plausible subjects are offered", () => {
    const out = usableSubjects( [
      { left: 0, top: 0, width: 1, height: 1 },
      { left: 0.1, top: 0.1, width: 0.3, height: 0.3 },
      { left: 0.5, top: 0.5, width: 0.05, height: 0.05 },
    ] );
    expect( out ).toHaveLength( 1 );
  } );
} );
