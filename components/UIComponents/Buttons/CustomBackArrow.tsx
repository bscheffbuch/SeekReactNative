import * as React from "react";
import { I18nManager, TouchableOpacity, View } from "react-native";
import type { ViewStyle } from "react-native";

import i18n from "../../../i18n";
import { viewStyles } from "../../../styles/uiComponents/buttons/backArrow";
import { ArrowLeftIcon } from "../AppIcons";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props {
  readonly green?: boolean;
  handlePress: () => void;
  style: ViewStyle;
}

const CustomBackArrow = ( {
  handlePress,
  style,
  green,
}: Props ) => {
  const { theme } = useTheme( );
  return (
    <TouchableOpacity
      accessibilityLabel={i18n.t( "accessibility.back" )}
      accessibilityRole="button"
      accessible
      onPress={handlePress}
      style={style}
    >
      <View style={[viewStyles.iconDisc, !green && viewStyles.iconDiscScrim, I18nManager.isRTL && viewStyles.flip]}>
        <ArrowLeftIcon color={green ? theme.colors.text : "#FFFFFF"} size={24} strokeWidth={2.2} />
      </View>
    </TouchableOpacity>
  );
};

export default CustomBackArrow;
