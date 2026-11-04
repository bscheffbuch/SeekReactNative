import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import i18n from "../../i18n";
import ChangeSpeciesButton from "../UIComponents/Buttons/ChangeSpeciesButton";
import ChangeSpeciesSheet from "../UIComponents/ChangeSpeciesSheet";
import { fetchSpeciesSeenDate } from "../../utility/dateHelpers";
import { changeCollectedTaxon } from "../../utility/observationHelpers";
import { iconicTaxonIdFor } from "../../utility/taxonChoice";
import type { TaxonChoice } from "../../utility/taxonChoice";
import { useSpeciesDetail } from "../Providers/SpeciesDetailProvider";

// On a collected species: move the saved observation to another species (search only,
// since a saved observation has no model suggestions).
const ChangeCollectedSpecies = ( ) => {
  const { id, setId } = useSpeciesDetail( );
  const [collected, setCollected] = useState( false );
  const [changing, setChanging] = useState( false );

  useEffect( ( ) => {
    let current = true;
    setCollected( false );
    if ( id ) {
      fetchSpeciesSeenDate( id ).then( seen => {
        if ( current ) { setCollected( !!seen ); }
      } );
    }
    return ( ) => { current = false; };
  }, [id] );

  if ( !id || !collected ) {
    return null;
  }

  const onSelect = async ( choice: TaxonChoice ) => {
    const result = await changeCollectedTaxon( id, {
      id: choice.taxon_id,
      name: choice.name,
      iconic_taxon_id: iconicTaxonIdFor( choice.ancestor_ids ),
      ancestor_ids: choice.ancestor_ids,
    } );
    if ( result === "exists" ) {
      Alert.alert( i18n.t( "change_species.exists_title" ), i18n.t( "change_species.exists_message" ) );
      return;
    }
    if ( result === "changed" ) {
      setId( choice.taxon_id );
    }
  };

  return (
    <View style={styles.container}>
      <ChangeSpeciesButton onPress={( ) => setChanging( true )} />
      <ChangeSpeciesSheet
        onClose={( ) => setChanging( false )}
        onSelect={onSelect}
        selectedId={id}
        speciesOnly
        visible={changing}
      />
    </View>
  );
};

const styles = StyleSheet.create( {
  container: { paddingHorizontal: 24, paddingTop: 8 },
} );

export default ChangeCollectedSpecies;
