import React from "react";
import { StyleSheet, View, TextInput, TouchableOpacity } from "react-native";

import i18n from "../../i18n";
import { viewStyles, textStyles } from "../../styles/observations/searchBar";
import { baseTextStyles } from "../../styles/textStyles";
import { SearchIcon, XIcon } from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  fetchFilteredObservations: ( searchText: string ) => void;
  searchText: string;
  clearText: () => void;
}

const SearchBar = ( { fetchFilteredObservations, searchText, clearText }: Props ) => {
  const { theme } = useTheme( );
  const themedStyles = StyleSheet.create( {
    row: {
      backgroundColor: theme.colors.elevatedSurface,
      borderColor: theme.colors.border,
    },
    input: {
      color: theme.colors.text,
      fontFamily: theme.typography.body,
    },
  } );

  return (
    <View style={[viewStyles.row, viewStyles.margins, themedStyles.row]}>
      <SearchIcon color={theme.colors.primary} size={21} strokeWidth={2.2} />
      {searchText.length > 0 && (
        <TouchableOpacity
          onPress={clearText}
          style={viewStyles.top}
        >
          <XIcon color={theme.colors.muted} size={16} strokeWidth={2.2} />
        </TouchableOpacity>
      )}
      <TextInput
        onChangeText={fetchFilteredObservations}
        placeholder={i18n.t( "observations.search" )}
        placeholderTextColor={theme.colors.muted}
        style={[baseTextStyles.inputField, textStyles.inputField, themedStyles.input]}
        defaultValue={searchText}
      />
    </View>
  );
};

export default SearchBar;
