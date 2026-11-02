import React, { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import i18n from "../../i18n";
import { SearchIcon, LeafIcon } from "../UIComponents/AppIcons";
import { useCommonName } from "../../utility/customHooks/useCommonName";
import { useTheme } from "../Providers/ThemeProvider";
import { makeThemedStyles } from "../../styles/themedStyles";
import type { ThemeTokens } from "../../styles/theme";

type Prediction = {
  name: string;
  taxon_id: number;
  rank_level: number;
};

type NameRow = { tag: string; label: string; name: string; scientific?: boolean };

const RANKS: [number, string][] = [
  [70, "kingdom"],
  [60, "phylum"],
  [50, "class"],
  [40, "order"],
  [30, "family"],
  [20, "genus"],
];

const appLanguage = ( ) => ( i18n.locale || "en" ).split( /[-_]/ )[0].toLowerCase( );

// Common names in German and English (and the app language, if it's another one)
// come from iNat when online; offline we show what the app already has.
const useTaxonNames = ( taxonId: number ) => {
  const [names, setNames] = useState<Record<string, string>>( {} );
  useEffect( ( ) => {
    if ( !taxonId ) {
      return undefined;
    }
    let cancelled = false;
    const controller = new AbortController( );
    const timer = setTimeout( ( ) => controller.abort( ), 8000 );
    fetch( `https://api.inaturalist.org/v1/taxa/${taxonId}?all_names=true`, { signal: controller.signal as RequestInit["signal"] } )
      .then( r => ( r.ok ? r.json( ) : null ) )
      .then( json => {
        const taxon = json?.results?.[0];
        if ( cancelled || !taxon?.names ) {
          return;
        }
        const found: Record<string, string> = {};
        taxon.names.forEach( ( n: { locale?: string; name: string; is_valid?: boolean } ) => {
          if ( n.locale && n.locale !== "sci" && !found[n.locale] && n.is_valid !== false ) {
            found[n.locale] = n.name;
          }
        } );
        setNames( found );
      } )
      .catch( ( ) => null )
      .finally( ( ) => clearTimeout( timer ) );
    return ( ) => {
      cancelled = true;
      controller.abort( );
    };
  }, [taxonId] );
  return names;
};

const getStyles = makeThemedStyles( ( theme: ThemeTokens ) => ( {
  card: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    marginBottom: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 44,
  },
  divider: {
    borderTopColor: theme.colors.outlineVariant,
    borderTopWidth: 1,
  },
  tag: {
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 6,
    color: theme.colors.onSecondaryContainer,
    fontFamily: theme.typography.heading,
    fontSize: 11,
    letterSpacing: 0.4,
    lineHeight: 20,
    overflow: "hidden",
    textAlign: "center",
    width: 36,
  },
  name: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.typography.body,
    fontSize: 16,
    lineHeight: 24,
  },
  primaryName: {
    fontFamily: theme.typography.heading,
    fontSize: 20,
  },
  scientific: {
    fontFamily: theme.typography.scientific,
  },
  links: {
    borderTopColor: theme.colors.outlineVariant,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingBottom: 12,
    paddingTop: 10,
  },
  linkButton: {
    alignItems: "center",
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 20,
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    height: 40,
    justifyContent: "center",
  },
  linkPressed: {
    opacity: 0.85,
  },
  linkText: {
    color: theme.colors.onSecondaryContainer,
    fontFamily: theme.typography.heading,
    fontSize: 14,
  },
  sectionTitle: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: theme.typography.heading,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  classCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    marginBottom: 12,
    paddingBottom: 14,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
  },
  cell: {
    paddingRight: theme.spacing.sm,
    width: "33.33%",
  },
  rank: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: theme.typography.body,
    fontSize: 11,
    lineHeight: 14,
    textTransform: "capitalize",
  },
  rankName: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 14,
    lineHeight: 20,
  },
} ) );

interface Props {
  taxonId: number;
  scientificName: string;
  predictions?: Prediction[];
}

const MatchDetails = ( { taxonId, scientificName, predictions = [] }: Props ) => {
  const { theme } = useTheme( );
  const styles = getStyles( theme );
  const localName = useCommonName( taxonId );
  const online = useTaxonNames( taxonId );
  const lang = appLanguage( );

  const rows: NameRow[] = [];
  const add = ( tag: string, label: string, name?: string | null ) => {
    if ( name && !rows.some( r => r.name === name && r.tag === tag ) ) {
      rows.push( { tag, label, name } );
    }
  };
  if ( lang !== "de" && lang !== "en" ) {
    add( lang.toUpperCase( ), lang, online[lang] || localName );
  }
  add( "DE", "Deutsch", online.de || ( lang === "de" ? localName : null ) );
  add( "EN", "English", online.en || ( lang === "en" ? localName : null ) );
  rows.push( { tag: "LAT", label: "Latin", name: scientificName, scientific: true } );

  const lineage = RANKS
    .map( ( [level, rank] ) => {
      const p = predictions.find( pred => pred.rank_level === level );
      return p ? { rank, name: p.name, level } : null;
    } )
    .filter( Boolean ) as { rank: string; name: string; level: number }[];

  const query = encodeURIComponent( scientificName );
  const openGoogle = ( ) => Linking.openURL( `https://www.google.com/search?q=${query}` );
  const openWikipedia = ( ) => Linking.openURL(
    `https://${lang}.wikipedia.org/wiki/Special:Search?search=${query}&go=Go`
  );

  return (
    <View>
      <View accessibilityLabel={i18n.t( "results.names", { defaultValue: "Names" } )} style={styles.card}>
        {rows.map( ( row, i ) => (
          <View key={`${row.tag}-${row.name}`} style={[styles.row, i > 0 && styles.divider]}>
            <Text accessibilityLabel={row.label} style={styles.tag}>{row.tag}</Text>
            <Text
              selectable
              style={[styles.name, i === 0 && styles.primaryName, row.scientific && styles.scientific]}
            >
              {row.name}
            </Text>
          </View>
        ) )}
        <View style={styles.links}>
          <Pressable
            accessibilityLabel={`Google: ${scientificName}`}
            accessibilityRole="link"
            onPress={openGoogle}
            style={( { pressed } ) => [styles.linkButton, pressed && styles.linkPressed]}
          >
            <SearchIcon color={theme.colors.onSecondaryContainer} size={18} />
            <Text style={styles.linkText}>Google</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Wikipedia: ${scientificName}`}
            accessibilityRole="link"
            onPress={openWikipedia}
            style={( { pressed } ) => [styles.linkButton, pressed && styles.linkPressed]}
          >
            <LeafIcon color={theme.colors.onSecondaryContainer} size={18} />
            <Text style={styles.linkText}>Wikipedia</Text>
          </Pressable>
        </View>
      </View>
      {lineage.length > 0 && (
        <View style={styles.classCard}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {i18n.t( "results.classification", { defaultValue: "Classification" } )}
          </Text>
          <View style={styles.grid}>
            {lineage.map( r => (
              <View key={r.rank} style={styles.cell}>
                <Text style={styles.rank}>{i18n.t( `camera.${r.rank}` )}</Text>
                <Text
                  numberOfLines={1}
                  style={[styles.rankName, r.level <= 20 && styles.scientific]}
                >
                  {r.name}
                </Text>
              </View>
            ) )}
          </View>
        </View>
      )}
    </View>
  );
};

export default MatchDetails;
