import * as React from "react";
import { TextInput } from "react-native";

import styles from "../../styles/posting/postToiNat";
import i18n from "../../i18n";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";

type description = "description";
interface Props {
  description?: string | null;
  updateObservation: ( description: description, text: string ) => void;
}

const Notes = ( { description, updateObservation }: Props ) => {
  const { theme } = useTheme( );

  return (
    <TextInput
      keyboardType="default"
      multiline
      defaultValue={description ?? undefined}
      onChangeText={text => updateObservation( "description", text )}
      placeholder={i18n.t( "posting.notes" )}
      placeholderTextColor={theme.colors.muted}
      style={[baseTextStyles.inputField, styles.inputField, { color: theme.colors.text }]}
    />
  );
};

export default Notes;
