import React, { useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
} from "react-native";

import i18n from "../../../i18n";
import { viewStyles } from "../../../styles/home/speciesNearby";
import { baseTextStyles } from "../../../styles/textStyles";
import Picker from "../../../components/UIComponents/Picker";
import StyledText from "../../UIComponents/StyledText";
import { useSpeciesNearby } from "../../Providers/SpeciesNearbyProvider";
import { useTheme } from "../../Providers/ThemeProvider";
import { SlidersIcon } from "../../UIComponents/AppIcons";

interface Props {
  readonly updateTaxaType: ( value: string ) => void;
  readonly error?: string | null;
}

const TaxonPicker = ( { updateTaxaType, error }: Props ) => {
  const { speciesNearby } = useSpeciesNearby( );
  const { theme } = useTheme( );
  const { taxaType } = speciesNearby;
  const styles = StyleSheet.create( {
    pill: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 999,
      paddingBottom: 4,
      paddingHorizontal: 9,
      paddingTop: 4,
    },
    text: {
      color: theme.colors.primary,
      fontFamily: theme.typography.heading,
    },
  } );

  const types = useMemo( () => {
    const list = ["all", "plants", "amphibians", "fungi", "fish", "reptiles", "arachnids", "birds", "insects", "mollusks", "mammals"];

    return list.map( ( item ) => ( {
      label: i18n.t( `taxon_picker.${item}` ),
      value: item,
    } ) );
  }, [] );

  const handleValueChange = useCallback( ( value: string ) => updateTaxaType( value ), [updateTaxaType] );

  const renderTaxonPicker = useMemo( () => (
    <View style={[viewStyles.row, viewStyles.marginLeft]}>
      <SlidersIcon color={theme.colors.primary} size={20} strokeWidth={2.2} />
      <View style={styles.pill}>
        <StyledText style={[baseTextStyles.buttonGreen, styles.text]}>
          {i18n.t( `taxon_picker.${taxaType}` )}
        </StyledText>
      </View>
    </View>
  ), [styles.pill, styles.text, taxaType, theme.colors.primary] );

  return (
    <Picker
      itemList={types}
      handleValueChange={handleValueChange}
      disabled={error !== null}
    >
      {renderTaxonPicker}
    </Picker>
  );
};

export default TaxonPicker;
