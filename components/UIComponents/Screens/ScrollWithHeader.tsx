// @ts-nocheck
import type { PropsWithChildren} from "react";
import React, { useRef } from "react";
import {
  View,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import styles from "../../../styles/uiComponents/scrollWithHeader";
import { useScrollToTop } from "../../../utility/customHooks";
import BottomSpacer from "../BottomSpacer";
import Padding from "../Padding";
import LoadingWheel from "../LoadingWheel";
import { colors } from "../../../styles/global";
import { AppHeader } from "../AppPrimitives";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props extends PropsWithChildren {
  testID?: string;
  header: string;
  route?: string;
  loading?: boolean;
  footer?: boolean;
}

const ScrollWithHeader = ( {
  testID,
  children,
  header,
  route = null,
  loading = false,
  footer: _footer = false,
}: Props ) => {
  const navigation = useNavigation();
  const { name } = useRoute();
  const scrollView = useRef<any>( null );
  const { theme } = useTheme( );

  useScrollToTop( scrollView, navigation, name );

  const hideKeyboard = () => {
    // need this one for Android
    if ( name === "Post" ) {
      Keyboard.dismiss();
    }
  };

  return (
    <SafeAreaView
      testID={testID}
      style={[styles.container, { backgroundColor: theme.colors.canvas }]}
      edges={["top", "left", "right"]}
    >
      <AppHeader titleKey={header} backRoute={route} />
      {loading ? (
        <View style={[styles.loadingWheel, { backgroundColor: theme.colors.canvas }]}>
          <LoadingWheel color={theme.colors.primary || colors.seekDeepGreen} />
        </View>
      ) : (
        <ScrollView
          ref={scrollView}
          contentContainerStyle={[styles.containerWhite, { backgroundColor: theme.colors.canvas }]}
          keyboardDismissMode={name === "Post" ? "on-drag" : "none"}
          onScrollBeginDrag={hideKeyboard}
        >
          {children}
          <Padding />
          {Platform.OS === "ios" && <BottomSpacer />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ScrollWithHeader;
