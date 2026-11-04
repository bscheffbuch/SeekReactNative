import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import i18n from "../../i18n";
import { useTheme } from "../Providers/ThemeProvider";
import { CheckIcon } from "./AppIcons";
import { useCommonNames } from "../../utility/customHooks/useCommonNames";
import type { PhotoPrediction } from "../../utility/combinePredictions";

const RANK_NAMES: Record<number, string> = {
  10: "species",
  20: "genus",
  30: "family",
  40: "order",
  50: "class",
  60: "phylum",
  70: "kingdom",
};

interface Props<P extends PhotoPrediction> {
  choices: P[];
  selectedId?: number | null;
  onSelect: ( choice: P ) => void;
  disabled?: boolean;
  // hide the score bar (taxa from a search have no score)
  showScores?: boolean;
  // names already known (from a search), used before the app's own
  knownNames?: Record<number, string | null | undefined>;
}

// The taxa a user can pick from, as a single-choice list: name, rank above species, score.
const TaxonChoiceList = <P extends PhotoPrediction>( {
  choices,
  selectedId,
  onSelect,
  disabled = false,
  showScores = true,
  knownNames,
}: Props<P> ) => {
  const { theme } = useTheme( );
  const styles = useMemo( ( ) => makeStyles( theme ), [theme] );
  const names = useCommonNames( choices.map( c => c.taxon_id ) );

  return (
    <View accessibilityRole="radiogroup">
      {choices.map( ( choice, i ) => {
        const common = knownNames?.[choice.taxon_id] || names[choice.taxon_id];
        const selected = choice.taxon_id === selectedId;
        const rank = choice.rank_level !== 10 && RANK_NAMES[choice.rank_level]
          ? i18n.t( `camera.${RANK_NAMES[choice.rank_level]}` )
          : null;
        const score = Math.round( Math.min( 100, Math.max( 0, choice.combined_score ) ) );
        const secondary = [common ? choice.name : null, rank].filter( Boolean ).join( " · " );
        return (
          <Pressable
            accessibilityLabel={[common || choice.name, rank, showScores ? `${score}%` : null].filter( Boolean ).join( ", " )}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            key={choice.taxon_id}
            onPress={( ) => onSelect( choice )}
            style={( { pressed } ) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}
          >
            <View style={[styles.check, selected && styles.checkSelected]}>
              {selected ? <CheckIcon color={theme.colors.onPrimary} size={14} strokeWidth={3} /> : null}
            </View>
            <View style={styles.names}>
              <Text numberOfLines={1} style={styles.common}>{common || choice.name}</Text>
              {secondary ? <Text numberOfLines={1} style={styles.sci}>{secondary}</Text> : null}
            </View>
            {showScores && (
              <>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${score}%` }]} />
                </View>
                <Text style={styles.pct}>{`${score}%`}</Text>
              </>
            )}
          </Pressable>
        );
      } )}
    </View>
  );
};

const makeStyles = ( theme: any ) => StyleSheet.create( {
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 56, paddingVertical: 6 },
  divider: { borderTopColor: theme.colors.outlineVariant, borderTopWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.7 },
  check: {
    alignItems: "center",
    borderColor: theme.colors.outline,
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  checkSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  names: { flex: 1, minWidth: 0 },
  common: { color: theme.colors.text, fontFamily: theme.typography.heading, fontSize: 16, lineHeight: 20 },
  sci: { color: theme.colors.onSurfaceVariant, fontFamily: theme.typography.body, fontSize: 13, fontStyle: "italic" },
  barTrack: { backgroundColor: theme.colors.secondaryContainer, borderRadius: 2, height: 4, overflow: "hidden", width: 56 },
  barFill: { backgroundColor: theme.colors.primary, borderRadius: 2, height: 4 },
  pct: { color: theme.colors.text, fontFamily: theme.typography.heading, fontSize: 14, textAlign: "right", width: 40 },
} );

export default TaxonChoiceList;
