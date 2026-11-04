import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import inatjs from "inaturalistjs";

import i18n from "../../i18n";
import { useTheme } from "../Providers/ThemeProvider";
import { SearchIcon, XIcon } from "./AppIcons";
import TaxonChoiceList from "./TaxonChoiceList";
import { capitalizeNames } from "../../utility/helpers";
import { lineageWith } from "../../utility/combinePredictions";
import type { PhotoPrediction } from "../../utility/combinePredictions";
import { fetchTaxonChoice } from "../../utility/taxonChoice";
import type { TaxonChoice } from "../../utility/taxonChoice";

const SEARCH_DEBOUNCE_MS = 300;

interface SearchResult {
  choices: TaxonChoice[];
  names: Record<number, string | null>;
}

const NO_RESULTS: SearchResult = { choices: [], names: {} };

// iNaturalist's taxon autocomplete, debounced; species only when asked.
const useTaxonSearch = ( query: string, speciesOnly: boolean ) => {
  const [result, setResult] = useState<SearchResult>( NO_RESULTS );
  const [searching, setSearching] = useState( false );
  useEffect( ( ) => {
    const q = query.trim( );
    if ( q.length < 2 ) {
      setResult( NO_RESULTS );
      setSearching( false );
      return undefined;
    }
    let current = true;
    setSearching( true );
    const timer = setTimeout( ( ) => {
      inatjs.taxa.autocomplete( { q, per_page: 15, is_active: true, locale: i18n.locale } )
        .then( ( { results }: { results: any[] } ) => {
          if ( !current ) { return; }
          const found = ( results || [] ).filter( t => !speciesOnly || t.rank_level === 10 );
          const names: Record<number, string | null> = {};
          const choices = found.map( t => {
            names[t.id] = t.preferred_common_name ? capitalizeNames( t.preferred_common_name ) ?? null : null;
            return {
              taxon_id: t.id,
              name: t.name,
              rank_level: t.rank_level,
              combined_score: 0,
              ancestor_ids: ( t.ancestor_ids || [] ).filter( ( a: number ) => a !== t.id ),
              fromSearch: true,
            };
          } );
          setResult( { choices, names } );
        } )
        .catch( ( ) => {
          if ( current ) { setResult( NO_RESULTS ); }
        } )
        .finally( ( ) => {
          if ( current ) { setSearching( false ); }
        } );
    }, SEARCH_DEBOUNCE_MS );
    return ( ) => {
      current = false;
      clearTimeout( timer );
    };
  }, [query, speciesOnly] );
  return { ...result, searching };
};

interface Props {
  visible: boolean;
  onClose: ( ) => void;
  // the model's suggestions; empty for a saved observation
  suggestions?: PhotoPrediction[];
  selectedId?: number | null;
  // where a suggestion's ancestors are looked up (defaults to the suggestions)
  lineagePool?: PhotoPrediction[];
  // lineage: the taxon and its ancestors, most general first
  onSelect: ( choice: TaxonChoice, lineage: TaxonChoice[] ) => Promise<unknown> | void;
  // a saved observation can only be a species
  speciesOnly?: boolean;
}

// Pick another taxon for an observation: the model's suggestions, or any taxon from an
// iNaturalist search (online only).
const ChangeSpeciesSheet = ( {
  visible,
  onClose,
  suggestions = [],
  selectedId,
  lineagePool,
  onSelect,
  speciesOnly = false,
}: Props ) => {
  const { theme } = useTheme( );
  const styles = useMemo( ( ) => makeStyles( theme ), [theme] );
  const [query, setQuery] = useState( "" );
  const [busy, setBusy] = useState( false );
  const search = useTaxonSearch( query, speciesOnly );
  const offered = useMemo(
    ( ) => suggestions.filter( s => s.rank_level !== 100 && ( !speciesOnly || s.rank_level === 10 ) ),
    [suggestions, speciesOnly]
  );

  useEffect( ( ) => {
    if ( !visible ) {
      setQuery( "" );
      setBusy( false );
    }
  }, [visible] );

  const apply = async ( choice: TaxonChoice ) => {
    if ( choice.taxon_id === selectedId ) {
      onClose( );
      return;
    }
    setBusy( true );
    try {
      if ( choice.fromSearch ) {
        const fetched = await fetchTaxonChoice( choice.taxon_id );
        await onSelect( fetched.choice, fetched.lineage );
      } else {
        await onSelect( choice, lineageWith( ( lineagePool || suggestions ) as TaxonChoice[], choice ) );
      }
      onClose( );
    } catch {
      Alert.alert( i18n.t( "change_species.error_title" ), i18n.t( "change_species.error_message" ) );
    } finally {
      setBusy( false );
    }
  };

  const searching = query.trim( ).length >= 2;

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaProvider>
        <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel={i18n.t( "accessibility.back" )}
              accessibilityRole="button"
              onPress={onClose}
              style={styles.iconButton}
            >
              <XIcon color={theme.colors.text} size={24} strokeWidth={2} />
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>{i18n.t( "change_species.title" )}</Text>
          </View>
          <View style={styles.searchPill}>
            <SearchIcon color={theme.colors.onSurfaceVariant} size={22} strokeWidth={2.2} />
            <TextInput
              accessibilityLabel={i18n.t( "change_species.search" )}
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder={i18n.t( "change_species.search" )}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              returnKeyType="search"
              style={styles.input}
              value={query}
            />
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {searching ? (
              <View style={styles.card}>
                {search.searching && search.choices.length === 0
                  ? <ActivityIndicator color={theme.colors.primary} style={styles.loading} />
                  : search.choices.length === 0
                    ? <Text style={styles.empty}>{i18n.t( "change_species.no_results" )}</Text>
                    : (
                      <TaxonChoiceList
                        choices={search.choices}
                        disabled={busy}
                        knownNames={search.names}
                        onSelect={apply}
                        selectedId={selectedId}
                        showScores={false}
                      />
                    )}
              </View>
            ) : (
              <>
                {offered.length > 0 && (
                  <>
                    <Text style={styles.section}>{i18n.t( "change_species.suggestions" )}</Text>
                    <View style={styles.card}>
                      <TaxonChoiceList choices={offered} disabled={busy} onSelect={apply} selectedId={selectedId} />
                    </View>
                  </>
                )}
                <Text style={styles.hint}>{i18n.t( "change_species.search_hint" )}</Text>
              </>
            )}
          </ScrollView>
          {busy && (
            <View style={styles.busy}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const makeStyles = ( theme: any ) => StyleSheet.create( {
  screen: { backgroundColor: theme.colors.canvas, flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: 8, paddingBottom: 8, paddingHorizontal: 12, paddingTop: 12 },
  iconButton: { alignItems: "center", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  title: { color: theme.colors.text, flex: 1, fontFamily: theme.typography.body, fontSize: 22, lineHeight: 28 },
  searchPill: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 28,
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  input: { color: theme.colors.text, flex: 1, fontFamily: theme.typography.body, fontSize: 16 },
  content: { gap: 8, padding: 16 },
  section: { color: theme.colors.primary, fontFamily: theme.typography.heading, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  loading: { minHeight: 56 },
  empty: { color: theme.colors.onSurfaceVariant, fontFamily: theme.typography.body, fontSize: 14, paddingVertical: 16 },
  hint: { color: theme.colors.onSurfaceVariant, fontFamily: theme.typography.body, fontSize: 13, lineHeight: 18, marginTop: 8 },
  busy: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    justifyContent: "center",
  },
} );

export default ChangeSpeciesSheet;
