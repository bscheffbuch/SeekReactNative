// @ts-nocheck
import React, { useRef, useEffect, useCallback } from "react";
import { Pressable, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";

import { setRoute, StoredRoutes } from "../../utility/helpers";
import styles from "../../styles/observations/obsCard";
import { TrashIcon } from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";
import SpeciesCard from "../UIComponents/SpeciesCard";
import { useUserPhoto } from "../../utility/customHooks/useUserPhoto";
import { useSpeciesDetail } from "../Providers/SpeciesDetailProvider";

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
interface Props {
  readonly item: {
    taxon: Taxon;
    photo: string;
  };
  readonly openModal: ( photo: { uri: string }, taxon: Taxon ) => void;
  readonly updateItemScrolledId: ( id: number | null ) => void;
  readonly itemScrolledId: number | null;
  readonly toAnimate: boolean;
  readonly hasAnimated: boolean;
  readonly setHasAnimated: ( hasAnimated: boolean ) => void;
}

const ObservationCard = ( {
  item,
  openModal,
  updateItemScrolledId,
  itemScrolledId,
  toAnimate,
  hasAnimated,
  setHasAnimated,
}: Props ) => {
  const { setId } = useSpeciesDetail( );
  const { theme } = useTheme( );
  const scrollView = useRef<ScrollView>( null );
  const { navigate } = useNavigation( );
  const translateX = useSharedValue( 0 );
  const animatedStyle = useAnimatedStyle( ( ) => ( {
    transform: [{ translateX: translateX.value } ],
  } ) );

  const { taxon } = item;
  const { id } = taxon;

  const photo = useUserPhoto( item );

  useEffect( ( ) => {
    const scrollLeft = ( ) => {
      if ( scrollView.current ) {
        scrollView.current.scrollTo( {
          x: 0, y: 0, duration: 300,
        } );
      }
    };

    if ( itemScrolledId && itemScrolledId !== id ) {
      updateItemScrolledId( null );
      scrollLeft();
    }
  }, [updateItemScrolledId, id, itemScrolledId] );

  const handleDeletePress = ( ) => openModal( photo, taxon );

  const handleSpeciesCardPress = ( ) => {
    setId( id );
    setRoute( StoredRoutes.Observations );
    navigate( "Species" );
  };

  const handleHorizontalScroll = ( ) => updateItemScrolledId( id );

  const animate = useCallback( ( ) => {
    translateX.set(
      withSequence(
        withTiming( -( 73 + 24 ), { duration: 200 } ),
        withDelay( 2000, withTiming( 0, { duration: 200 } ) ),
      ),
    );
  }, [translateX] );

  useEffect( ( ) => {
    if ( toAnimate && !hasAnimated ) {
      animate( );
      setHasAnimated( true );
    }
  },[toAnimate, animate, hasAnimated, setHasAnimated] );

  return (
    <ScrollView
      ref={scrollView}
      contentContainerStyle={styles.card}
      horizontal
      onScrollBeginDrag={handleHorizontalScroll}
      showsHorizontalScrollIndicator={false}
    >
      <Animated.View style={[styles.row, animatedStyle]}>
        <SpeciesCard
          taxon={taxon}
          handlePress={handleSpeciesCardPress}
          photo={photo}
        />
        <Pressable accessibilityRole="button"
          onPress={handleDeletePress}
          style={[styles.deleteButton, { backgroundColor: theme.colors.destructive }]}
        >
          <TrashIcon color={theme.isDark ? "#690005" : "#FFFFFF"} size={24} strokeWidth={2.2} />
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
};

export default ObservationCard;
