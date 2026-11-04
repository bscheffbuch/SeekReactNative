// A taxon a user picks by hand (from the model's suggestions or an iNaturalist search),
// in the same shape as a model prediction so the observation code can treat both alike.
import inatjs from "inaturalistjs";

import { iconicTaxaIds } from "./dictionaries/taxonomyDicts";
import type { PhotoPrediction } from "./combinePredictions";

export interface TaxonChoice extends PhotoPrediction {
  // picked from a search, not from the model's suggestions
  fromSearch?: boolean;
}

const SEARCH_TIMEOUT_MS = 8000;

const iconicTaxonIdFor = ( ancestorIds: number[] ): number => (
  iconicTaxaIds.find( ( id: number ) => ancestorIds.includes( id ) ) || 1
);

interface ApiTaxon {
  id: number;
  name: string;
  rank_level: number;
  ancestor_ids?: number[];
  ancestors?: { id: number; name: string; rank_level: number }[];
}

// The taxon and its ancestors (as predictions, most general first) from iNaturalist.
// Rejects offline or after a timeout.
const fetchTaxonChoice = async ( id: number ): Promise<{ choice: TaxonChoice; lineage: TaxonChoice[] }> => {
  const timeout = new Promise<never>( ( _, reject ) => {
    setTimeout( ( ) => reject( new Error( "timeout" ) ), SEARCH_TIMEOUT_MS );
  } );
  const { results } = await Promise.race( [inatjs.taxa.fetch( id ), timeout] );
  const taxon: ApiTaxon | undefined = results?.[0];
  if ( !taxon ) {
    throw new Error( `taxon ${id} not found` );
  }
  // the API lists the taxon itself last
  const ancestorIds = ( taxon.ancestor_ids || [] ).filter( a => a !== taxon.id );
  const choice: TaxonChoice = {
    taxon_id: taxon.id,
    name: taxon.name,
    rank_level: taxon.rank_level,
    combined_score: 100,
    ancestor_ids: ancestorIds,
    fromSearch: true,
  };
  const ancestors = ( taxon.ancestors || [] ).map( ( a, i ) => ( {
    taxon_id: a.id,
    name: a.name,
    rank_level: a.rank_level,
    combined_score: 100,
    ancestor_ids: ancestorIds.slice( 0, i ),
  } ) );
  return { choice, lineage: [...ancestors, choice] };
};

export { fetchTaxonChoice, iconicTaxonIdFor };
