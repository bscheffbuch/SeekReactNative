import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import i18n from "../../i18n";
import { useTheme } from "../Providers/ThemeProvider";
import { XIcon } from "./AppIcons";

interface Props {
  uris: string[];
  visible: boolean;
  // the photo shown first
  initialIndex?: number;
  onClose: ( ) => void;
}

// Full-screen photos, swiped through one at a time, with "2 / 3" on top.
const PhotoViewer = ( { uris, visible, initialIndex = 0, onClose }: Props ) => {
  const { theme } = useTheme( );
  const styles = useMemo( ( ) => makeStyles( theme ), [theme] );
  const { width } = useWindowDimensions( );
  const [index, setIndex] = useState( initialIndex );

  useEffect( ( ) => {
    if ( visible ) {
      setIndex( initialIndex );
    }
  }, [visible, initialIndex] );

  const onScrollEnd = ( e: NativeSyntheticEvent<NativeScrollEvent> ) => {
    setIndex( Math.round( e.nativeEvent.contentOffset.x / width ) );
  };

  const getItemLayout = useCallback(
    ( _: unknown, i: number ) => ( { length: width, offset: width * i, index: i } ),
    [width]
  );

  const renderPhoto = useCallback( ( { item, index: i }: { item: string; index: number } ) => (
    <View style={[styles.page, { width }]}>
      <Image
        accessibilityLabel={i18n.t( "photo_viewer.position", { index: i + 1, count: uris.length } )}
        resizeMode="contain"
        source={{ uri: item }}
        style={styles.photo}
      />
    </View>
  ), [styles, width, uris.length] );

  return (
    <Modal animationType="fade" onRequestClose={onClose} visible={visible}>
      <SafeAreaProvider>
        <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel={i18n.t( "photo_viewer.close" )}
              accessibilityRole="button"
              onPress={onClose}
              style={styles.iconButton}
            >
              <XIcon color="#FFFFFF" size={24} strokeWidth={2} />
            </Pressable>
            {uris.length > 1 && (
              <Text style={styles.counter}>{`${index + 1} / ${uris.length}`}</Text>
            )}
          </View>
          <FlatList
            data={uris}
            getItemLayout={getItemLayout}
            horizontal
            initialScrollIndex={Math.min( initialIndex, Math.max( 0, uris.length - 1 ) )}
            keyExtractor={( uri, i ) => `${i}-${uri}`}
            onMomentumScrollEnd={onScrollEnd}
            pagingEnabled
            renderItem={renderPhoto}
            showsHorizontalScrollIndicator={false}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const makeStyles = ( theme: any ) => StyleSheet.create( {
  // photos read best on black, whatever the theme
  screen: { backgroundColor: "#000000", flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  iconButton: { alignItems: "center", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  counter: { color: "#FFFFFF", fontFamily: theme.typography.heading, fontSize: 16, lineHeight: 24 },
  page: { flex: 1, justifyContent: "center" },
  photo: { flex: 1 },
} );

export default PhotoViewer;
