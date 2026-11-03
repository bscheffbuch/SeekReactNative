import * as React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";

import i18n from "../../../i18n";
import styles from "../../../styles/uiComponents/buttons/modalBackButton";
import { XIcon } from "../AppIcons";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props {
  readonly closeModal: ( ) => void;
}

// Close button under dialogs: M3 filled tonal icon button (was a PNG).
const ModalBackButton = ( { closeModal }: Props ) => {
  const { theme } = useTheme( );
  return (
    <TouchableOpacity
      accessibilityLabel={i18n.t( "accessibility.close", { defaultValue: i18n.t( "accessibility.back" ) } )}
      accessibilityRole="button"
      accessible
      onPress={() => closeModal()}
      style={styles.backButton}
    >
      <View style={[local.disc, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
        <XIcon color={theme.colors.text} size={24} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
};

const local = StyleSheet.create( {
  disc: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
} );

export default ModalBackButton;
