import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import AppearanceSettings from "../../../../components/Settings/AppearanceSettings";

const mockSetThemePreference = jest.fn( () => Promise.resolve() );

jest.mock( "../../../../components/Providers/ThemeProvider", () => {
  const { lightTheme } = jest.requireActual( "../../../../styles/theme" );
  return {
    useTheme: () => ( {
      theme: lightTheme,
      themePreference: "system",
      setThemePreference: mockSetThemePreference,
    } ),
  };
} );

describe( "AppearanceSettings", () => {
  beforeEach( () => {
    mockSetThemePreference.mockClear();
  } );

  test( "persists the selected appearance override", async () => {
    render( <AppearanceSettings /> );

    fireEvent.press( screen.getByTestId( "appearance-dark" ) );

    await waitFor( () => {
      expect( mockSetThemePreference ).toHaveBeenCalledWith( "dark" );
    } );
  } );
} );