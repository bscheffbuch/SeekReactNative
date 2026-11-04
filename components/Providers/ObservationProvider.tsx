import type { PropsWithChildren } from "react";
import React, { useState, useCallback } from "react";
import inatjs from "inaturalistjs";

import { fetchSpeciesSeenDate } from "../../utility/dateHelpers";
import { addToCollection, changeCollectedTaxon, removeFromCollection } from "../../utility/observationHelpers";
import { createLocationAlert } from "../../utility/locationHelpers";
import { savePostingSuccess } from "../../utility/loginHelpers";
import { iconicTaxonIdFor } from "../../utility/taxonChoice";
import type { TaxonChoice } from "../../utility/taxonChoice";

interface Prediction {
  name: string;
  taxon_id: number;
  rank_level: number;
  rank?: any;
  combined_score: number;
  ancestor_ids: number[];
}
export interface ObservationImage {
  predictions: Prediction[];
  errorCode: number;
  latitude?: number | null;
  longitude?: number | null;
  arCamera?: boolean;
  preciseCoords?: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  };
  uri: string;
  time: number;
}
export interface Observation {
  image: ObservationImage;
  taxon?: {
    taxaId?: number;
    speciesSeenImage?: string | null;
    scientificName?: string;
    rank?: any;
    seenDate?: string | null;
    // the user picked this taxon from a search instead of the model's suggestions
    userChosen?: boolean;
  };
  // what the user can switch to on the Match screen (the model's suggestions)
  suggestions?: Prediction[];
}

export interface StartOptions {
  // show this taxon of the predictions, however it scored (the user picked it)
  taxonId?: number;
  // replaces the predictions as what the Match screen offers to switch to
  suggestions?: Prediction[];
}
const ObservationContext = React.createContext<
  {
    observation: Observation | null;
    setObservation: React.Dispatch<React.SetStateAction<any>>;
    startObservationWithImage: ( _image: ObservationImage, _callback?: () => void, _options?: StartOptions ) => Promise<void>;
    changeSpecies: ( _choice: TaxonChoice, _lineage: TaxonChoice[] ) => Promise<void>;
  } | undefined
>( undefined );

const ObservationProvider = ( { children }: PropsWithChildren ) => {
  const [observation, setObservation] = useState<Observation | null>( null );

  const threshold = 70;

  const checkForSpecies = ( predictions: Prediction[] ) => predictions.find( leaf => leaf.rank_level === 10 && leaf.combined_score > threshold ) || null;

  const checkForAncestor = ( predictions: Prediction[] ) => {
    const reversePredictions = predictions.sort( ( a, b ) => a.rank_level - b.rank_level );
    const ancestor = reversePredictions.find( leaf => leaf.combined_score > threshold );

    if ( ancestor && ancestor.rank_level !== 100 ) {
      return ancestor;
    }
    return null;
  };

  const fetchPhoto = useCallback( async ( id: number ): Promise<string | undefined | null> => {
    // probably should break this into a helper function to use in other places
    // like species nearby fetches for better offline experience
    const fetchWithTimeout = ( timeout: number ) => Promise.race( [
      inatjs.taxa.fetch( id ),
      new Promise( ( _, reject ) =>
          setTimeout( ( ) => reject( new Error( "timeout" ) ), timeout )
        ),
    ] );

    try {
      // this will hopefully stop Seek from stalling when a user has spotty cell service;
      // if the fetch doesn't resolve in a certain number of milliseconds, no
      // default photo will be shown

      // not sure how long we really want to wait for this
      // started with 500 which was apparently too slow, now 5 seconds
      const { results } = await fetchWithTimeout( 5000 );
      const taxa = results[0];
      return taxa.default_photo.medium_url;
    } catch {
      return null;
    }
  }, [] );

  const handleSpecies = async ( image: ObservationImage, param: Prediction ) => {
    const { errorCode, latitude } = image;
    const species = Object.assign( { }, param );

    const createSpecies = ( photo: string | null | undefined, seenDate: string | null ) => {
      return {
        taxaId: Number( species.taxon_id ),
        speciesSeenImage: photo,
        scientificName: species.name,
        seenDate,
      };
    };

    const createObservationForRealm = () => {
      return {
        taxon: {
          id: Number( species.taxon_id ),
          name: species.name,
          iconic_taxon_id: iconicTaxonIdFor( species.ancestor_ids ),
          ancestor_ids: species.ancestor_ids,
        },
      };
    };

    const seenDate = await fetchSpeciesSeenDate( Number( species.taxon_id ) );
    console.log( "fetchSpeciesSeenDate result:", seenDate );
    const mediumPhoto = await fetchPhoto( species.taxon_id );
    console.log( "fetchPhoto result:", mediumPhoto );

    if ( !seenDate ) {
      const newObs = createObservationForRealm( );
      await addToCollection( newObs, image );
      console.log( "addToCollection resolved" );

      // also added to online server results
      if ( !latitude && errorCode !== 0 ) {
        createLocationAlert( errorCode );
      }
    }
    const taxon = createSpecies( mediumPhoto, seenDate );
    return taxon;
  };

  const handleAncestor = useCallback( async ( ancestor: Prediction ) => {
    const photo = await fetchPhoto( ancestor.taxon_id );
    console.log( "fetchPhoto result:", photo );

    return {
      taxaId: ancestor.taxon_id,
      speciesSeenImage: photo,
      scientificName: ancestor.name,
      rank: ancestor.rank_level,
    };
  }, [fetchPhoto] );

  const startObservationWithImage = async (
    image: ObservationImage,
    positiveCallback?: () => void,
    options: StartOptions = {}
  ) => {
    console.log( "Adding image to observation", image );
    if ( !image || !image.predictions ) {
      console.warn( "No predictions found in image" );
      return;
    }
    // a new observation can be posted, whatever happened to the last one
    savePostingSuccess( false );

    const predictions = [...image.predictions];
    const chosen = options.taxonId
      ? predictions.find( p => p.taxon_id === options.taxonId && p.rank_level !== 100 ) || null
      : null;
    const species = chosen
      ? ( chosen.rank_level === 10 ? chosen : null )
      : checkForSpecies( predictions );
    console.log( "checkForSpecies result:", species );
    const ancestor = chosen
      ? ( chosen.rank_level === 10 ? null : chosen )
      : checkForAncestor( predictions );
    console.log( "checkForAncestor result:", ancestor );
    let taxon;
    if ( species ) {
      taxon = await handleSpecies( image, species );
      console.log( "handleSpecies result:", taxon );
    } else if ( ancestor ) {
      taxon = await handleAncestor( ancestor );
      console.log( "handleAncestor result:", taxon );
    }
    setObservation( { image, taxon, suggestions: options.suggestions || image.predictions } );

    // At this point we were successful in adding the image and processing the predictions
    // call the positiveCallback if it exists
    if ( positiveCallback ) {
      positiveCallback( );
    }
  };

  // Switches the observation on the Match screen to another taxon. The collection follows:
  // a species this observation added moves to the new one (or goes, when the new one is
  // already collected or isn't a species); an earlier sighting stays as it was.
  const changeSpecies = async ( choice: TaxonChoice, lineage: TaxonChoice[] ) => {
    if ( !observation ) {
      return;
    }
    const { image, taxon: current } = observation;
    const addedHere = !!current?.taxaId && !current.rank && !current.seenDate;
    const isSpecies = choice.rank_level === 10;
    const seenDate = isSpecies ? await fetchSpeciesSeenDate( choice.taxon_id ) : null;
    const photo = await fetchPhoto( choice.taxon_id );

    if ( addedHere && current?.taxaId !== choice.taxon_id ) {
      if ( isSpecies && !seenDate ) {
        const result = await changeCollectedTaxon( current.taxaId as number, {
          id: choice.taxon_id,
          name: choice.name,
          iconic_taxon_id: iconicTaxonIdFor( choice.ancestor_ids ),
          ancestor_ids: choice.ancestor_ids,
        } );
        if ( result === "missing" ) {
          await addToCollection( { taxon: {
            id: choice.taxon_id,
            name: choice.name,
            iconic_taxon_id: iconicTaxonIdFor( choice.ancestor_ids ),
            ancestor_ids: choice.ancestor_ids,
          } }, image );
        }
      } else {
        removeFromCollection( current.taxaId as number );
      }
    } else if ( !addedHere && isSpecies && !seenDate ) {
      await addToCollection( { taxon: {
        id: choice.taxon_id,
        name: choice.name,
        iconic_taxon_id: iconicTaxonIdFor( choice.ancestor_ids ),
        ancestor_ids: choice.ancestor_ids,
      } }, image );
    }

    savePostingSuccess( false );
    setObservation( {
      // the Match screen reads the classification from the predictions
      image: { ...image, predictions: lineage },
      suggestions: observation.suggestions || image.predictions,
      taxon: {
        taxaId: choice.taxon_id,
        scientificName: choice.name,
        speciesSeenImage: photo,
        seenDate,
        rank: isSpecies ? undefined : choice.rank_level,
        userChosen: !!choice.fromSearch,
      },
    } );
  };

  const value = {
    observation,
    setObservation,
    startObservationWithImage,
    changeSpecies,
  };
  return (
    <ObservationContext.Provider value={value}>{children}</ObservationContext.Provider>
  );
};

function useObservation() {
  const context = React.useContext( ObservationContext );
  if ( context === undefined ) {
    throw new Error( "useObservation must be used within a ObservationProvider" );
  }
  return context;
}

export { ObservationProvider, useObservation };
