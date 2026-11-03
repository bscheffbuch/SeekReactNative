// Not part of the suite (.shot.js): renders screens and writes approximate HTML
// (React Native host tree -> flexbox divs) for screenshots in Chromium.
import React from "react";
import fs from "fs";
import path from "path";
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

const OUT = process.env.SHOT_DIR;
const ROOT = path.resolve( __dirname, "../../.." );
const px = new Set( ["width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight", "top", "left", "right", "bottom",
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight", "padding", "paddingTop", "paddingBottom",
  "paddingLeft", "paddingRight", "borderRadius", "borderWidth", "borderTopWidth", "borderBottomWidth", "borderLeftWidth",
  "borderRightWidth", "fontSize", "lineHeight", "gap", "rowGap", "columnGap", "borderTopLeftRadius",
  "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius", "letterSpacing", "flexBasis"] );
const kebab = k => k.replace( /[A-Z]/g, m => `-${m.toLowerCase()}` );
const argb = v => {
  if ( v && typeof v === "object" && "payload" in v ) { v = v.payload; }
  if ( typeof v !== "number" ) { return typeof v === "string" ? v : "currentColor"; }
  const a = ( ( v >>> 24 ) & 255 ) / 255;
  return `rgba(${( v >>> 16 ) & 255},${( v >>> 8 ) & 255},${v & 255},${a.toFixed( 3 )})`;
};
const esc = s => String( s ).replace( /&/g, "&amp;" ).replace( /</g, "&lt;" );

const css = ( style, isText ) => {
  const s = StyleSheet.flatten( style ) || {};
  const out = [];
  const add = ( k, v ) => {
    if ( v === undefined || v === null ) { return; }
    if ( typeof v === "number" && px.has( k ) ) { v = `${v}px`; }
    if ( typeof v === "object" ) { return; }
    out.push( `${kebab( k )}:${v}` );
  };
  for ( const [k, v] of Object.entries( s ) ) {
    if ( k === "paddingHorizontal" ) { add( "paddingLeft", v ); add( "paddingRight", v ); continue; }
    if ( k === "paddingVertical" ) { add( "paddingTop", v ); add( "paddingBottom", v ); continue; }
    if ( k === "marginHorizontal" ) { add( "marginLeft", v ); add( "marginRight", v ); continue; }
    if ( k === "marginVertical" ) { add( "marginTop", v ); add( "marginBottom", v ); continue; }
    if ( k === "marginStart" ) { add( "marginLeft", v ); continue; }
    if ( k === "marginEnd" ) { add( "marginRight", v ); continue; }
    if ( k === "fontFamily" ) { out.push( `font-family:'${v}',Roboto,'Noto Sans',sans-serif` ); continue; }
    if ( k === "flex" && typeof v === "number" ) { out.push( v > 0 ? `flex:${v} 1 0px` : "flex:0 0 auto" ); continue; }
    if ( /^(shadow|elevation|transform|tintColor|resizeMode|textAlignVertical|borderCurve|includeFontPadding)/.test( k ) ) { continue; }
    if ( k === "borderColor" ) { add( k, v ); continue; }
    if ( k === "borderWidth" ) { add( k, v ); out.push( "border-style:solid" ); continue; }
    if ( /border(Top|Bottom|Left|Right)Width/.test( k ) ) {
      add( k, v ); out.push( `${kebab( k ).replace( "-width", "-style" )}:solid` ); continue;
    }
    add( k, v );
  }
  if ( !isText && !( "flexDirection" in s ) ) { out.push( "flex-direction:column" ); }
  return out.join( ";" );
};

const toHtml = node => {
  if ( node === null || node === undefined ) { return ""; }
  if ( typeof node === "string" ) { return esc( node ); }
  const p = node.props || {};
  const kids = ( node.children || [] ).map( toHtml ).join( "" );
  const t = node.type;
  if ( t === "Text" ) { return `<span class="t" style="${css( p.style, true )}">${kids}</span>`; }
  if ( t === "TextInput" ) {
    return `<div class="v" style="${css( p.style )}"><span class="t" style="opacity:.6">${esc( p.value || p.defaultValue || p.placeholder || "" )}</span></div>`;
  }
  if ( t === "Image" || t === "RCTImageView" ) {
    const src = Array.isArray( p.source ) ? p.source[0] : p.source;
    let url = "";
    if ( src?.testUri ) { url = `file://${path.join( ROOT, src.testUri )}`; } else if ( src?.uri && /^https?:/.test( src.uri ) ) { url = src.uri; }
    const st = css( p.style ) + ( url ? "" : ";background:#8884" );
    return url ? `<img style="${st};object-fit:${p.resizeMode === "cover" ? "cover" : "contain"}" src="${url}">` : `<div class="v" style="${st}"></div>`;
  }
  if ( /^RNSVG/.test( t ) ) {
    const a = [];
    const attr = ( k, v ) => { if ( v !== undefined && v !== null ) { a.push( `${k}="${esc( v )}"` ); } };
    if ( /SvgView/.test( t ) ) {
      const st = StyleSheet.flatten( p.style ) || {};
      attr( "width", p.bbWidth || st.width || p.width ); attr( "height", p.bbHeight || st.height || p.height );
      attr( "viewBox", p.minX !== undefined ? `${p.minX} ${p.minY} ${p.vbWidth} ${p.vbHeight}` : undefined );
      return `<svg ${a.join( " " )} style="flex:0 0 auto">${kids}</svg>`;
    }
    const tag = { RNSVGPath: "path", RNSVGCircle: "circle", RNSVGRect: "rect", RNSVGGroup: "g", RNSVGLine: "line", RNSVGEllipse: "ellipse" }[t] || "g";
    attr( "d", p.d ); attr( "cx", p.cx ); attr( "cy", p.cy ); attr( "r", p.r ); attr( "x", p.x ); attr( "y", p.y );
    attr( "width", p.width ); attr( "height", p.height ); attr( "rx", p.rx ); attr( "ry", p.ry );
    attr( "x1", p.x1 ); attr( "x2", p.x2 ); attr( "y1", p.y1 ); attr( "y2", p.y2 );
    if ( p.stroke !== undefined ) { attr( "stroke", argb( p.stroke ) ); }
    const own = k => !p.propList || p.propList.includes( k );
    if ( tag === "g" ) { attr( "fill", p.fill ? argb( p.fill ) : "none" ); } else if ( own( "fill" ) && p.fill && argb( p.fill ) !== "rgba(0,0,0,1.000)" ) {
      attr( "fill", argb( p.fill ) );
    }
    attr( "stroke-width", p.strokeWidth ); attr( "stroke-linecap", "round" ); attr( "stroke-linejoin", "round" );
    return `<${tag} ${a.join( " " )}>${kids}</${tag}>`;
  }
  if ( t === "BVLinearGradient" ) {
    const cs = ( p.colors || [] ).map( argb );
    return `<div class="v" style="${css( p.style )};background:linear-gradient(${cs.join( "," ) || "transparent,transparent"})">${kids}</div>`;
  }
  return `<div class="v" style="${css( p.style )}">${kids}</div>`;
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
  CameraHelp: () => require( "../../../components/Camera/CameraHelpScreen" ).default,
  Privacy: () => require( "../../../components/Auth/PrivacyPolicyScreen" ).default,
  Login: () => require( "../../../components/Auth/Login/LoginScreen" ).default,
  Terms: () => require( "../../../components/Auth/TermsOfServiceScreen" ).default,
  LicensePhotos: () => require( "../../../components/Auth/Signup/LicensePhotosScreen" ).default,
  Observations: () => require( "../../../components/Observations/Observations" ).default,
  SelectSpecies: () => {
    const C = require( "../../../components/PostToiNat/SelectSpecies" ).default;
    return () => <C toggleSpeciesModal={jest.fn()} image="x" updateTaxon={jest.fn()} seekId={{ name: "Quercus robur", preferredCommonName: "English Oak", taxaId: 49322 }} />;
  },
  ChallengeCardless: () => require( "../../../components/Achievements/AchievementsScreen" ).default,
};

describe( "screens", () => {
  for ( const [label, theme] of [["light", lightTheme], ["dark", darkTheme]] ) {
    for ( const [name, load] of Object.entries( screens ) ) {
      test( `${name} ${label}`, () => {
        mockTheme = theme;
        const C = load( );
        const tree = render( <C /> ).toJSON( );
        const body = ( Array.isArray( tree ) ? tree : [tree] ).map( toHtml ).join( "" );
        const html = `<!doctype html><html><head><meta charset="utf-8"><style>
          body{margin:0;width:412px;background:${theme.colors.canvas};font-family:Roboto,'Noto Sans',sans-serif;}
          .v{display:flex;box-sizing:border-box;position:relative;min-width:0;}
          .t{display:block;white-space:pre-wrap;} .t .t{display:inline;}
          img{box-sizing:border-box;display:block;}
        </style></head><body><div class="v" style="min-height:915px">${body}</div></body></html>`;
        fs.writeFileSync( path.join( OUT, `${name}-${label}.html` ), html );
      } );
    }
  }
} );
