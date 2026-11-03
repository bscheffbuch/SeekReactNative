import type { MixedStyleRecord } from "react-native-render-html";

import type { ThemeTokens } from "./theme";

/**
 * react-native-render-html draws its own Text nodes, so StyledText's legacy color
 * mapping never runs and the baked-in ink color lands on the dark canvas. Give
 * every tag a theme color: links in primary, everything else in the text role.
 */
export const themeHtmlTags = ( tags: MixedStyleRecord, theme: ThemeTokens ): MixedStyleRecord =>
  Object.fromEntries( Object.entries( tags ).map( ( [tag, style] ) => [
    tag,
    { ...style, color: tag === "a" ? theme.colors.primary : theme.colors.text },
  ] ) );
