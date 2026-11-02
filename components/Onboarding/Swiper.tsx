// @ts-nocheck
import React, { useState, useRef, useCallback } from "react";
import type { PropsWithChildren } from "react";
import { View, FlatList, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { viewStyles } from "../../styles/onboarding";
import Dots from "./Dots";
import Button from "./Button";
import { useTheme } from "../Providers/ThemeProvider";

// Material 3 onboarding: theme surface instead of the old green gradients, a page
// indicator, and Skip / Next (Continue on the last page) in thumb reach.
const Swiper = ( { children }: PropsWithChildren ) => {
  const { theme } = useTheme( );
  const { width } = useWindowDimensions( );
  const flatList = useRef( null );
  const viewConfigRef = useRef( {
    waitForInteraction: true,
    viewAreaCoveragePercentThreshold: 95,
  } );
  const [scrollIndex, setScrollIndex] = useState( 0 );
  const pages = React.Children.toArray( children );

  const onViewRef = useRef( ( { changed } ) => {
    const { index } = changed[0];
    if ( typeof index === "number" ) {
      setScrollIndex( index );
    }
  } );

  const renderPage = useCallback( ( { item, index } ) => (
    <View key={`page-${index.toString()}`} style={[viewStyles.contentContainer, { width }]}>
      {item}
    </View>
  ), [width] );

  const goNext = useCallback( ( ) => {
    const next = Math.min( scrollIndex + 1, pages.length - 1 );
    flatList.current?.scrollToIndex( { index: next, animated: true } );
    setScrollIndex( next );
  }, [pages.length, scrollIndex] );

  return (
    <SafeAreaView style={[viewStyles.container, { backgroundColor: theme.colors.canvas }]}>
      <FlatList
        ref={flatList}
        bounces={false}
        viewabilityConfig={viewConfigRef.current}
        onViewableItemsChanged={onViewRef.current}
        data={pages}
        renderItem={renderPage}
        getItemLayout={( _, index ) => ( { length: width, offset: width * index, index } )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      />
      <Dots index={scrollIndex} count={pages.length} />
      <Button index={scrollIndex} last={scrollIndex >= pages.length - 1} onNext={goNext} />
    </SafeAreaView>
  );
};

export default Swiper;
