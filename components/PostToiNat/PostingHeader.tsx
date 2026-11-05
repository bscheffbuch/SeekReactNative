import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import styles from "../../styles/posting/postToiNat";
import i18n from "../../i18n";
import SelectSpecies from "./SelectSpecies";
import SpeciesCard from "../UIComponents/SpeciesCard";
import PhotoViewer from "../UIComponents/PhotoViewer";
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

  const uris = useMemo( ( ) => [image.uri, ...( image.extraPhotoUris ?? [] )], [image] );
  const [viewing, setViewing] = useState<number | null>( null );

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
      {uris.length > 1 && (
        <>
          <Text style={[styles.photoCount, { color: theme.colors.onSurfaceVariant }]}>
            {i18n.t( "posting.photo_count", { count: uris.length } )}
          </Text>
          <ScrollView contentContainerStyle={styles.photoStrip} horizontal showsHorizontalScrollIndicator={false}>
            {uris.map( ( uri, i ) => (
              <Pressable
                accessibilityLabel={i18n.t( "photo_viewer.position", { index: i + 1, count: uris.length } )}
                accessibilityRole="imagebutton"
                key={`${i}-${uri}`}
                onPress={( ) => setViewing( i )}
              >
                <Image source={{ uri }} style={styles.thumbnail} />
              </Pressable>
            ) )}
          </ScrollView>
          <PhotoViewer
            initialIndex={viewing ?? 0}
            onClose={( ) => setViewing( null )}
            uris={uris}
            visible={viewing !== null}
          />
        </>
      )}
    </>
  );
};

export default PostingHeader;
