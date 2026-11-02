// @ts-nocheck
import * as React from "react";
import { View, Pressable, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { viewStyles } from "../../styles/onboarding";
import i18n from "../../i18n";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  index: number;
  last: boolean;
  onNext: ( ) => void;
}

const Button = ( { last, onNext }: Props ) => {
  const navigation = useNavigation( );
  const { theme } = useTheme( );

  // TODO: navigation TS
  const navToHome = ( ) => navigation.navigate( "MainTabs", { screen: "Home" } );

  return (
    <View style={viewStyles.buttonRow}>
      {!last ? (
        <Pressable
          accessibilityRole="button"
          onPress={navToHome}
          style={( { pressed } ) => [viewStyles.textButton, pressed && { backgroundColor: theme.colors.pressed }]}
        >
          <Text style={[viewStyles.textButtonLabel, { color: theme.colors.primary, fontFamily: theme.typography.heading }]}>
            {i18n.t( "onboarding.skip" )}
          </Text>
        </Pressable>
      ) : <View />}
      <Pressable
        accessibilityRole="button"
        onPress={last ? navToHome : onNext}
        style={( { pressed } ) => [viewStyles.button, { backgroundColor: theme.colors.primary }, pressed && { opacity: 0.88 }]}
      >
        <Text style={[viewStyles.buttonLabel, { color: theme.colors.onPrimary, fontFamily: theme.typography.heading }]}>
          {i18n.t( last ? "onboarding.continue" : "onboarding.next" )}
        </Text>
      </Pressable>
    </View>
  );
};

export default Button;
