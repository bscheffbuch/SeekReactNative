import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";

import { viewStyles } from "../../../styles/home/speciesNearby";
import { baseTextStyles } from "../../../styles/textStyles";
import i18n from "../../../i18n";
import StyledText from "../../UIComponents/StyledText";
import { useTheme } from "../../Providers/ThemeProvider";
import { MapPinIcon } from "../../UIComponents/AppIcons";

interface Props {
  readonly openLocationPicker: ( ) => void;
  readonly disabled: boolean;
  readonly location: string;
}

const LocationPickerButton = ( {
  openLocationPicker,
  disabled,
  location,
}: Props ) => {
  const { theme } = useTheme( );
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
  const locationText = location ? location : i18n.t( "species_nearby.no_location" );
  return (
    <TouchableOpacity
      onPress={openLocationPicker}
      style={[viewStyles.row, viewStyles.locationPickerButton]}
      disabled={disabled}
    >
      <MapPinIcon color={theme.colors.primary} size={20} strokeWidth={2.2} />
      <View style={styles.pill}>
        <StyledText style={[baseTextStyles.buttonGreen, styles.text]}>
          {locationText}
        </StyledText>
      </View>
    </TouchableOpacity>
  );
};

export default LocationPickerButton;
