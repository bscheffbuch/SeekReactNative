// @ts-nocheck
import React, { useMemo, useState } from "react";
import { View, Image, Pressable, Text, StyleSheet } from "react-native";

import i18n from "../../i18n";
import { ChevronLeftIcon, ImageIcon } from "../UIComponents/AppIcons";
import PhotoViewer from "../UIComponents/PhotoViewer";
import { useAppOrientation } from "../Providers/AppOrientationProvider";
import { useTheme } from "../Providers/ThemeProvider";
import type { Observation } from "../Providers/ObservationProvider";

interface Props {
  observation: Observation;
  screenType: string;
  setNavigationPath: ( path: string ) => void;
  // where the back button leads: the camera, or the photo identification screen
  backPath?: "Camera" | "Photos";
}

// M3: small top app bar, then the user's photo and the reference photo side by
// side as large rounded images with label chips.
const MatchHeader = ( {
  backPath = "Camera",
  observation,
  screenType,
  setNavigationPath,
}: Props ) => {
  const { isLandscape } = useAppOrientation( );
  const { theme } = useTheme( );
  const taxon = observation && observation.taxon;
  const image = observation && observation.image;
  const imageUri = image && image.uri;
  // every photo of this observation (several when identified from multiple photos)
  const uris = useMemo( ( ) => ( imageUri ? [imageUri, ...( image.extraPhotoUris ?? [] )] : [] ), [image, imageUri] );
  const [viewing, setViewing] = useState( false );
  const showSpeciesImage = ( taxon && taxon.speciesSeenImage ) && screenType !== "unidentified";
  const imageHeight = isLandscape ? 260 : 156;

  const styles = StyleSheet.create( {
    bar: {
      alignItems: "center",
      flexDirection: "row",
      height: 64,
      paddingHorizontal: 4,
    },
    back: {
      alignItems: "center",
      borderRadius: 24,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    title: {
      color: theme.colors.text,
      flex: 1,
      fontFamily: theme.typography.body,
      fontSize: 22,
      lineHeight: 28,
      marginLeft: 4,
    },
    images: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
    },
    image: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: 28,
      flex: 1,
      height: imageHeight,
    },
    fill: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 28,
    },
    chip: {
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      borderRadius: 8,
      bottom: 10,
      color: "#FFFFFF",
      fontFamily: theme.typography.heading,
      fontSize: 12,
      left: 10,
      overflow: "hidden",
      paddingHorizontal: 8,
      paddingVertical: 3,
      position: "absolute",
    },
    count: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      borderRadius: 8,
      flexDirection: "row",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      position: "absolute",
      right: 10,
      top: 10,
    },
    countLabel: {
      color: "#FFFFFF",
      fontFamily: theme.typography.heading,
      fontSize: 12,
    },
  } );

  return (
    <View>
      <View style={styles.bar}>
        <Pressable
          accessibilityLabel={i18n.t( "accessibility.back", { defaultValue: "Back" } )}
          accessibilityRole="button"
          onPress={( ) => setNavigationPath( backPath )}
          style={styles.back}
          testID="matchBack"
        >
          <ChevronLeftIcon color={theme.colors.text} size={26} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          {i18n.t( "results.match", { defaultValue: "Match" } )}
        </Text>
      </View>
      <View style={styles.images}>
        {imageUri && (
          <Pressable
            accessibilityHint={i18n.t( "photo_viewer.open" )}
            accessibilityRole="imagebutton"
            onPress={( ) => setViewing( true )}
            style={styles.image}
          >
            <Image source={{ uri: imageUri }} style={styles.fill} />
            <Text style={styles.chip}>{i18n.t( "results.your_photo", { defaultValue: "Your photo" } )}</Text>
            {uris.length > 1 && (
              <View style={styles.count}>
                <ImageIcon color="#FFFFFF" size={14} strokeWidth={2.2} />
                <Text style={styles.countLabel}>{uris.length}</Text>
              </View>
            )}
          </Pressable>
        )}
        {showSpeciesImage && (
          <View style={styles.image}>
            <Image source={{ uri: taxon.speciesSeenImage }} style={styles.fill} />
            <Text style={styles.chip}>{i18n.t( "results.reference", { defaultValue: "Reference" } )}</Text>
          </View>
        )}
      </View>
      <PhotoViewer onClose={( ) => setViewing( false )} uris={uris} visible={viewing} />
    </View>
  );
};

export default MatchHeader;
