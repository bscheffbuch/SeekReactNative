import * as React from "react";
import { View } from "react-native";

import styles from "../../../styles/uiComponents/modals/whiteModal";
import BackButton from "../Buttons/ModalBackButton";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props extends React.PropsWithChildren {
  readonly closeModal?: ( ) => void;
  readonly noButton?: boolean;
  readonly width?: number | null;
  readonly accessibilityLabel?: string;
}

const WhiteModal = ( {
  children,
  closeModal = () => {},
  noButton = false,
  width = null,
  accessibilityLabel,
}: Props ) => {
  const { theme } = useTheme( );
  let widthStyle = null;

  if ( width ) {
    widthStyle = { width };
  }

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[
        styles.innerContainer,
        {
          // M3 dialog: surface container high, 28px corners, no outline
          backgroundColor: theme.colors.surfaceContainerHigh,
          borderColor: theme.colors.surfaceContainerHigh,
          shadowColor: theme.colors.shadow,
        },
        widthStyle,
      ]}>
        {children}
      </View>
      {!noButton && <BackButton closeModal={closeModal} />}
    </View>
  );
};

export default WhiteModal;
