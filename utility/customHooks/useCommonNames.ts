import { useEffect, useState } from "react";

import { getTaxonCommonName } from "../commonNamesHelpers";

// Common names for several taxa at once; null where there is none.
const useCommonNames = ( taxonIds: number[] ): Record<number, string | null> => {
  const [names, setNames] = useState<Record<number, string | null>>( {} );
  const key = taxonIds.join( "," );
  useEffect( ( ) => {
    let current = true;
    // a local lookup per taxon, cheap enough to repeat for the few ids shown
    const ids = key.split( "," ).filter( Boolean ).map( Number );
    Promise.all( ids.map( id => getTaxonCommonName( id ).catch( ( ) => null ) ) ).then( found => {
      if ( current ) {
        setNames( known => {
          const next = { ...known };
          ids.forEach( ( id, i ) => { next[id] = found[i]; } );
          return next;
        } );
      }
    } );
    return ( ) => { current = false; };
  }, [key] );
  return names;
};

export { useCommonNames };
