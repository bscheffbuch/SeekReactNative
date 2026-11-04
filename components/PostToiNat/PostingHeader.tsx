import React, { useCallback, useState } from "react";
import {
  TouchableOpacity,
  Modal,
  Text,
  View,
} from "react-native";

import styles from "../../styles/posting/postToiNat";
import i18n from "../../i18n";
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
  extraPhotoUris?: string[];
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

  const photoCount = 1 + ( image.extraPhotoUris?.length ?? 0 );

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
      {photoCount > 1 && (
        <Text style={[styles.photoCount, { color: theme.colors.onSurfaceVariant }]}>
          {i18n.t( "posting.photo_count", { count: photoCount } )}
        </Text>
      )}
    </>
  );
};

export default PostingHeader;
