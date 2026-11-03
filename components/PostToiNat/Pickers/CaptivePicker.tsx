// @ts-nocheck
import * as React from "react";
import RNPickerSelect from "react-native-picker-select";

import i18n from "../../../i18n";
import PostFieldRow from "../PostFieldRow";
import { SproutIcon } from "../../UIComponents/AppIcons";
import { useTheme } from "../../Providers/ThemeProvider";

type Captive = "captive_flag";
interface Props {
  updateObservation: ( string: Captive, value: boolean ) => void;
  captive: boolean;
}

const CaptivePicker = ( { updateObservation, captive }: Props ) => {
  const { theme } = useTheme( );
  const captiveTypes = [{
    label: i18n.t( "posting.no" ),
    value: false,
  },
  {
    label: i18n.t( "posting.yes" ),
    value: true,
  }];

  const handleChange = ( value: boolean ) => updateObservation( "captive_flag", value );

  return (
    <RNPickerSelect
      items={captiveTypes}
      onValueChange={handleChange}
      placeholder={{}}
      useNativeAndroidPickerStyle={false}
      pickerProps={{
        themeVariant: theme.isDark ? "dark" : "light",
      }}
    >
      <PostFieldRow
        icon={SproutIcon}
        label={i18n.t( "posting.captive" )}
        value={captive ? i18n.t( "posting.yes" ) : i18n.t( "posting.no" )}
      />
    </RNPickerSelect>
  );
};

export default CaptivePicker;
