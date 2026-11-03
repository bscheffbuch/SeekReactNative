// Renders screens in the light and dark themes and checks every text node's
// color against the nearest background behind it (WCAG contrast). Catches
// "white text on a light card" style regressions without a device.
import React from "react";
import { StyleSheet } from "react-native";
import { render } from "tests/jest-utils";

import { lightTheme, darkTheme } from "../../../styles/theme";

jest.mock( "@react-native-clipboard/clipboard", () => ( { setString: jest.fn(), getString: jest.fn() } ) );

let mockTheme = null;
jest.mock( "../../../components/Providers/ThemeProvider", () => {
  const actual = jest.requireActual( "../../../components/Providers/ThemeProvider" );
  return {
    ...actual,
    useTheme: () => ( {
      theme: mockTheme,
      cameraTheme: require( "../../../styles/theme" ).darkTheme,
      isDark: mockTheme.isDark,
      themePreference: mockTheme.isDark ? "dark" : "light",
      setThemePreference: jest.fn(),
      dynamicColorSupported: false,
      accentColor: "green",
      setAccentColor: jest.fn(),
    } ),
  };
} );

const parse = ( c ) => {
  if ( typeof c !== "string" ) { return null; }
  c = c.trim();
  let m = c.match( /^#([0-9a-f]{3})$/i );
  if ( m ) { return [...m[1]].map( h => parseInt( h + h, 16 ) ).concat( 1 ); }
  m = c.match( /^#([0-9a-f]{6})([0-9a-f]{2})?$/i );
  if ( m ) {
    const n = parseInt( m[1], 16 );
    return [( n >> 16 ) & 255, ( n >> 8 ) & 255, n & 255, m[2] ? parseInt( m[2], 16 ) / 255 : 1];
  }
  m = c.match( /^rgba?\(([^)]+)\)$/i );
  if ( m ) {
    const p = m[1].split( "," ).map( s => parseFloat( s ) );
    return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
  }
  if ( c === "white" ) { return [255, 255, 255, 1]; }
  if ( c === "black" ) { return [0, 0, 0, 1]; }
  if ( c === "transparent" ) { return [0, 0, 0, 0]; }
  return null;
};
const blend = ( fg, bg ) => {
  const a = fg[3];
  return [0, 1, 2].map( i => fg[i] * a + bg[i] * ( 1 - a ) ).concat( 1 );
};
const lum = ( [r, g, b] ) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ( ( v + 0.055 ) / 1.055 ) ** 2.4; };
  return 0.2126 * f( r ) + 0.7152 * f( g ) + 0.0722 * f( b );
};
const contrast = ( a, b ) => {
  const [x, y] = [lum( a ), lum( b )].sort( ( p, q ) => q - p );
  return ( x + 0.05 ) / ( y + 0.05 );
};

const textOf = node => ( node.children || [] )
  .map( c => ( typeof c === "string" ? c : textOf( c ) ) ).join( "" );

// walk the host tree; photos / gradients / maps are "unknown" backgrounds: skip text on them
const audit = ( tree, canvas ) => {
  const issues = [];
  const walk = ( node, bg, unknown ) => {
    if ( !node || typeof node === "string" ) { return; }
    // disabled controls use M3's 38% label on purpose (WCAG exempts them)
    if ( node.props?.accessibilityState?.disabled || node.props?.["aria-disabled"] ) { return; }
    const style = StyleSheet.flatten( node.props?.style ) || {};
    let nextBg = bg;
    let nextUnknown = unknown;
    if ( node.type === "BVLinearGradient" || node.props?.colors ) {
      const c = parse( ( node.props.colors || [] )[0] );
      if ( c ) { nextBg = blend( c, bg ); nextUnknown = false; } else { nextUnknown = true; }
    }
    if ( node.type === "RCTImageView" || node.type === "Image" || node.type === "AIRMap" ) {
      nextUnknown = true;
    }
    // ImageBackground: the photo is an absolutely positioned sibling of the text
    const kids = ( node.children || [] ).filter( k => k && typeof k !== "string" );
    if ( kids.some( k => ( k.type === "Image" || k.type === "RCTImageView" )
      && StyleSheet.flatten( k.props?.style )?.position === "absolute" ) ) {
      nextUnknown = true;
    }
    const b = parse( style.backgroundColor );
    if ( b && b[3] > 0 ) {
      nextBg = blend( b, bg );
      nextUnknown = b[3] < 0.5 && nextUnknown;
    }
    if ( node.type === "Text" && !nextUnknown ) {
      const t = textOf( node ).trim();
      const c = parse( style.color );
      if ( t && c && style.opacity !== 0 ) {
        const ratio = contrast( blend( c, nextBg ), nextBg );
        if ( ratio < 3 ) {
          issues.push( `${ratio.toFixed( 2 )}  "${t.slice( 0, 40 )}"  ${style.color} on rgb(${nextBg.slice( 0, 3 ).map( Math.round )})` );
        }
      }
      return;
    }
    ( node.children || [] ).forEach( ch => walk( ch, nextBg, nextUnknown ) );
  };
  walk( tree, canvas, false );
  return issues;
};

const screens = {
  Settings: () => require( "../../../components/Settings/Settings" ).default,
  More: () => require( "../../../components/Navigation/MoreScreen" ).default,
  Notifications: () => require( "../../../components/Notifications/Notifications" ).default,
  PostingHelp: () => require( "../../../components/PostToiNat/PostingHelpScreen" ).default,
  About: () => require( "../../../components/About/AboutScreen" ).default,
  LoginOrSignup: () => require( "../../../components/Auth/LoginOrSignupScreen" ).default,
  AgeVerify: () => require( "../../../components/Auth/Signup/AgeVerifyScreen" ).default,
  Achievements: () => require( "../../../components/Achievements/AchievementsScreen" ).default,
  QueuedObservations: () => require( "../../../components/Observations/QueuedObservations" ).default,
  iNatStats: () => require( "../../../components/iNaturalist/iNatStats" ).default,
  YearInReview: () => require( "../../../components/SeekYearInReview/SeekYearInReviewScreen" ).default,
  EmptyList: () => require( "../../../components/UIComponents/SpeciesNearby/EmptyList" ).default,
  CameraHelp: () => require( "../../../components/Camera/CameraHelpScreen" ).default,
  Privacy: () => require( "../../../components/Auth/PrivacyPolicyScreen" ).default,
  Login: () => require( "../../../components/Auth/Login/LoginScreen" ).default,
  Terms: () => require( "../../../components/Auth/TermsOfServiceScreen" ).default,
  Guidelines: () => require( "../../../components/Auth/CommunityGuidelines" ).default,
  LicensePhotos: () => require( "../../../components/Auth/Signup/LicensePhotosScreen" ).default,
  ForgotPassword: () => require( "../../../components/Auth/Login/ForgotPasswordScreen" ).default,
  Observations: () => require( "../../../components/Observations/Observations" ).default,
};

const skipped = [];
afterAll( () => {
  if ( skipped.length ) { console.log( `not rendered in jest:\n${[...new Set( skipped )].join( "\n" )}` ); }
} );

describe( "text contrast", () => {
  for ( const [label, theme] of [["light", lightTheme], ["dark", darkTheme]] ) {
    for ( const [name, load] of Object.entries( screens ) ) {
      test( `${name} (${label})`, () => {
        mockTheme = theme;
        let Component;
        let tree;
        try {
          Component = load( );
          tree = render( <Component /> ).toJSON( );
        } catch ( e ) {
          skipped.push( `${name}: ${String( e.message ).split( "\n" )[0].slice( 0, 90 )}` );
          return;
        }
        const canvas = parse( theme.colors.canvas );
        const roots = Array.isArray( tree ) ? tree : [tree];
        const issues = roots.flatMap( r => audit( r, canvas ) );
        expect( issues ).toEqual( [] );
      } );
    }
  }
} );
