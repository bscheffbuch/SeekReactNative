// @ts-nocheck
import * as React from "react";
import { I18nManager, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import i18n from "../../../i18n";
import { viewStyles } from "../../../styles/uiComponents/buttons/backArrow";
import { ArrowLeftIcon } from "../AppIcons";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props {
  readonly green?: boolean;
  readonly route?: string | null;
  readonly handlePress?: ( ) => void;
}

// M3 standard icon button (vector arrow; was a PNG). On photos and colored headers
// the arrow sits on a translucent disc so it stays readable.
const BackArrow = ( { green = false, route = null, handlePress }: Props ) => {
  const navigation = useNavigation();
  const { name } = useRoute();
  const { theme } = useTheme( );

  const onPress = handlePress || ( ( ) => {
    if ( route ) {
      navigation.popTo( route );
    } else {
      navigation.goBack();
    }
  } );

  return (
    <TouchableOpacity
      accessibilityLabel={i18n.t( "accessibility.back" )}
      accessibilityRole="button"
      accessible
      onPress={onPress}
      style={[viewStyles.backButton, name === "ChallengeDetails" && viewStyles.challengeDetails]}
    >
      <View style={[viewStyles.iconDisc, !green && viewStyles.iconDiscScrim, I18nManager.isRTL && viewStyles.flip]}>
        <ArrowLeftIcon color={green ? theme.colors.text : "#FFFFFF"} size={24} strokeWidth={2.2} />
      </View>
    </TouchableOpacity>
  );
};

export default BackArrow;
