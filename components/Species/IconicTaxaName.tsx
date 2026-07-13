import React from "react";
import { StyleSheet, View } from "react-native";

import i18n from "../../i18n";
import { iconicTaxaNames } from "../../utility/dictionaries/taxonomyDicts";
import { textStyles, viewStyles } from "../../styles/species/species";
import StyledText from "../UIComponents/StyledText";
import { useAppOrientation } from "../Providers/AppOrientationProvider";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  loading: boolean;
  iconicTaxonId: number | null;
}

const IconicTaxaName = ( { loading, iconicTaxonId }: Props ) => {
  const { isLandscape } = useAppOrientation( );
  const { theme } = useTheme( );
  const styles = StyleSheet.create( {
    ribbon: {
      backgroundColor: theme.colors.primaryContainer,
    },
    label: {
      backgroundColor: theme.colors.primaryContainer,
      color: theme.colors.primary,
    },
  } );
  return (
    <>
      {isLandscape && <View style={[viewStyles.topRibbon, styles.ribbon]} />}
      <StyledText
        style={[
          baseTextStyles.headerWhite,
          textStyles.iconicTaxaText,
          styles.label,
          isLandscape && textStyles.largerPadding,
        ]}
      >
        {!loading ? (
            iconicTaxonId && i18n.t( iconicTaxaNames[iconicTaxonId] )
          ) : null
        }
      </StyledText>
    </>
  );
};

export default IconicTaxaName;
