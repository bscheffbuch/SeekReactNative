import * as React from "react";
import type { KeyboardTypeOptions } from "react-native";
import { TextInput, Platform } from "react-native";

import styles from "../../styles/uiComponents/inputField";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";

type TextContentTypes = "emailAddress" | "username" | "password";
interface Props {
  readonly handleTextChange: ( text: string ) => void;
  readonly placeholder: string;
  readonly text: string;
  readonly type: TextContentTypes;
}

const InputField = ( {
  handleTextChange,
  placeholder,
  text,
  type,
}: Props ) => {
  const { theme } = useTheme( );
  let keyboardType: KeyboardTypeOptions = "default";
  if ( type === "emailAddress" ) {
    keyboardType = "email-address";
  } else if ( Platform.OS === "android" && type !== "password" ) {
    // adding this to turn off autosuggestions on Android
    keyboardType = "visible-password";
  }

  return (
    <TextInput
      // don't use accessibility label here because screen reader
      // should read the text value (editable content) instead
      autoCapitalize="none"
      autoCorrect={false}
      // spellCheck off is required for iOS 15
      // https://reactnative.dev/blog/2021/09/01/preparing-your-app-for-iOS-15-and-android-12
      spellCheck={false}
      autoFocus={type !== "password"}
      keyboardType={keyboardType}
      onChangeText={handleTextChange}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.muted}
      secureTextEntry={type === "password"}
      selectTextOnFocus={Platform.OS === "android"}
      style={[baseTextStyles.inputField, styles.inputField, {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        color: theme.colors.text,
      }]}
      textContentType={type} // iOS only
      value={text}
      testID={type}
    />
  );
};

export default InputField;
