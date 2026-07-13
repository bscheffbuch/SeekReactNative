import {
  coerceThemePreference,
  darkTheme,
  lightTheme,
  resolveThemeName,
  resolveThemeTokens,
} from "../../../styles/theme";

describe( "theme tokens", () => {
  test( "resolves system preference from the device color scheme", () => {
    expect( resolveThemeName( "system", "dark" ) ).toBe( "dark" );
    expect( resolveThemeName( "system", "light" ) ).toBe( "light" );
    expect( resolveThemeName( "system", null ) ).toBe( "light" );
  } );

  test( "explicit preferences override system color scheme", () => {
    expect( resolveThemeTokens( "light", "dark" ) ).toBe( lightTheme );
    expect( resolveThemeTokens( "dark", "light" ) ).toBe( darkTheme );
  } );

  test( "coerces invalid stored preferences to system", () => {
    expect( coerceThemePreference( "dark" ) ).toBe( "dark" );
    expect( coerceThemePreference( "sepia" ) ).toBe( "system" );
    expect( coerceThemePreference( undefined ) ).toBe( "system" );
  } );
} );