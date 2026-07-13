import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CheckIcon, ChevronDownIcon } from "../UIComponents/AppIcons";
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
    backdrop: {
      alignItems: "center",
      backgroundColor: theme.colors.overlay,
      flex: 1,
      justifyContent: "flex-end",
      padding: theme.spacing.lg,
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      maxHeight: "72%",
      overflow: "hidden",
      padding: theme.spacing.sm,
      width: "100%",
    },
    sheetTitle: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 17,
      lineHeight: 23,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    field: {
      backgroundColor: theme.colors.elevatedSurface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      flexDirection: "row",
      minHeight: 58,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      alignItems: "center",
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    label: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
      fontSize: 12,
      lineHeight: 16,
    },
    value: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
      fontSize: 16,
      lineHeight: 22,
      marginTop: theme.spacing.xxs,
    },
    disabled: {
      opacity: 0.48,
    },
    option: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      flexDirection: "row",
      minHeight: 54,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    selectedOption: {
      backgroundColor: theme.colors.primaryContainer,
    },
    optionText: {
      color: theme.colors.text,
      flex: 1,
      fontFamily: theme.typography.body,
      fontSize: 16,
      lineHeight: 22,
    },
    selectedOptionText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.heading,
    },
    handle: {
      alignSelf: "center",
      backgroundColor: theme.colors.border,
      borderRadius: 999,
      height: 4,
      marginBottom: theme.spacing.xs,
      marginTop: theme.spacing.xs,
      width: 42,
    },
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
        <ChevronDownIcon color={theme.colors.primary} size={22} strokeWidth={2.2} />
      </View>
      </Pressable>
      <Modal
        animationType="fade"
        onRequestClose={closePicker}
        transparent
        visible={open}
      >
        <Pressable style={styles.backdrop} onPress={closePicker}>
          <Pressable style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {items.map( item => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={`${item.value}`}
                    onPress={() => selectItem( item )}
                    style={[styles.option, isSelected && styles.selectedOption]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.optionText, isSelected && styles.selectedOptionText]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <CheckIcon color={theme.colors.primary} size={20} strokeWidth={2.4} />
                    )}
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
