import { handleScanTabPress, tabLabels } from "../../../../components/Navigation/bottomTabHelpers";

describe( "bottom tab helpers", () => {
  test( "defines the five primary tab labels", () => {
    expect( tabLabels ).toEqual( {
      Home: "menu.home",
      Observations: "menu.observations",
      Scan: "menu.scan",
      Challenges: "menu.challenges",
      More: "menu.more",
    } );
  } );

  test( "Scan prevents tab selection and opens the root Camera screen", () => {
    const navigation = { navigate: jest.fn() };
    const event = { preventDefault: jest.fn() };

    handleScanTabPress( navigation )( event );

    expect( event.preventDefault ).toHaveBeenCalled();
    expect( navigation.navigate ).toHaveBeenCalledWith( "Camera" );
  } );
} );