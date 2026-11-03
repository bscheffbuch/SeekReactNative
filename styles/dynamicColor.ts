import { NativeModules, Platform } from "react-native";

import type { ThemeTokens } from "./theme";

/**
 * Material You: Android 12+ exposes tonal palettes generated from the wallpaper
 * (system_accent1..3 and system_neutral1..2, tones 0-1000). The native module
 * SeekDynamicColors hands them over as hex strings; here they are mapped onto the
 * Material 3 color roles the app uses, for light and dark.
 */

type Palette = Record<string, string>;
type Group = "accent1" | "accent2" | "accent3" | "neutral1" | "neutral2";

// system palette tone keys -> M3 tone (lightness 0-100)
const TONE_KEYS: [number, number][] = [
  [0, 100], [10, 99], [50, 95], [100, 90], [200, 80], [300, 70], [400, 60],
  [500, 50], [600, 40], [700, 30], [800, 20], [900, 10], [1000, 0],
];

let cached: Palette | null | undefined;

export const getDynamicPalette = ( ): Palette | null => {
  if ( cached !== undefined ) {
    return cached;
  }
  cached = null;
  if ( Platform?.OS !== "android" ) {
    return cached;
  }
  try {
    const mod = NativeModules?.SeekDynamicColors;
    const constants = typeof mod?.getConstants === "function" ? mod.getConstants( ) : mod;
    const palette = constants?.palette;
    if ( palette && typeof palette === "object" && Object.keys( palette ).length > 0 ) {
      cached = palette as Palette;
    }
  } catch {
    cached = null;
  }
  return cached;
};

const hexToRgb = ( hex: string ) => {
  const n = parseInt( hex.replace( "#", "" ), 16 );
  return [( n >> 16 ) & 255, ( n >> 8 ) & 255, n & 255];
};

const rgbToHex = ( [r, g, b]: number[] ) => `#${[r, g, b]
  .map( v => Math.round( Math.min( 255, Math.max( 0, v ) ) ).toString( 16 ).padStart( 2, "0" ) )
  .join( "" )
  .toUpperCase( )}`;

/** Color at an M3 tone (0-100) of a system palette, interpolating between the published tones. */
const tone = ( palette: Palette, group: Group, t: number ): string => {
  for ( let i = 0; i < TONE_KEYS.length - 1; i += 1 ) {
    const [keyA, toneA] = TONE_KEYS[i];
    const [keyB, toneB] = TONE_KEYS[i + 1];
    if ( t <= toneA && t >= toneB ) {
      const a = palette[`${group}_${keyA}`];
      const b = palette[`${group}_${keyB}`];
      if ( !a || !b ) {
        return a || b || "#808080";
      }
      const f = toneA === toneB ? 0 : ( toneA - t ) / ( toneA - toneB );
      const ca = hexToRgb( a );
      const cb = hexToRgb( b );
      return rgbToHex( ca.map( ( v, k ) => v + ( cb[k] - v ) * f ) );
    }
  }
  return palette[`${group}_500`] || "#808080";
};

export const withAlpha = ( hex: string, alpha: number ) => {
  const [r, g, b] = hexToRgb( hex );
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** The base theme with its colors replaced by the wallpaper-derived M3 roles. */
export const applyDynamicColors = ( base: ThemeTokens, palette: Palette ): ThemeTokens => {
  const p = ( group: Group, t: number ) => tone( palette, group, t );
  const dark = base.isDark;
  const primary = dark ? p( "accent1", 80 ) : p( "accent1", 40 );
  const onPrimary = dark ? p( "accent1", 20 ) : p( "accent1", 100 );
  const colors = {
    ...base.colors,
    canvas: dark ? p( "neutral1", 6 ) : p( "neutral1", 98 ),
    surface: dark ? p( "neutral1", 10 ) : p( "neutral1", 96 ),
    elevatedSurface: dark ? p( "neutral1", 12 ) : p( "neutral1", 94 ),
    primary,
    primaryContainer: dark ? p( "accent1", 30 ) : p( "accent1", 90 ),
    text: dark ? p( "neutral1", 90 ) : p( "neutral1", 10 ),
    muted: dark ? p( "neutral2", 80 ) : p( "neutral2", 30 ),
    border: dark ? p( "neutral1", 17 ) : p( "neutral1", 90 ),
    // one accent color across the app: the primary
    accent: primary,
    inverseText: onPrimary,
    pressed: withAlpha( primary, 0.12 ),
    onPrimary,
    onPrimaryContainer: dark ? p( "accent1", 90 ) : p( "accent1", 10 ),
    secondaryContainer: dark ? p( "accent2", 30 ) : p( "accent2", 90 ),
    onSecondaryContainer: dark ? p( "accent2", 90 ) : p( "accent2", 10 ),
    tertiary: primary,
    tertiaryContainer: dark ? p( "accent1", 30 ) : p( "accent1", 90 ),
    onTertiaryContainer: dark ? p( "accent1", 90 ) : p( "accent1", 10 ),
    surfaceContainerLow: dark ? p( "neutral1", 10 ) : p( "neutral1", 96 ),
    surfaceContainer: dark ? p( "neutral1", 12 ) : p( "neutral1", 94 ),
    surfaceContainerHigh: dark ? p( "neutral1", 17 ) : p( "neutral1", 92 ),
    surfaceContainerHighest: dark ? p( "neutral1", 22 ) : p( "neutral1", 90 ),
    onSurfaceVariant: dark ? p( "neutral2", 80 ) : p( "neutral2", 30 ),
    outline: dark ? p( "neutral2", 60 ) : p( "neutral2", 50 ),
    outlineVariant: dark ? p( "neutral2", 30 ) : p( "neutral2", 80 ),
  };
  return { ...base, colors };
};

/** The base theme with a generated M3 accent scheme (styles/accentPalettes.ts) applied. */
export const applyAccentRoles = ( base: ThemeTokens, r: Record<string, string> ): ThemeTokens => ( {
  ...base,
  colors: {
    ...base.colors,
    canvas: r.surface,
    surface: r.surfaceContainerLow,
    elevatedSurface: r.surfaceContainer,
    primary: r.primary,
    primaryContainer: r.primaryContainer,
    text: r.onSurface,
    muted: r.onSurfaceVariant,
    border: base.isDark ? r.surfaceContainerHigh : r.surfaceContainerHighest,
    accent: r.primary,
    inverseText: r.onPrimary,
    pressed: withAlpha( r.primary, 0.12 ),
    onPrimary: r.onPrimary,
    onPrimaryContainer: r.onPrimaryContainer,
    secondaryContainer: r.secondaryContainer,
    onSecondaryContainer: r.onSecondaryContainer,
    tertiary: r.primary,
    tertiaryContainer: r.primaryContainer,
    onTertiaryContainer: r.onPrimaryContainer,
    surfaceContainerLow: r.surfaceContainerLow,
    surfaceContainer: r.surfaceContainer,
    surfaceContainerHigh: r.surfaceContainerHigh,
    surfaceContainerHighest: r.surfaceContainerHighest,
    onSurfaceVariant: r.onSurfaceVariant,
    outline: r.outline,
    outlineVariant: r.outlineVariant,
  },
} );
