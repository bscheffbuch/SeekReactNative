import {
  combinePredictions,
  bestPhotoFor,
  confidentTaxon,
  lineageOf,
  lineageWith,
  taxonChoices,
} from "../../../utility/combinePredictions";

// one best branch: life > genus > species, scores as the plugin returns them (0-100)
const branch = ( genus, species, scores ) => [
  { taxon_id: 48460, name: "Life", rank_level: 100, combined_score: 100, ancestor_ids: [] },
  { taxon_id: genus.id, name: genus.name, rank_level: 20, combined_score: scores[0], ancestor_ids: [48460] },
  {
    taxon_id: species.id,
    name: species.name,
    rank_level: 10,
    combined_score: scores[1],
    ancestor_ids: [48460, genus.id],
  },
];

const parus = { id: 1, name: "Parus" };
const major = { id: 11, name: "Parus major" };
const minor = { id: 12, name: "Parus minor" };

describe( "combinePredictions", ( ) => {
  it( "averages a taxon over all photos", ( ) => {
    const { predictions, agreement, photoCount } = combinePredictions( [
      branch( parus, major, [90, 80] ),
      branch( parus, major, [96, 94] ),
    ] );
    expect( photoCount ).toBe( 2 );
    expect( predictions.find( p => p.taxon_id === 11 ).combined_score ).toBeCloseTo( 87 );
    expect( agreement[11] ).toBe( 2 );
  } );

  it( "counts a photo that picked another species as 0 for the species", ( ) => {
    const { predictions, agreement } = combinePredictions( [
      branch( parus, major, [95, 90] ),
      branch( parus, minor, [92, 60] ),
    ] );
    expect( predictions.find( p => p.taxon_id === 11 ).combined_score ).toBeCloseTo( 45 );
    expect( predictions.find( p => p.taxon_id === 1 ).combined_score ).toBeCloseTo( 93.5 );
    expect( agreement[11] ).toBe( 1 );
    expect( agreement[1] ).toBe( 2 );
    // disagreeing photos fall back to the genus they share
    expect( confidentTaxon( predictions ).taxon_id ).toBe( 1 );
  } );

  it( "keeps ancestors first on equal scores and sorts best first", ( ) => {
    const { predictions } = combinePredictions( [branch( parus, major, [80, 80] )] );
    expect( predictions.map( p => p.taxon_id ) ).toEqual( [48460, 1, 11] );
  } );

  it( "averages geo scores over the photos that have one", ( ) => {
    const withGeo = ( geo ) => branch( parus, major, [90, 90] ).map( p => ( { ...p, geo_score: geo } ) );
    const { predictions } = combinePredictions( [withGeo( 40 ), withGeo( null )] );
    expect( predictions.find( p => p.taxon_id === 11 ).geo_score ).toBe( 40 );
  } );

  it( "handles no photos", ( ) => {
    expect( combinePredictions( [] ).predictions ).toEqual( [] );
  } );
} );

describe( "bestPhotoFor", ( ) => {
  it( "picks the photo with the highest score for the taxon", ( ) => {
    const perPhoto = [
      branch( parus, minor, [90, 85] ),
      branch( parus, major, [95, 70] ),
      branch( parus, major, [97, 92] ),
    ];
    expect( bestPhotoFor( perPhoto, 11 ) ).toBe( 2 );
    expect( bestPhotoFor( perPhoto, 99 ) ).toBe( 0 );
  } );
} );

describe( "confidentTaxon", ( ) => {
  it( "returns the most specific taxon above the threshold", ( ) => {
    expect( confidentTaxon( branch( parus, major, [90, 75] ) ).taxon_id ).toBe( 11 );
    expect( confidentTaxon( branch( parus, major, [90, 65] ) ).taxon_id ).toBe( 1 );
  } );

  it( "never returns life", ( ) => {
    expect( confidentTaxon( branch( parus, major, [50, 40] ) ) ).toBeNull( );
  } );
} );

describe( "lineageOf", ( ) => {
  it( "keeps the taxon and its ancestors only", ( ) => {
    const { predictions } = combinePredictions( [
      branch( parus, major, [95, 90] ),
      branch( parus, minor, [92, 60] ),
    ] );
    const species = predictions.find( p => p.taxon_id === 11 );
    expect( lineageOf( predictions, species ).map( p => p.taxon_id ).sort( ) ).toEqual( [1, 11, 48460] );
    expect( lineageOf( predictions, null ) ).toHaveLength( 4 );
  } );
} );

describe( "lineageWith", ( ) => {
  it( "adds the pool's ancestors to a taxon the pool doesn't hold", ( ) => {
    const pool = branch( parus, major, [95, 90] );
    const alternative = { taxon_id: 12, name: "Parus minor", rank_level: 10, combined_score: 8, ancestor_ids: [48460, 1] };
    expect( lineageWith( pool, alternative ).map( p => p.taxon_id ) ).toEqual( [48460, 1, 12] );
  } );
} );

describe( "taxonChoices", ( ) => {
  const alternatives = [
    { taxon_id: 12, name: "Parus minor", rank_level: 10, combined_score: 20, ancestor_ids: [48460, 1] },
    { taxon_id: 11, name: "Parus major", rank_level: 10, combined_score: 70, ancestor_ids: [48460, 1] },
  ];

  it( "puts the confident taxon first, then the alternatives by score, once each", ( ) => {
    const choices = taxonChoices( branch( parus, major, [95, 90] ), alternatives );
    expect( choices.map( p => p.taxon_id ) ).toEqual( [11, 12] );
  } );

  it( "starts with the genus when the species isn't confident", ( ) => {
    const choices = taxonChoices( branch( parus, major, [95, 50] ), alternatives );
    expect( choices.map( p => p.taxon_id ) ).toEqual( [1, 11, 12] );
  } );

  it( "falls back to the most specific taxon of the branch", ( ) => {
    const choices = taxonChoices( branch( parus, major, [40, 30] ), [] );
    expect( choices.map( p => p.taxon_id ) ).toEqual( [11] );
  } );
} );
