import React from "react";
import { StyleSheet, View } from "react-native";

import i18n from "../../../i18n";
import { baseTextStyles } from "../../../styles/textStyles";
import { viewStyles, textStyles } from "../../../styles/home/updates";
import GreenText from "../../UIComponents/GreenText";
import StyledText from "../../UIComponents/StyledText";
import { useTheme } from "../../Providers/ThemeProvider";
import { CameraIcon } from "../../UIComponents/AppIcons";

const Updates = ( ) => {
  const { theme } = useTheme( );
  const styles = StyleSheet.create( {
    container: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      ...theme.elevation.card,
    },
    iconCircle: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 18,
      height: 68,
      justifyContent: "center",
      marginRight: theme.spacing.lg,
      width: 68,
    },
    title: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
    },
    body: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
    },
  } );

  return (
    <View style={[viewStyles.container, styles.container]}>
      <View style={viewStyles.header}>
        <GreenText text="updates_card.header" />
      </View>
      <View style={[viewStyles.row, viewStyles.center]}>
        <View style={styles.iconCircle}>
          <CameraIcon color={theme.colors.primary} size={33} strokeWidth={2.25} />
        </View>
        <View>
          <StyledText style={[baseTextStyles.emptyState, textStyles.textWidth, styles.title]}>
            {i18n.t( "updates_card.updated_id_model" )}
          </StyledText>
          <StyledText style={[baseTextStyles.body, textStyles.text, textStyles.textWidth, styles.body]}>
            {i18n.t( "updates_card.over_x_species" )}
          </StyledText>
        </View>
      </View>
    </View>
  );
};

export default Updates;
