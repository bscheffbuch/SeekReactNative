import * as React from "react";
import {
  View,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import i18n from "../../i18n";
import { viewStyles, textStyles } from "../../styles/modals/deleteModal";
import { colors } from "../../styles/global";
import SpeciesCard from "../UIComponents/SpeciesCard";
import WhiteModal from "../UIComponents/Modals/WhiteModal";
import Button from "../UIComponents/Buttons/Button";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";
import { XIcon } from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  closeModal: ( ) => void;
  deleteObservation: ( id: number ) => void;
  itemToDelete: {
    iconicTaxonId: number;
    preferredCommonName: string;
    name: string;
    photo: object;
    id: number;
  };
}

const DeleteModal = ( {
  closeModal,
  deleteObservation,
  itemToDelete,
}: Props ) => {
  const { theme } = useTheme( );
  const {
    id,
    photo,
    preferredCommonName,
    name,
    iconicTaxonId,
  } = itemToDelete;

  const deleteObs = ( ) => {
    deleteObservation( id );
    closeModal( );
  };

  return (
    <WhiteModal noButton>
      <LinearGradient
        colors={[theme.colors.primaryContainer, theme.colors.primaryContainer]}
        style={viewStyles.flagHeader}
      >
        <View style={[viewStyles.flagTextContainer, viewStyles.row]}>
          <StyledText allowFontScaling={false} style={[baseTextStyles.button, textStyles.buttonText, { color: theme.colors.onPrimaryContainer }]}>
            {i18n.t( "delete.header" )}
          </StyledText>
          <TouchableOpacity accessibilityRole="button"
            accessibilityLabel={i18n.t( "accessibility.close" )}
            onPress={closeModal}
            style={viewStyles.flagBackButton}
          >
            <XIcon color={theme.colors.onPrimaryContainer} size={24} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <View style={viewStyles.margin} />
      <SpeciesCard
        allowFontScaling={false}
        taxon={{
          preferredCommonName,
          name,
          iconicTaxonId,
        }}
        photo={photo}
      />
      <View style={viewStyles.margin} />
      <StyledText allowFontScaling={false} style={[baseTextStyles.body, textStyles.text]}>{i18n.t( "delete.description" )}</StyledText>
      <View style={viewStyles.marginSmall} />
      <Button
        handlePress={deleteObs}
        text="delete.yes"
        large
      />
      <View style={viewStyles.marginSmall} />
      <Button
        handlePress={closeModal}
        text="delete.no"
        color={colors.grayGradientLight}
      />
      <View style={viewStyles.marginLarge} />
    </WhiteModal>
  );
};

export default DeleteModal;
