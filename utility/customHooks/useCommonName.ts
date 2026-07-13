// @ts-nocheck
import { useState, useEffect } from "react";

import { getTaxonCommonName } from "../commonNamesHelpers";

const useCommonName = ( id?: number ): string | undefined => {
  const [commonName, setCommonName] = useState<string>( );

  useEffect( () => {
    let isCurrent = true;

    if ( !id ) { return; }

    getTaxonCommonName( id ).then( ( name ) => {
      if ( isCurrent ) {
        setCommonName( name );
      }
    } ).catch( () => {
      // keep showing the scientific name when the lookup fails
    } );

    return () => {
      isCurrent = false;
    };
  }, [id] );

  return commonName;
};

export { useCommonName };
