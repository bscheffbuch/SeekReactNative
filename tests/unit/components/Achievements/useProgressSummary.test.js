import { readSummary } from "../../../../components/Achievements/hooks/useProgressSummary";

// Minimal stand-in for a Realm results collection that understands the
// handful of queries readSummary issues.
const collection = ( items ) => {
  const results = [...items];
  results.filtered = ( query ) => {
    const matches = items.filter( ( item ) => {
      if ( query.includes( "iconicTaxonName == null" ) && item.iconicTaxonName != null ) { return false; }
      if ( query.includes( "iconicTaxonName != null" ) && item.iconicTaxonName == null ) { return false; }
      if ( query.includes( "earned == true" ) && !item.earned ) { return false; }
      if ( query.includes( "earned == false" ) && item.earned ) { return false; }
      if ( query.includes( "startedDate != null" ) && !item.startedDate ) { return false; }
      if ( query.includes( "percentComplete != 100" ) && item.percentComplete === 100 ) { return false; }
      return true;
    } );
    return collection( matches );
  };
  results.sorted = ( key, reverse = false ) => collection(
    [...items].sort( ( a, b ) => ( reverse ? b[key] - a[key] : a[key] - b[key] ) )
  );
  return results;
};

const level = ( name, count, earned ) => ( {
  intlName: `levels.${name}`,
  earnedIconName: `levelbadge-${count}`,
  count,
  earned,
  iconicTaxonName: null,
} );

const fakeRealm = ( { badges, taxa, challenges } ) => ( {
  objects: ( type ) => collection( {
    BadgeRealm: badges,
    TaxonRealm: taxa,
    ChallengeRealm: challenges,
  }[type] ),
} );

describe( "readSummary", () => {
  test( "reports current level, next threshold, and collection counts", () => {
    const summary = readSummary( fakeRealm( {
      badges: [
        level( "tadpole", 0, true ),
        level( "cub", 3, true ),
        level( "tracker", 15, false ),
        level( "surveyor", 35, false ),
        { iconicTaxonName: "birds", earned: true },
        { iconicTaxonName: "plants", earned: false },
      ],
      taxa: new Array( 7 ).fill( {} ),
      challenges: [
        { startedDate: new Date(), percentComplete: 40 },
        { startedDate: new Date(), percentComplete: 100 },
        { startedDate: null, percentComplete: 0 },
      ],
    } ) );

    expect( summary.loaded ).toBe( true );
    expect( summary.level ).toEqual( {
      intlName: "levels.cub",
      earnedIconName: "levelbadge-3",
      count: 3,
    } );
    expect( summary.nextLevelCount ).toBe( 15 );
    expect( summary.speciesCount ).toBe( 7 );
    expect( summary.badgesEarned ).toBe( 1 );
    expect( summary.challengesInProgress ).toBe( 1 );
  } );

  test( "has no next level once every level is earned", () => {
    const summary = readSummary( fakeRealm( {
      badges: [level( "tadpole", 0, true ), level( "cub", 3, true )],
      taxa: [],
      challenges: [],
    } ) );

    expect( summary.level.intlName ).toBe( "levels.cub" );
    expect( summary.nextLevelCount ).toBeNull( );
  } );
} );
