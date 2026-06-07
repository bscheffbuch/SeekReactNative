// @ts-nocheck
import React, { useState, useCallback, useMemo } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Realm from "realm";
import Modal from "react-native-modal";

import i18n from "../../i18n";
import realmConfig from "../../models";
import BadgeModal from "../Modals/BadgeModal";
import badgeImages from "../../assets/badges";
import { viewStyles, imageStyles } from "../../styles/badges/achievements";
import { createBadgeSetList } from "../../utility/badgeHelpers";
import BadgeContainer from "./BadgeContainer";
import { useTheme } from "../Providers/ThemeProvider";

interface SpeciesBadge {
  name: string;
  earned: boolean;
  earnedIconName: string;
  intlName: string;
  iconicTaxonName: string;
  count: number;
  infoText: string;
  iconicTaxonId: number;
}

interface Props {
  speciesBadges: SpeciesBadge[];
}

const SpeciesBadges = ( { speciesBadges }: Props ) => {
  const [showModal, setModal] = useState( false );
  const [iconicSpeciesCount, setIconicSpeciesCount] = useState( 0 );
  const [iconicTaxonBadges, setIconicTaxonBadges] = useState<SpeciesBadge[]>( [] );
  const { theme } = useTheme( );

  const sets = useMemo( () => createBadgeSetList( speciesBadges ), [speciesBadges] );
  const themedStyles = useMemo( () => StyleSheet.create( {
    emptyBadge: {
      tintColor: theme.colors.muted,
    },
  } ), [theme] );

  const openModal = useCallback( () => setModal( true ), [] );
  const closeModal = useCallback( () => setModal( false ), [] );

  const fetchBadgesByIconicId = ( taxaId: number ) => {
    Realm.open( realmConfig )
      .then( ( realm ) => {
        const badges = realm.objects( "BadgeRealm" ).filtered( `iconicTaxonId == ${taxaId}` ).sorted( "index" );
        const collectedTaxa = realm.objects( "TaxonRealm" );
        const collection = collectedTaxa.filtered( `iconicTaxonId == ${taxaId}` ).length;

        setIconicTaxonBadges( badges );
        setIconicSpeciesCount( collection );
        openModal();
      } ).catch( () => {
        // console.log( "[DEBUG] Failed to open realm, error: ", err );
      } );
  };

  const renderSpeciesBadge = ( item: SpeciesBadge ) => {
    let imageSrc = badgeImages.badge_empty;
    let earned = false;

    if ( item && item.earned && item.earnedIconName ) {
      imageSrc = badgeImages[item.earnedIconName];
      earned = true;
    }
    return (
      <TouchableOpacity
        onPress={() => fetchBadgesByIconicId( item.iconicTaxonId )}
      >
        <Image
          accessible
          accessibilityLabel={i18n.t( item.infoText )}
          source={imageSrc}
          style={[imageStyles.badgeIcon, !earned && themedStyles.emptyBadge]}
        />
      </TouchableOpacity>
    );
  };

  const renderBadgeGrid = ( ) => sets.map( ( set, index ) => {
    const setOfFive = speciesBadges.slice( sets[index], sets[index + 1] );

    return (
      <View key={`badge-grid-${sets[index]}`}>
        <BadgeContainer
          data={setOfFive}
          renderItem={renderSpeciesBadge}
        />
      </View>
    );
  } );

  const renderBadgeModal = ( ) => (
    <Modal
      isVisible={showModal}
      onBackdropPress={closeModal}
      useNativeDriverForBackdrop
      useNativeDriver
      // the following two lines prevent flickering
      // while modal is closing
      backdropTransitionOutTiming={0}
      hideModalContentWhileAnimating
    >
      <BadgeModal
        badges={iconicTaxonBadges}
        iconicSpeciesCount={iconicSpeciesCount}
        closeModal={closeModal}
      />
    </Modal>
  );

  return (
    <>
      {iconicTaxonBadges.length > 0 && renderBadgeModal( )}
      {renderBadgeGrid( )}
      <View style={viewStyles.margin} />
    </>
  );
};

export default SpeciesBadges;
