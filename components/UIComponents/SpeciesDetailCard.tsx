import * as React from "react";
import { StyleSheet, View } from "react-native";

import { viewStyles } from "../../styles/species/species";
import GreenText from "./GreenText";
import { useAppOrientation } from "../Providers/AppOrientationProvider";
import { useTheme } from "../Providers/ThemeProvider";


interface Props extends React.PropsWithChildren {
  readonly text: string;
  readonly hide?: boolean;
}

const SpeciesDetailCard = ( { children, text, hide = false }: Props ) => {
  const { isLandscape } = useAppOrientation( );
  const { theme } = useTheme( );
  const styles = StyleSheet.create( {
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 14,
      borderWidth: 1,
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      ...theme.elevation.card,
    },
    header: {
      marginBottom: theme.spacing.sm,
    },
  } );

  if ( hide ) {
    return null;
  }
  return (
    <View style={isLandscape ? viewStyles.largerTextContainer : viewStyles.textContainer}>
      <View style={styles.card}>
        <View style={styles.header}>
          <GreenText text={text} />
        </View>
        {children}
      </View>
    </View>
  );
};

export default SpeciesDetailCard;
