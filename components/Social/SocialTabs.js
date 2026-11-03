import * as React from "react";
import { View, TouchableOpacity } from "react-native";

import { viewStyles, textStyles } from "../../styles/social/social";
import i18n from "../../i18n";
import StyledText from "../UIComponents/StyledText";
import { useTheme } from "../Providers/ThemeProvider";

// Material 3 secondary tabs
const SocialTabs = ( { tab, toggleTab } ) => {
  const { theme } = useTheme( );
  const renderTab = selectedTab => (
    <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: tab === selectedTab }} onPress={toggleTab}>
      <StyledText style={[
        textStyles.photoSizeText,
        { color: tab === selectedTab ? theme.colors.primary : theme.colors.onSurfaceVariant },
        tab === selectedTab && textStyles.selectedPhotoSizeText,
      ]}>
        {i18n.t( `social.${selectedTab}` )}
      </StyledText>
    </TouchableOpacity>
  );

  const renderIndicator = selectedTab => {
    if ( tab === selectedTab ) {
      return <View style={[viewStyles.roundedIndicator, { backgroundColor: theme.colors.primary }]} />;
    } else {
      return <View style={viewStyles.hiddenIndicator} />;
    }
  };

  return (
    <>
      <View style={viewStyles.photoTabs}>
        {renderTab( "square" )}
        {renderTab( "original" )}
      </View>
      <View style={[viewStyles.photoTabs, viewStyles.tabDivider, { borderBottomColor: theme.colors.outlineVariant }]}>
        {renderIndicator( "square" )}
        {renderIndicator( "original" )}
      </View>
    </>
  );
};

export default SocialTabs;
