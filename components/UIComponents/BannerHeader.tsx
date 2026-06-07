import React from "react";
import { View } from "react-native";

import { viewStyles, textStyles } from "../../styles/badges/banner";
import StyledText from "./StyledText";

interface Props {
  readonly text: string;
  readonly modal?: boolean;
}

const BannerHeader = ( { text, modal = false }: Props ) => (
  <View
    style={[viewStyles.banner, modal && viewStyles.modal]}
  >
    <StyledText
      allowFontScaling={false}
      style={textStyles.bannerText}
    >
      {text}
    </StyledText>
  </View>
);

export default BannerHeader;
