// @ts-nocheck
import React, { useState, useMemo, useCallback } from "react";
import { StyleSheet, View, Keyboard } from "react-native";
import { FlashList } from "@shopify/flash-list";

import i18n from "../../i18n";
import styles from "../../styles/observations/observations";
import { iconicTaxaNamesById } from "../../utility/dictionaries/taxonomyDicts";
import EmptyState from "../UIComponents/EmptyState";
import ObservationCard from "./ObsCard";
import SectionHeader from "./SectionHeader";
import SearchBar from "./SearchBar";
import SearchEmpty from "./SearchEmpty";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";

interface Observation {
  id: number;
  data: any[];
}

type Taxon = {
  id: number;
  iconicTaxonId?: number | undefined;
  preferredCommonName?: string | undefined;
  name: string;
  defaultPhoto?: {
    backupUri?: string;
    mediumUrl?: string;
    lastUpdated?: Date;
  };
};

interface ConvertedDataItem {
  taxon: Taxon;
  photo: string;
  toAnimate: boolean;
  isLast?: boolean;
  type?: "header" | "footer" | "footerHidden" | "footerEmpty" | "observation";
  id: number;
  dataLength: number;
  sectionId: number;
}

interface Props {
  fetchFilteredObservations: ( text: string ) => void;
  observations: Observation[];
  searchText: string;
  openModal: ( photo: { uri: string }, taxon: Taxon ) => void;
  updateObs: ( observations: Observation[] ) => void;
  clearText: () => void;
}

const ObsList = ( {
  fetchFilteredObservations,
  observations,
  searchText,
  openModal,
  updateObs,
  clearText,
}: Props ) => {
  const { theme } = useTheme( );
  const themedStyles = useMemo( () => StyleSheet.create( {
    emptyText: {
      color: theme.colors.muted,
    },
    padding: {
      backgroundColor: theme.colors.canvas,
    },
  } ), [theme.colors.canvas, theme.colors.muted] );
  // TODO: preferably we should use setHiddenSections to change state
  const [hiddenSections] = useState<number[]>( [] );
  const [itemScrolledId, setItemScrolledId] = useState<number | null>( null );
  const [hasAnimated, setHasAnimated] = useState<boolean>( false );

  const updateItemScrolledId = useCallback(
    ( id: number | null ) => setItemScrolledId( id ),
    []
  );

  const toggleSection = useCallback(
    ( id: number ) => {
      const updatedObs = observations.slice(); // this is needed to force a refresh of SectionList
      const idToHide = hiddenSections.indexOf( id );

      if ( idToHide !== -1 ) {
        hiddenSections.splice( idToHide, 1 );
      } else {
        hiddenSections.push( id );
      }

      updateObs( updatedObs );
    },
    [observations, hiddenSections, updateObs],
  );

  const sectionIsHidden = useCallback(
    ( id: number ) => hiddenSections.includes( id ),
    [hiddenSections]
  );

  const convertedData: ConvertedDataItem[] = useMemo( () => {
    const nextData: ConvertedDataItem[] = [];

    observations.forEach( ( section ) => {
      const { data, id } = section;
      const hidden = sectionIsHidden( id );

      nextData.push( { type: "header", id, dataLength: data.length } );

      if ( !hidden ) {
        data.forEach( ( item, index ) => {
          nextData.push( {
            ...item,
            toAnimate: Boolean( item.toAnimate || ( index === 0 && id === 47126 ) ),
            sectionId: id,
            isLast: index === data.length - 1,
          } );
        } );
      }

      if ( hidden && data.length === 0 ) {
        nextData.push( { type: "footerHidden" } );
      } else if ( data.length === 0 ) {
        nextData.push( { type: "footerEmpty", id } );
      } else {
        nextData.push( { type: "footer" } );
      }
    } );

    return nextData;
  }, [observations, sectionIsHidden] );

  const renderItem = useCallback(
    ( { item }: { item: ConvertedDataItem } ) => {
      if ( item.type === "header" ) {
        // Render header
        return (
          <SectionHeader
            id={item.id}
            dataLength={item.dataLength}
            open={!sectionIsHidden( item.id )}
            toggleSection={toggleSection}
          />
        );
      }
      if ( item.type === "footerHidden" ) {
        // Render footer for hidden section
        return <View style={styles.hiddenSectionSeparator} />;
      }
      if ( item.type === "footerEmpty" ) {
        // Render footer for hidden section
        const iconicTaxon = iconicTaxaNamesById[item.id].split( "." )[1];
        return (
          <StyledText style={[baseTextStyles.body, styles.emptyText, themedStyles.emptyText]}>
            {i18n.t( `observations.not_seen_${iconicTaxon}` )}
          </StyledText>
        );
      }
      if ( item.type === "footer" ) {
        // Render footer
        return <View style={styles.sectionWithDataSeparator} />;
      } else {
        // Render item
        return (
          <>
            <ObservationCard
              item={item}
              itemScrolledId={itemScrolledId}
              openModal={openModal}
              updateItemScrolledId={updateItemScrolledId}
              toAnimate={item.toAnimate}
              hasAnimated={hasAnimated}
              setHasAnimated={setHasAnimated}
            />
            {item.isLast && <View style={styles.bottomOfSectionPadding} />}
          </>
        );
      }
    },
    [
      sectionIsHidden,
      toggleSection,
      itemScrolledId,
      openModal,
      updateItemScrolledId,
      hasAnimated,
      setHasAnimated,
      themedStyles.emptyText,
    ],
  );

  const renderListFooter = useCallback(
    () => <View style={[styles.padding, themedStyles.padding]} />,
    [themedStyles.padding]
  );

  const renderListEmpty = () => {
    if ( searchText.length > 0 ) {
      return <SearchEmpty clearText={clearText} />;
    } else {
      return <EmptyState />;
    }
  };

  const renderHeader = useMemo(
    () => (
      <SearchBar
        fetchFilteredObservations={fetchFilteredObservations}
        searchText={searchText}
        clearText={clearText}
      />
    ),
    [fetchFilteredObservations, searchText, clearText]
  );

  const dismissKeyboard = useCallback( () => Keyboard.dismiss(), [] );

  const extractKey = useCallback( ( item: ConvertedDataItem, index: number ) => {
    if ( item.type ) {
      return `${item.type}-${item.id ?? "none"}-${index}`;
    }
    return `observation-${item.id}-${item.sectionId}-${index}`;
  }, [] );
  return (
    <FlashList
      testID="observations-list"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={dismissKeyboard}
      scrollEventThrottle={16}
      data={convertedData}
      initialNumToRender={5}
      stickySectionHeadersEnabled={false}
      keyExtractor={extractKey}
      ListHeaderComponent={renderHeader}
      renderItem={renderItem}
      getItemType={( item ) => {
        if ( item.hasOwnProperty( "type" ) ) {
          return item.type;
        }
        return "observation";
      }}
      ListFooterComponent={renderListFooter}
      ListEmptyComponent={renderListEmpty}
      removeClippedSubviews
    />
  );
};

export default ObsList;
