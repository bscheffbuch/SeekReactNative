import React from "react";
import { render, screen } from "@testing-library/react-native";

import { AppHeader } from "../../../../components/UIComponents/AppPrimitives";

describe( "AppHeader", () => {
  test( "shows an unread notifications indicator", async () => {
    render( <AppHeader title="Home" notificationUnread /> );

    expect( await screen.findByTestId( "unreadNotificationsIndicator" ) ).toBeTruthy();
  } );
} );