import React from "react";
import { StyleSheet } from "react-native";

import { viewStyles, textStyles } from "../../styles/species/species";
import { useCommonName } from "../../utility/customHooks/useCommonName";
import CopyButton from "../UIComponents/Buttons/CopyButton";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  readonly loading: boolean;
  readonly taxon: {
    scientificName: string;
  };
  readonly id: number;
  readonly selectedText: boolean;
  readonly highlightSelectedText: ( ) => void;
}

const SpeciesName = ( { loading, taxon, id, selectedText, highlightSelectedText }: Props ) => {
  const commonName = useCommonName( id );
  const scientificName = taxon && taxon.scientificName;
  const { theme } = useTheme( );
  const styles = StyleSheet.create( {
    common: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      letterSpacing: 0,
    },
    scientific: {
      color: theme.colors.muted,
      fontFamily: theme.typography.scientific,
    },
    selected: {
      backgroundColor: theme.colors.primaryContainer,
    },
  } );

  return (
    <>
      <StyledText style={[baseTextStyles.species, textStyles.commonNameText, styles.common]}>{!loading ? ( commonName || scientificName ) : null}</StyledText>
      <CopyButton stringToCopy={scientificName} handleHighlight={highlightSelectedText}>
        <StyledText
          style={[
            baseTextStyles.speciesSmall,
            styles.scientific,
            selectedText && viewStyles.selectedPressableArea,
            selectedText && styles.selected,
          ]}
        >
          {!loading ? scientificName : null}
        </StyledText>
      </CopyButton>
    </>
  );
};

export default SpeciesName;
