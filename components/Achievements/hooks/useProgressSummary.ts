import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import Realm from "realm";

import realmConfig from "../../../models";

export interface ProgressLevel {
  intlName: string;
  earnedIconName: string;
  count: number;
}

export interface ProgressSummary {
  loaded: boolean;
  level: ProgressLevel | null;
  // species count needed for the next level; null when the max level is reached
  nextLevelCount: number | null;
  speciesCount: number;
  badgesEarned: number;
  challengesInProgress: number;
}

const emptySummary: ProgressSummary = {
  loaded: false,
  level: null,
  nextLevelCount: null,
  speciesCount: 0,
  badgesEarned: 0,
  challengesInProgress: 0,
};

const readSummary = ( realm: Realm ): ProgressSummary => {
  const badges = realm.objects( "BadgeRealm" );
  const levelsEarned = badges
    .filtered( "iconicTaxonName == null AND earned == true" )
    .sorted( "count", true );
  const nextLevel = badges
    .filtered( "iconicTaxonName == null AND earned == false" )
    .sorted( "count" );
  const current = levelsEarned[0] as unknown as ProgressLevel | undefined;
  const next = nextLevel[0] as unknown as ProgressLevel | undefined;

  return {
    loaded: true,
    level: current
      ? {
        intlName: current.intlName,
        earnedIconName: current.earnedIconName,
        count: current.count,
      }
      : null,
    nextLevelCount: next ? next.count : null,
    speciesCount: realm.objects( "TaxonRealm" ).length,
    badgesEarned: badges.filtered( "iconicTaxonName != null AND earned == true" ).length,
    challengesInProgress: realm
      .objects( "ChallengeRealm" )
      .filtered( "startedDate != null AND percentComplete != 100" ).length,
  };
};

/**
 * Snapshot of the user's progress for Home and More.
 * Re-reads on every focus so counts are fresh after returning from the
 * camera, a match, or a challenge.
 */
const useProgressSummary = ( ): ProgressSummary => {
  const [summary, setSummary] = useState<ProgressSummary>( emptySummary );

  useFocusEffect(
    useCallback( ( ) => {
      let isCurrent = true;
      Realm.open( realmConfig )
        .then( ( realm ) => {
          if ( isCurrent ) {
            setSummary( readSummary( realm ) );
          }
        } )
        .catch( ( e ) => {
          console.log( e, "couldn't open realm: progress summary" );
          if ( isCurrent ) {
            setSummary( { ...emptySummary, loaded: true } );
          }
        } );
      return ( ) => {
        isCurrent = false;
      };
    }, [] )
  );

  return summary;
};

export { readSummary };
export default useProgressSummary;
