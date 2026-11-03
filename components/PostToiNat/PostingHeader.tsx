import React, { useCallback, useState } from "react";
import {
  TouchableOpacity,
  Modal,
  View,
} from "react-native";

import styles from "../../styles/posting/postToiNat";
import SelectSpecies from "./SelectSpecies";
import SpeciesCard from "../UIComponents/SpeciesCard";
import { PencilIcon } from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";

interface Taxon {
  name: string;
  iconicTaxonId?: number;
  preferredCommonName?: string;
  taxaId?: number;
}

interface ImageObject {
  uri: string;
}

interface Props {
  taxon: Taxon;
  image: ImageObject;
  updateTaxon: ( id: number, commonName: string, scientificName: string ) => void;
}

const PostingHeader = ( {
  taxon,
  image,
  updateTaxon,
}: Props ) => {
  const { theme } = useTheme( );
  const [showModal, setShowModal] = useState( false );

  const openModal = ( ) => setShowModal( true );
  const closeModal = useCallback( () => setShowModal( false ), [] );

  return (
    <>
      <Modal
        onRequestClose={closeModal}
        visible={showModal}
      >
        <SelectSpecies
          image={image.uri}
          seekId={taxon}
          toggleSpeciesModal={closeModal}
          updateTaxon={updateTaxon}
        />
      </Modal>
      <TouchableOpacity accessibilityRole="button"
        onPress={openModal}
        style={styles.card}
      >
        <SpeciesCard
          taxon={taxon}
          handlePress={openModal}
          photo={{ uri: image.uri }}
        />
        <View style={[styles.editIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
          <PencilIcon color={theme.colors.onSecondaryContainer} size={20} strokeWidth={2} />
        </View>
      </TouchableOpacity>
    </>
  );
};

export default PostingHeader;
