// Combines the classifier's results for several photos of the same organism into one
// result. Each photo's predictions are its best branch: life down to the top leaf, every
// node scored with the summed score of its subtree (0-100). A taxon's combined score is
// its mean over all photos, counting 0 for a photo whose best branch doesn't contain it.
// That undercounts a taxon a photo ranked second, so photos that disagree on the species
// but agree on the genus end up at the genus, and ancestors still score at least as high
// as their descendants.

export interface PhotoPrediction {
  taxon_id: number;
  name: string;
  rank_level: number;
  combined_score: number;
  ancestor_ids: number[];
  score?: number;
  vision_score?: number;
  geo_score?: number | null;
  rank?: unknown;
}

export interface CombinedPredictions<P extends PhotoPrediction> {
  // best first; same shape as one photo's predictions
  predictions: P[];
  // for each prediction's taxon: how many photos have it in their best branch
  agreement: Record<number, number>;
  photoCount: number;
}

const mean = ( values: number[], count: number ) => values.reduce( ( sum, v ) => sum + v, 0 ) / count;

const combinePredictions = <P extends PhotoPrediction>(
  perPhoto: P[][]
): CombinedPredictions<P> => {
  const photoCount = perPhoto.length;
  const byTaxon = new Map<number, P[]>( );
  perPhoto.forEach( ( predictions ) => {
    predictions.forEach( ( prediction ) => {
      const seen = byTaxon.get( prediction.taxon_id ) || [];
      seen.push( prediction );
      byTaxon.set( prediction.taxon_id, seen );
    } );
  } );

  const agreement: Record<number, number> = {};
  const predictions: P[] = [];
  byTaxon.forEach( ( seen, taxonId ) => {
    agreement[taxonId] = seen.length;
    const combinedScore = mean( seen.map( p => p.combined_score ), photoCount );
    const combined: P = { ...seen[0], combined_score: combinedScore };
    if ( seen[0].score !== undefined ) {
      combined.score = mean( seen.map( p => p.score ?? 0 ), photoCount );
    }
    if ( seen[0].vision_score !== undefined ) {
      combined.vision_score = mean( seen.map( p => p.vision_score ?? 0 ), photoCount );
    }
    const geoScores = seen.map( p => p.geo_score ).filter( ( g ): g is number => g != null );
    if ( seen[0].geo_score !== undefined ) {
      // the geomodel score depends on the place, not on the photo
      combined.geo_score = geoScores.length ? mean( geoScores, geoScores.length ) : null;
    }
    predictions.push( combined );
  } );

  // ancestors before descendants on equal scores, like a single photo's branch
  predictions.sort( ( a, b ) => b.combined_score - a.combined_score || b.rank_level - a.rank_level );
  return { predictions, agreement, photoCount };
};

// The photo that shows the taxon best, used as the observation's photo.
const bestPhotoFor = ( perPhoto: PhotoPrediction[][], taxonId: number ): number => {
  let best = 0;
  let bestScore = -1;
  perPhoto.forEach( ( predictions, index ) => {
    const score = predictions.find( p => p.taxon_id === taxonId )?.combined_score ?? 0;
    if ( score > bestScore ) {
      best = index;
      bestScore = score;
    }
  } );
  return best;
};

// The most specific taxon whose score clears the threshold; null if only life does.
// Mirrors how the Match screen picks the species or the ancestor to show.
const confidentTaxon = <P extends PhotoPrediction>( predictions: P[], threshold = 70 ): P | null => {
  const confident = predictions
    .filter( p => p.combined_score > threshold && p.rank_level !== 100 )
    .sort( ( a, b ) => a.rank_level - b.rank_level );
  return confident[0] || null;
};

// The taxon and its ancestors: the Match screen reads the lineage by rank, and combined
// predictions can hold several taxa of one rank.
const lineageOf = <P extends PhotoPrediction>( predictions: P[], taxon: P | null ): P[] => {
  if ( !taxon ) {
    return predictions;
  }
  const lineage = new Set( [...taxon.ancestor_ids, taxon.taxon_id] );
  return predictions.filter( p => lineage.has( p.taxon_id ) );
};

// The taxon with whichever of its ancestors the pool holds, for a taxon the pool may not
// contain itself (an alternative species from another photo or another mode of the model).
const lineageWith = <P extends PhotoPrediction>( pool: P[], taxon: P ): P[] => {
  const ancestors = new Set( taxon.ancestor_ids );
  const seen = new Set<number>( );
  const lineage = pool.filter( p => {
    if ( !ancestors.has( p.taxon_id ) || seen.has( p.taxon_id ) ) {
      return false;
    }
    seen.add( p.taxon_id );
    return true;
  } );
  return [...lineage, taxon];
};

// What a user can pick from: the confident taxon of the best branch first (it can be a
// genus when the photos disagree), then the alternative species, best first. One entry
// per taxon; life is never offered.
const taxonChoices = <P extends PhotoPrediction>( branch: P[], alternatives: P[], limit = 10 ): P[] => {
  const choices: P[] = [];
  const add = ( p: P | null | undefined ) => {
    if ( p && p.rank_level !== 100 && !choices.some( c => c.taxon_id === p.taxon_id ) ) {
      choices.push( p );
    }
  };
  add( confidentTaxon( branch ) );
  [...alternatives].sort( ( a, b ) => b.combined_score - a.combined_score ).forEach( add );
  // nothing confident and no alternatives: still offer the branch's most specific taxon
  if ( choices.length === 0 ) {
    add( [...branch].sort( ( a, b ) => a.rank_level - b.rank_level )[0] );
  }
  return choices.slice( 0, limit );
};

export { combinePredictions, bestPhotoFor, confidentTaxon, lineageOf, lineageWith, taxonChoices };
