import * as React from "react";
import {
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import i18n from "../../../i18n";
import { viewStyles, textStyles } from "../../../styles/uiComponents/modals/modalWithGradient";
import iconicTaxa from "../../../assets/iconicTaxa";
import StyledText from "../StyledText";
import { baseTextStyles } from "../../../styles/textStyles";
import { useTheme } from "../../Providers/ThemeProvider";
import { XIcon } from "../AppIcons";

interface Props extends React.PropsWithChildren {
  readonly closeModal: () => void;
  readonly color: string;
  readonly userImage: string;
  readonly originalImage: string | null;
  readonly displayDate?: string | null;
}

const ModalWithGradient = ( {
  children,
  closeModal,
  color,
  userImage,
  originalImage,
  displayDate = null,
}: Props ) => {
  const { theme } = useTheme( );

  return (
    <View style={[viewStyles.container, {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderColor: theme.colors.surfaceContainerHigh,
    }]}>
      <LinearGradient
        colors={[theme.colors.primaryContainer, theme.colors.primaryContainer]}
        style={viewStyles.header}
      >
        <View style={[viewStyles.headerTextContainer, viewStyles.row]}>
          <StyledText allowFontScaling={false} style={[baseTextStyles.button, textStyles.buttonText, { color: theme.colors.onPrimaryContainer }]}>
            {color === "green"
              ? i18n.t( "replace_photo.header" )
              : i18n.t( "results.flag" )}
          </StyledText>
          <TouchableOpacity accessibilityRole="button"
            accessibilityLabel={i18n.t( "accessibility.close" )}
            onPress={closeModal}
            style={viewStyles.backButton}
          >
            <XIcon color={theme.colors.onPrimaryContainer} size={24} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
        <View style={[viewStyles.images, viewStyles.row]}>
          {userImage && <Image
              source={{ uri: userImage }}
              style={viewStyles.imageCell}
            />}
          {color === "green" && (
            <ImageBackground
              source={iconicTaxa[1]} // for cases where uri exists but photo is blank
              style={[viewStyles.imageCell, viewStyles.marginLeft]}
              imageStyle={viewStyles.imageCell}
            >
              {originalImage && <Image
                source={{ uri: originalImage }}
                style={viewStyles.imageCell}
              />}
            </ImageBackground>
          )}
          <View>
            {( color === "gray" && originalImage ) && (
              <Image
                source={{ uri: originalImage }}
                style={[viewStyles.imageCell, viewStyles.marginLeft]}
              />
            )}
            {displayDate && (
              <View style={[viewStyles.grayButton, { backgroundColor: theme.colors.primaryContainer }]}>
                <StyledText style={[baseTextStyles.medium, textStyles.grayButtonText, { color: theme.colors.primary }]}>{displayDate}</StyledText>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
      <View style={viewStyles.innerContainer}>
        <View style={viewStyles.marginLarge} />
        {children}
        <View style={viewStyles.marginMedium} />
      </View>
    </View>
  );
};

export default ModalWithGradient;
