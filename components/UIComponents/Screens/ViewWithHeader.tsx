import * as React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import styles from "../../../styles/uiComponents/scrollWithHeader";
import { AppHeader } from "../AppPrimitives";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props extends React.PropsWithChildren {
  testID?: string;
  header: string;
  footer?: boolean;
}

const ViewWithHeader = ( { testID, children, header, footer: _footer = true }: Props ) => {
  const { theme } = useTheme( );
  const themedStyles = StyleSheet.create( {
    container: {
      backgroundColor: theme.colors.canvas,
    },
    content: {
      backgroundColor: theme.colors.canvas,
      flex: 1,
    },
  } );

  return (
    <SafeAreaView
      testID={testID}
      style={[styles.container, themedStyles.container]}
      edges={["top", "left", "right"]}
    >
      <AppHeader titleKey={header} />
      <View style={themedStyles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
};

export default ViewWithHeader;
