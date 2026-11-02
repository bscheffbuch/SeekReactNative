import { useEffect, useState } from "react";

import {
  builtInPack,
  getActiveModelPack,
  onActivePackChange,
} from "../modelPacks";
import type { ModelPack } from "../modelPacks";

/**
 * The identification model the camera should use. Starts with the built-in
 * pack so the camera can classify immediately, then switches to the selected
 * pack once the installed packs have been read (the vision plugin reloads its
 * classifier when the paths change).
 */
const useActiveModelPack = ( ): ModelPack => {
  const [pack, setPack] = useState<ModelPack>( builtInPack );

  useEffect( ( ) => {
    let current = true;
    getActiveModelPack( )
      .then( ( p ) => {
        if ( current ) {
          setPack( p );
        }
      } )
      .catch( ( ) => {
        // keep the built-in pack
      } );
    const unsubscribe = onActivePackChange( ( p ) => setPack( p ) );
    return ( ) => {
      current = false;
      unsubscribe( );
    };
  }, [] );

  return pack;
};

export default useActiveModelPack;
