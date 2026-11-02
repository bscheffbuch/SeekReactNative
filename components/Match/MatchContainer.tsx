// @ts-nocheck
import React from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

import styles from "../../styles/match/match";
import PostToiNat from "./PostToiNat";
import SpeciesNearby from "./SpeciesNearby";
import GreenButton from "../UIComponents/Buttons/GreenButton";
import { renderHeaderText, renderText, setGradients } from "../../utility/matchHelpers";
import { useCommonName } from "../../utility/customHooks/useCommonName";
import StyledText from "../UIComponents/StyledText";
import type { Observation } from "../Providers/ObservationProvider";
import { baseTextStyles } from "../../styles/textStyles";
import MatchDetails from "./MatchDetails";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  observation: Observation;
  setNavigationPath: ( path: string ) => void;
  screenType: string;
  scientificNames: boolean;
}

const MatchContainer = ( {
  observation,
  screenType,
  setNavigationPath,
  scientificNames,
}: Props ) => {
  const { theme } = useTheme( );
  const navigation = useNavigation();
  const taxon = observation && observation.taxon;
  const seenDate = taxon && taxon.seenDate;
  const id = taxon && taxon.taxaId ? taxon.taxaId : 0;
  const commonName = useCommonName( id );
  const speciesIdentified = screenType === "resighted" || screenType === "newSpecies";
  const showScientificName = !commonName || scientificNames;

  const { gradientLight } = setGradients( screenType );

  // android crashes a lot when using object destructuring
  const image = observation && observation.image;
  const taxaId = taxon && taxon.taxaId;
  const scientificName = taxon && taxon.scientificName;
  const rank = taxon && taxon.rank;

  const taxaInfo = {
    // don't pass taxon data in when user has flagged as misidentification
    commonName: screenType === "unidentified" ? null : commonName,
    taxaId: screenType === "unidentified" ? null : taxaId,
    scientificName: screenType === "unidentified" ? null : scientificName,
  };

  const headerText = renderHeaderText( screenType, rank );
  const text = renderText( screenType, seenDate, image );

  const handleGreenButtonPress = () => {
    if ( speciesIdentified ) {
      setNavigationPath( "Species" );
    } else {
      navigation.navigate( "Camera" );
    }
  };

  const greenButtonText = speciesIdentified ? "results.view_species" : "results.take_photo";

  const showSpeciesNearby = ( screenType === "commonAncestor" && rank < 60 ) && ( image && image.latitude );

  return (
    <View style={m3.container}>
      <View>
        <StyledText style={[baseTextStyles.header, m3.headerText, { color: speciesIdentified ? theme.colors.primary : gradientLight }]}>{headerText}</StyledText>
        {screenType !== "unidentified" && (
          <StyledText testID="taxonText" style={[baseTextStyles.species, m3.species, showScientificName && baseTextStyles.italic]}>
            {showScientificName ? scientificName : commonName}
          </StyledText>
        )}
        <StyledText style={[baseTextStyles.body, m3.text]}>{text}</StyledText>
        {( speciesIdentified || screenType === "commonAncestor" ) && taxaId && scientificName ? (
          <MatchDetails
            taxonId={taxaId}
            scientificName={scientificName}
            predictions={image?.predictions}
          />
        ) : null}
        {!speciesIdentified && (
          <GreenButton
            color={gradientLight}
            handlePress={handleGreenButtonPress}
            text={greenButtonText}
          />
        )}
      </View>
      <View style={styles.marginMedium} />
      {showSpeciesNearby && (
        <>
          <SpeciesNearby ancestorId={taxaId} image={image} />
          <View style={styles.marginMedium} />
        </>
      )}
      <View style={styles.textContainer}>
        <PostToiNat color={gradientLight} taxaInfo={taxaInfo} />
      </View>
    </View>
  );
};

const m3 = StyleSheet.create( {
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerText: {
    marginBottom: 4,
  },
  species: {
    marginBottom: 4,
  },
  text: {
    marginBottom: 12,
    marginTop: 4,
  },
} );

export default MatchContainer;
