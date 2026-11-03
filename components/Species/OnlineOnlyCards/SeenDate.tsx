import * as React from "react";
import { View } from "react-native";

import { viewStyles } from "../../../styles/species/species";
import { CircleCheckIcon } from "../../UIComponents/AppIcons";
import { useTheme } from "../../Providers/ThemeProvider";
import i18n from "../../../i18n";
import StyledText from "../../UIComponents/StyledText";
import { useAppOrientation } from "../../Providers/AppOrientationProvider";
import { baseTextStyles } from "../../../styles/textStyles";

interface Props {
  readonly loading: boolean;
  readonly seenDate: string | null;
}

const SeenDate = ( { loading, seenDate }: Props ) => {
  const { isLandscape } = useAppOrientation( );
  const { theme } = useTheme( );
  return !loading ? (
    <View style={[viewStyles.row, viewStyles.textContainer, isLandscape && viewStyles.largerTextContainer]}>
      <View style={viewStyles.checkmark}>
        <CircleCheckIcon color={theme.colors.primary} size={20} strokeWidth={2.2} />
      </View>
      <StyledText style={baseTextStyles.body}>{i18n.t( "species_detail.seen_on", { date: seenDate } )}</StyledText>
    </View>
  ) : null;
};

export default SeenDate;
