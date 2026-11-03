import * as React from "react";
import {
  View,
  TouchableOpacity,
} from "react-native";

import i18n from "../../i18n";
import { viewStyles, textStyles } from "../../styles/species/speciesError";
import { WifiOffIcon } from "../UIComponents/AppIcons";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  readonly seenTaxa: Object | null;
  readonly checkForInternet: () => void;
}

const SpeciesError = ( { seenTaxa, checkForInternet }: Props ) => {
  const { theme } = useTheme( );

  return (
    <View style={[viewStyles.background, { backgroundColor: theme.colors.canvas }]}>
      <TouchableOpacity accessibilityRole="button"
        onPress={checkForInternet}
        style={[viewStyles.errorContainer, viewStyles.center, viewStyles.row, { backgroundColor: theme.colors.surfaceContainerHighest }]}
      >
        <WifiOffIcon color={theme.colors.onSurfaceVariant} size={28} strokeWidth={2} />
        <StyledText style={[baseTextStyles.bodyWhite, textStyles.errorText, { color: theme.colors.text }]}>{i18n.t( "species_detail.internet_error" )}</StyledText>
      </TouchableOpacity>
      {seenTaxa && <StyledText style={[baseTextStyles.body, textStyles.text]}>{i18n.t( "species_detail.species_saved" )}</StyledText>}
    </View>
  );
};

export default SpeciesError;
