import { createHomeResetAction } from "../../../utility/navigationHelpers";

describe( "navigationHelpers", () => {
  test( "creates a reset action back to the Home tab", () => {
    expect( createHomeResetAction() ).toMatchObject( {
      type: "RESET",
      payload: {
        index: 0,
        routes: [{ name: "MainTabs", params: { screen: "Home" } }],
      },
    } );
  } );
} );