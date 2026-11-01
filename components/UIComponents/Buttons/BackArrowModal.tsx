import * as React from "react";
import { TouchableOpacity } from "react-native";

import i18n from "../../../i18n";
import { viewStyles } from "../../../styles/uiComponents/buttons/backArrow";
import { ChevronLeftIcon } from "../AppIcons";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props {
  handlePress: () => void;
}

const BackArrowModal = ( { handlePress }: Props ) => {
  const { theme } = useTheme( );

  return (
    <TouchableOpacity
      accessibilityLabel={i18n.t( "accessibility.back" )}
      accessibilityRole="button"
      accessible
      onPress={handlePress}
      style={viewStyles.backButton}
    >
      <ChevronLeftIcon color={theme.colors.text} size={26} />
    </TouchableOpacity>
  );
};

export default BackArrowModal;
