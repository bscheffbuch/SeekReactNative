import * as React from "react";
import { StyleSheet, View } from "react-native";
import { useRoute } from "@react-navigation/native";

import i18n from "../../i18n";
import { viewStyles, textStyles } from "../../styles/uiComponents/emptyState";
import StyledText from "./StyledText";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";

const EmptyState = () => {
  const { name } = useRoute();
  const { theme } = useTheme();
  const obsScreen = name === "Observations";
  const themedStyles = StyleSheet.create( {
    header: {
      color: theme.colors.text,
      fontFamily: theme.typography.heading,
    },
    text: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
    },
  } );

  return (
    <View style={viewStyles.container}>
      <StyledText style={[baseTextStyles.header, textStyles.headerText, themedStyles.header]}>
        {obsScreen
          ? i18n.t( "observations.no_obs" )
          : i18n.t( "notifications.none" )}
      </StyledText>
      <StyledText style={[baseTextStyles.body, textStyles.text, themedStyles.text]}>
        {obsScreen
          ? i18n.t( "observations.help" )
          : i18n.t( "notifications.about" )}
      </StyledText>
    </View>
  );
};

export default EmptyState;
