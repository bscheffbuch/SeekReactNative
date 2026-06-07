import React from "react";
import { render, screen } from "@testing-library/react-native";

import MoreScreen from "../../../../components/Navigation/MoreScreen";

describe( "MoreScreen", () => {
  test( "renders the secondary destination links", async () => {
    render( <MoreScreen /> );

    expect( await screen.findByText( "Achievements" ) ).toBeTruthy();
    expect( screen.getByText( "Queued Observations" ) ).toBeTruthy();
    expect( screen.getByText( "iNaturalist" ) ).toBeTruthy();
    expect( screen.getByText( "Settings" ) ).toBeTruthy();
    expect( screen.getByText( "About" ) ).toBeTruthy();
    expect( await screen.findByTestId( "unreadNotificationsIndicator" ) ).toBeTruthy();
  } );
} );