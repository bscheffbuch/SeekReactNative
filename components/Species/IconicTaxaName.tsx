import React from "react";
import { StyleSheet, View } from "react-native";

import i18n from "../../i18n";
import { iconicTaxaNames } from "../../utility/dictionaries/taxonomyDicts";
import { viewStyles } from "../../styles/species/species";
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
    // M3 assist chip for the iconic taxon (was a full-width green banner)
    label: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.secondaryContainer,
      borderRadius: 8,
      color: theme.colors.onSecondaryContainer,
      fontFamily: theme.typography.heading,
      fontSize: 14,
      lineHeight: 20,
      marginLeft: 24,
      marginTop: 16,
      overflow: "hidden",
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
  } );
  return (
    <>
      {isLandscape && <View style={[viewStyles.topRibbon, styles.ribbon]} />}
      <StyledText
        style={[
          baseTextStyles.headerWhite,
          styles.label,
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
