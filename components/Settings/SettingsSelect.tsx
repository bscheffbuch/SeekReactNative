import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import i18n from "../../i18n";
import { ChevronDownIcon } from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";

interface PickerItem<T> {
  label: string;
  value: T;
}

interface Props<T> {
  disabled?: boolean;
  items: PickerItem<T>[];
  label: string;
  onDonePress?: () => void;
  onValueChange: ( value: T ) => void;
  testID?: string;
  value: T;
}

const SettingsSelect = <T extends string | number,>( {
  disabled = false,
  items,
  label,
  onDonePress,
  onValueChange,
  testID,
  value,
}: Props<T> ) => {
  const { theme } = useTheme( );
  const [open, setOpen] = useState( false );
  const selected = items.find( item => item.value === value );
  const styles = StyleSheet.create( {
    // M3 basic dialog with radio options
    backdrop: {
      alignItems: "center",
      backgroundColor: theme.colors.overlay,
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.lg,
    },
    sheet: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: 28,
      maxHeight: "72%",
      overflow: "hidden",
      paddingBottom: theme.spacing.sm,
      paddingTop: theme.spacing.lg,
      width: "100%",
    },
    sheetTitle: {
      color: theme.colors.text,
      fontFamily: theme.typography.body,
      fontSize: 24,
      lineHeight: 32,
      paddingBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    // M3 two-line list item
    field: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.md,
      minHeight: 64,
      paddingVertical: theme.spacing.sm,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    label: {
      color: theme.colors.text,
      fontFamily: theme.typography.body,
      fontSize: 16,
      lineHeight: 24,
    },
    value: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.body,
      fontSize: 14,
      lineHeight: 20,
    },
    disabled: {
      opacity: 0.48,
    },
    option: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.md,
      minHeight: 56,
      paddingHorizontal: theme.spacing.lg,
    },
    selectedOption: {},
    radio: {
      alignItems: "center",
      borderColor: theme.colors.onSurfaceVariant,
      borderRadius: 10,
      borderWidth: 2,
      height: 20,
      justifyContent: "center",
      width: 20,
    },
    radioOn: {
      borderColor: theme.colors.primary,
    },
    radioDot: {
      backgroundColor: theme.colors.primary,
      borderRadius: 5,
      height: 10,
      width: 10,
    },
    optionText: {
      color: theme.colors.text,
      flex: 1,
      fontFamily: theme.typography.body,
      fontSize: 16,
      lineHeight: 22,
    },
    selectedOptionText: {},
  } );

  const openPicker = () => {
    if ( !disabled ) {
      setOpen( true );
    }
  };

  const closePicker = () => setOpen( false );

  const selectItem = ( item: PickerItem<T> ) => {
    onValueChange( item.value );
    onDonePress?.();
    closePicker();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={openPicker}
        testID={testID}
      >
        <View style={[styles.field, disabled && styles.disabled]}>
        <View style={styles.copy}>
          <Text style={styles.label}>{label}</Text>
          <Text numberOfLines={1} style={styles.value}>
            {selected?.label || ""}
          </Text>
        </View>
        <ChevronDownIcon color={theme.colors.onSurfaceVariant} size={22} strokeWidth={2} />
      </View>
      </Pressable>
      <Modal
        animationType="fade"
        onRequestClose={closePicker}
        transparent
        visible={open}
      >
        <Pressable
          accessibilityLabel={i18n.t( "accessibility.close" )}
          accessibilityRole="button"
          style={styles.backdrop}
          onPress={closePicker}
        >
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {items.map( item => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    key={`${item.value}`}
                    onPress={() => selectItem( item )}
                    style={( { pressed } ) => [styles.option, pressed && { backgroundColor: theme.colors.pressed }]}
                  >
                    <View style={[styles.radio, isSelected && styles.radioOn]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[styles.optionText, isSelected && styles.selectedOptionText]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              } )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default SettingsSelect;
