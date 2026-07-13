// @ts-nocheck
import React, { useEffect, useMemo, useReducer } from "react";
import { View } from "react-native";
import inatjs from "inaturalistjs";

import i18n from "../../../i18n";
import LoadingWheel from "../../UIComponents/LoadingWheel";
import styles from "../../../styles/species/similarSpecies";
import SpeciesNearbyList from "../../UIComponents/SpeciesNearby/SpeciesNearbyList";
import GreenText from "../../UIComponents/GreenText";
import { useTheme } from "../../Providers/ThemeProvider";

interface Taxon {
  taxon: {
    id: number;
    name: string;
    iconicTaxonId: number;
  };
  id: number;
  name: string;
  iconic_taxon_id: number;
  default_photo: {
    medium_url: string;
    license_code: string;
  };
  taxonPhotos: {
    photo: {
      medium_url: string;
      license_code: string;
    };
  }[];
  taxon_photos: {
    photo: {
      medium_url: string;
      license_code: string;
    };
  }[];
}

export enum ACTION {
  SHOW_SIMILAR_SPECIES = "SHOW_SIMILAR_SPECIES",
  RESET_STATE = "RESET_STATE",
}
type State = {
  similarSpecies: Taxon[];
  loading: boolean;
}
type Action =
  | { type: ACTION.RESET_STATE }
  | { type: ACTION.SHOW_SIMILAR_SPECIES; similarSpecies: Taxon[] }

interface Props {
  readonly id: number | null;
}

function reducer( s: State, action: Action ): State {
  switch ( action.type ) {
    case ACTION.SHOW_SIMILAR_SPECIES:
      return {
        similarSpecies: action.similarSpecies,
        loading: false,
      };
    case ACTION.RESET_STATE:
      return {
        similarSpecies: [],
        loading: true,
      };
    default:
      throw new Error();
  }
}
const initialState = {
  similarSpecies: [],
  loading: true,
};

const SimilarSpecies = ( { id }: Props ) => {
  const [state, dispatch] = useReducer( reducer, initialState );
  const { theme } = useTheme( );

  const {
    similarSpecies,
    loading,
  } = state;

  useEffect( ( ) => {
    let isActive = true;
    if ( id !== null ) {
      const resetState = ( ) => dispatch( { type: ACTION.RESET_STATE } );

      const fetchSimilarSpecies = ( ) => {
        const params = {
          per_page: 20,
          taxon_id: id,
          without_taxon_id: 43584,
          locale: i18n.locale,
        };

        inatjs.identifications.similar_species( params ).then( ( { results } ) => {
          const species = results.map( r => r.taxon );

          if ( isActive ) {
            dispatch( { type: ACTION.SHOW_SIMILAR_SPECIES, similarSpecies: species } );
          }
        } ).catch( ( error: Error ) => console.log( error, "error fetching similar species" ) );
      };
      resetState( );
      fetchSimilarSpecies( );
    }
    return ( ) => {
      isActive = false;
    };
  }, [id] );

  return useMemo( ( ) => (
    <>
      <View style={styles.similarSpeciesHeader}>
        <GreenText text="species_detail.similar" />
      </View>
      <View style={[styles.similarSpeciesContainer, { backgroundColor: theme.colors.canvas }]}>
       {loading
          ? <LoadingWheel color={theme.colors.primary} />
          : <SpeciesNearbyList taxa={similarSpecies}  />}
      </View>
      <View style={[
        styles.bottomPadding,
        { backgroundColor: theme.colors.canvas },
      ]} />
    </>
  ), [similarSpecies, loading, theme.colors.canvas, theme.colors.primary] );
};

export default SimilarSpecies;
