import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import i18n from "../../../i18n";
import { useTheme } from "../../Providers/ThemeProvider";
import { PencilIcon } from "../AppIcons";

interface Props {
  // translation key
  text?: string;
  onPress: ( ) => void;
}

// Tonal pill that opens the change-species sheet.
const ChangeSpeciesButton = ( { text = "change_species.button", onPress }: Props ) => {
  const { theme } = useTheme( );
  const styles = useMemo( ( ) => makeStyles( theme ), [theme] );
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={( { pressed } ) => [styles.button, pressed && styles.pressed]}
      testID="changeSpeciesButton"
    >
      <PencilIcon color={theme.colors.onSecondaryContainer} size={18} strokeWidth={2.2} />
      <Text style={styles.label}>{i18n.t( text )}</Text>
    </Pressable>
  );
};

const makeStyles = ( theme: any ) => StyleSheet.create( {
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 20,
    flexDirection: "row",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  pressed: { opacity: 0.8 },
  label: { color: theme.colors.onSecondaryContainer, fontFamily: theme.typography.heading, fontSize: 14 },
} );

export default ChangeSpeciesButton;
