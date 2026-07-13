// @ts-nocheck
import type { PropsWithChildren} from "react";
import React, { useCallback } from "react";
import RNPickerSelect from "react-native-picker-select";

import { useTheme } from "../Providers/ThemeProvider";

const placeholder = {};

interface Props extends PropsWithChildren {
  handleValueChange: ( value: string ) => void;
  itemList: {
    label: string;
    value: string;
  }[];
  disabled?: boolean;
}

const Picker = ( {
  handleValueChange,
  children,
  itemList,
  disabled,
}: Props ) => {
  const showIcon = useCallback( () => <></>, [] );
  const { theme } = useTheme();

  return (
    <RNPickerSelect
      darkTheme={theme.isDark}
      hideIcon
      Icon={showIcon}
      items={itemList}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      useNativeAndroidPickerStyle={false}
      disabled={disabled}
      pickerProps={{
        themeVariant: theme.isDark ? "dark" : "light",
      }}
    >
      {children}
    </RNPickerSelect>
  );
};

export default Picker;
