import React from "react";
import { render, screen, fireEvent } from "tests/jest-utils";
import { Alert } from "react-native";

import LanguagePicker from "../../../../components/Settings/LanguagePicker";
import { toggleLanguage } from "../../../../utility/settingsHelpers";

// Mock the hooks; getLanguage must resolve a real language, because
// LanguageProvider ignores the jest-utils value override and loads its
// preference through this helper — with the automock the picker would
// stay disabled forever
jest.mock( "../../../../utility/settingsHelpers", () => ( {
  getLanguage: jest.fn( async () => "en" ),
  toggleLanguage: jest.fn(),
} ) );

const renderPicker = () => {
  render( <LanguagePicker /> );
};

const pickerID = "picker";
const newLanguage = "es";
describe( "LanguagePicker", () => {
  test( "should render correctly", async () => {
    renderPicker();
    await screen.findByTestId( pickerID );
    const picker = screen.getByTestId( pickerID );
    expect( picker ).toBeTruthy();
    expect( screen.getByText( "Use device language settings" ) ).toBeTruthy();
    expect( screen ).toMatchSnapshot();
  } );

  test( "should open confirmation alert when a language is selected", async () => {
    const alertSpy = jest.spyOn( Alert, "alert" );
    alertSpy.mockClear();
    renderPicker();
    const picker = await screen.findByTestId( pickerID );

    // wait for the language preference to load and enable the picker
    await screen.findByText( "English" );
    // Opening the picker sheet shows no alert yet
    fireEvent.press( picker );
    expect( alertSpy ).not.toHaveBeenCalled();
    // Tapping an option commits the choice and asks for confirmation
    fireEvent.press( await screen.findByText( "Español" ) );
    expect( alertSpy ).toHaveBeenCalledTimes( 1 );
  } );

  test( "should call the language change hook with the new language", async () => {
    const alertSpy = jest.spyOn( Alert, "alert" );
    alertSpy.mockClear();
    renderPicker();
    const picker = await screen.findByTestId( pickerID );

    await screen.findByText( "English" );
    fireEvent.press( picker );
    fireEvent.press( await screen.findByText( "Español" ) );

    // This is a press of the Confirm button on the Alert
    alertSpy.mock.calls[0][2][1].onPress();

    // Expect hook to be called with the new language
    expect( jest.isMockFunction( toggleLanguage ) ).toBeTruthy();
    expect( toggleLanguage ).toBeCalledWith( newLanguage );
  } );

} );
