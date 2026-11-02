import { StyleSheet } from "react-native";

import type { ThemeTokens } from "./theme";

/**
 * Builds a component's StyleSheet once per theme instead of on every render.
 *
 *   const getStyles = makeThemedStyles( ( theme ) => ( { row: { gap: theme.spacing.sm } } ) );
 *   ...
 *   const styles = getStyles( theme );   // same object every render until the theme changes
 *
 * Besides skipping the allocation, stable style identities let memoized
 * children (React.memo, FlashList cells) skip re-renders. The factory must
 * depend only on the theme; styles that depend on props or layout stay inline.
 */
export const makeThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  factory: ( theme: ThemeTokens ) => T
): ( ( theme: ThemeTokens ) => T ) => {
  const cache = new WeakMap<ThemeTokens, T>( );
  return ( theme: ThemeTokens ): T => {
    let styles = cache.get( theme );
    if ( !styles ) {
      styles = StyleSheet.create( factory( theme ) );
      cache.set( theme, styles );
    }
    return styles;
  };
};
