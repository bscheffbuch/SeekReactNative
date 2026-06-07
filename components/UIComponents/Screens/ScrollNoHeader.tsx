// @ts-nocheck
import type { PropsWithChildren} from "react";
import React, { useRef } from "react";
import { ScrollView, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import styles from "../../../styles/uiComponents/scrollWithHeader";
import { useScrollToTop } from "../../../utility/customHooks";
import BottomSpacer from "../BottomSpacer";
import Padding from "../Padding";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props extends PropsWithChildren {
  showUploadCard?: boolean;
  footer?: boolean;
}

const ScrollNoHeader = ( { children, showUploadCard, footer: _footer = true }: Props ) => {
  const navigation = useNavigation( );
  const { name } = useRoute( );
  const scrollView = useRef<any>( null );
  const { theme } = useTheme( );

  useScrollToTop( scrollView, navigation );

  const backgroundColor = { backgroundColor: theme.colors.canvas };
  const uploadBackgroundColor = showUploadCard && name === "Home"
    ? { backgroundColor: theme.colors.primaryContainer }
    : backgroundColor;

  return (
    <SafeAreaView
      style={[styles.container, backgroundColor, uploadBackgroundColor]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        ref={scrollView}
        contentContainerStyle={uploadBackgroundColor}
        // Required for Announcements webview to work
        pinchGestureEnabled={false}
      >
        {children}
        <Padding />
        {Platform.OS === "ios" && <BottomSpacer />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScrollNoHeader;
