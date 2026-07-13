import * as React from "react";
import {
  TouchableOpacity,
  View,
  Image,
} from "react-native";

import i18n from "../../i18n";
import { viewStyles, textStyles, imageStyles } from "../../styles/modals/warningModal";
import { dimensions } from "../../styles/global";
import icons from "../../assets/icons";
import GreenButton from "../UIComponents/Buttons/GreenButton";
import WhiteModal from "../UIComponents/Modals/WhiteModal";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";
import { CheckIcon } from "../UIComponents/AppIcons";

interface Props {
  closeModal: ( hideFuture?: boolean ) => void;
}

const WarningModal = ( { closeModal }: Props ) => {
  const { theme } = useTheme( );
  const [hideFuture, setHideFuture] = React.useState( false );
  const bodyColor = { color: theme.colors.text };
  const checkboxStateStyle = React.useMemo( () => ( {
    backgroundColor: hideFuture ? theme.colors.primary : "transparent",
    borderColor: hideFuture ? theme.colors.primary : theme.colors.border,
  } ), [hideFuture, theme] );
  const toggleHideFuture = ( ) => setHideFuture( previous => !previous );
  const handleContinue = ( ) => closeModal( hideFuture );

  return (
    <WhiteModal
      closeModal={closeModal}
      noButton
      width={dimensions.height > 570 ? 337 : 320}
      accessibilityLabel={i18n.t( "accessibility.warning_modal" )}
    >
      <View style={[viewStyles.header, { backgroundColor: theme.colors.primaryContainer }]}>
        <StyledText
          allowFontScaling={false}
          style={[baseTextStyles.button, textStyles.headerText, { color: theme.colors.text }]}
        >
          {i18n.t( "warning.remember" )}
        </StyledText>
      </View>
      <View style={viewStyles.marginTop} />
      <StyledText
        allowFontScaling={false}
        style={[baseTextStyles.body, textStyles.wideText, bodyColor]}
      >
        {i18n.t( "warning.tip_0" )}
      </StyledText>
      <View style={viewStyles.marginSmall} />
      <View>
        {[1, 2, 3].map( ( warning ) => {
          const iconName = icons[`warning_${warning}`];
          return (
            <React.Fragment key={warning}>
              <View style={viewStyles.row}>
                <Image source={iconName} style={imageStyles.image} />
                <StyledText
                  allowFontScaling={false}
                  style={[baseTextStyles.body, textStyles.text, bodyColor]}
                >
                  {i18n.t( `warning.tip_${warning}` )}
                </StyledText>
              </View>
              {warning !== 3 && <View style={viewStyles.margin} />}
            </React.Fragment>
          );
        } )}
        <View style={viewStyles.marginSmall} />
        <StyledText
          allowFontScaling={false}
          style={[baseTextStyles.body, textStyles.wideText, bodyColor]}
        >
          {i18n.t( "warning.tip_4" )}
        </StyledText>
      </View>
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityState={{ checked: hideFuture }}
        activeOpacity={0.8}
        onPress={toggleHideFuture}
        style={viewStyles.reminderRow}
      >
        <View
          style={[
            viewStyles.checkbox,
            checkboxStateStyle,
          ]}
        >
          {hideFuture && (
            <CheckIcon
              color={theme.colors.inverseText}
              size={17}
              strokeWidth={3}
            />
          )}
        </View>
        <StyledText
          allowFontScaling={false}
          style={[baseTextStyles.bodySmall, textStyles.reminderText, bodyColor]}
        >
          {i18n.t( "warning.hide_future" )}
        </StyledText>
      </TouchableOpacity>
      <View style={viewStyles.button}>
        <GreenButton
          testID="warningContinue"
          allowFontScaling={false}
          handlePress={handleContinue}
          text="onboarding.continue"
          width={dimensions.height < 570 ? 271 : 285}
        />
      </View>
    </WhiteModal>
  );
};

export default WarningModal;
