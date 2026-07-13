// @ts-nocheck
import * as React from "react";
import {
  View,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../i18n";
import { viewStyles, textStyles } from "../styles/species/donation";
import icons from "../assets/icons";
import urls from "../constants/urls";
import CopyButton from "./UIComponents/Buttons/CopyButton";
import StyledText from "./UIComponents/StyledText";
import { baseTextStyles } from "../styles/textStyles";
import { useTheme } from "./Providers/ThemeProvider";

const Donation = ( { navigation, route } ) => {
  const { theme } = useTheme( );
  const goBack = ( ) => navigation.goBack( );

  const [selectedText, setSelectedText] = React.useState( false );

  const { params } = route;

  const standardCampaign = `${urls.DONATE_BASE_URL}${urls.UTM_STANDARD_CAMPAIGN}&utm_source=android`;
  const seekYearInReviewCampaign = `${urls.DONATE_BASE_URL}&utm_campaign=${params?.utmCampaign}&utm_source=android`;
  const donationPage = params?.utmCampaign ? seekYearInReviewCampaign : standardCampaign;
  const redirectForiOS = "inaturalist.org/donate-seek";

  const highlightSelectedText = ( ) => setSelectedText( true );

  return (
    <SafeAreaView style={[viewStyles.container, { backgroundColor: theme.colors.canvas }]} edges={["top"]}>
      <View style={[viewStyles.header, {
        backgroundColor: theme.colors.canvas,
        borderBottomColor: theme.colors.border,
      }]}>
        <StyledText style={[baseTextStyles.button, textStyles.text, { color: theme.colors.text }]}>
          {i18n.t( "settings.donate" )}
        </StyledText>
        <TouchableOpacity
          onPress={goBack}
          style={viewStyles.back}
        >
          <Image source={icons.closeWhite} />
        </TouchableOpacity>
      </View>
      {Platform.OS === "android" ? (
        <WebView
          startInLoadingState
          source={{ uri: donationPage }}
        />
      ) : (
        <View style={[viewStyles.whiteContainer, { backgroundColor: theme.colors.canvas }]}>
          <StyledText style={[baseTextStyles.body, textStyles.blackText]}>
           {i18n.t( "settings.donate_ios" )}
          </StyledText>
          <CopyButton stringToCopy={redirectForiOS} handleHighlight={highlightSelectedText}>
            <StyledText style={[
              baseTextStyles.donationLink,
              textStyles.donateText,
              selectedText && viewStyles.selectedPressableArea,
            ]}>
              {redirectForiOS}
            </StyledText>
          </CopyButton>
        </View>
      )}
      <View style={[viewStyles.bottom, { backgroundColor: theme.colors.canvas }]} />
    </SafeAreaView>
  );
};

export default Donation;
