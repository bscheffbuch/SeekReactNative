import * as React from "react";
import {
  Image,
  Text,
  View,
} from "react-native";

import i18n from "../../i18n";
import { viewStyles } from "../../styles/onboarding";
import Swiper from "./Swiper";
import icons from "../../assets/icons";
import { useTheme } from "../Providers/ThemeProvider";

const OnboardingScreen = ( ) => {
  const { theme } = useTheme( );
  return (
    <Swiper>
      {[1, 2, 3].map( ( item ) => (
        <View key={`${item}`} style={viewStyles.page}>
          <View style={[viewStyles.imageCard, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
            <Image source={icons[`onboarding${item}`]} style={viewStyles.imageFill} resizeMode="cover" />
          </View>
          <Text
            allowFontScaling={false}
            accessibilityRole="header"
            style={[viewStyles.title, { color: theme.colors.text, fontFamily: theme.typography.body }]}
          >
            {i18n.t( `onboarding.onboarding_${item}` )}
          </Text>
        </View>
      ) )}
    </Swiper>
  );
};

export default OnboardingScreen;
