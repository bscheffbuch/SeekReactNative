import React, { useContext, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../../../i18n";
import { useTheme } from "../../Providers/ThemeProvider";
import { UserContext } from "../../UserContext";
import { ArrowLeftIcon } from "../../UIComponents/AppIcons";
import createUserAgent from "../../../utility/userAgent";
import { saveAccessToken } from "../../../utility/loginHelpers";
import { fetchJSONWebToken, WEB_SESSION_LOGIN } from "../../../utility/tokenHelpers";

const SITE = "https://www.inaturalist.org";
// pages that are part of signing in, where checking for a session is pointless
const SIGN_IN_PATHS = /^\/(login|session|users\/(sign_in|password|auth)|signup|oauth)/;

// Asks the website, with the page's own cookies, whether the user is signed in.
const PROBE_SESSION = `
  fetch( "/users/api_token", { headers: { Accept: "application/json" }, credentials: "same-origin" } )
    .then( r => ( r.ok ? r.json( ) : null ) )
    .then( j => window.ReactNativeWebView.postMessage( j && j.api_token ? "signed-in" : "signed-out" ) )
    .catch( ( ) => window.ReactNativeWebView.postMessage( "signed-out" ) );
  true;
`;

// Signing in on the iNaturalist website, for builds without Seek's OAuth app credentials.
// Seek then gets its API tokens from the website session (see WEB_SESSION_LOGIN).
const WebLogin = ( ) => {
  const navigation = useNavigation<any>( );
  const { updateLogin } = useContext( UserContext );
  const { theme } = useTheme( );
  const webView = useRef<WebView>( null );
  const [finishing, setFinishing] = useState( false );
  const [failed, setFailed] = useState( false );

  const onNavigationStateChange = ( { url, loading }: WebViewNavigation ) => {
    if ( loading || finishing || !url.startsWith( SITE ) ) {
      return;
    }
    const path = url.slice( SITE.length ) || "/";
    if ( !SIGN_IN_PATHS.test( path ) ) {
      webView.current?.injectJavaScript( PROBE_SESSION );
    }
  };

  const onMessage = async ( { nativeEvent }: WebViewMessageEvent ) => {
    if ( nativeEvent.data !== "signed-in" || finishing ) {
      return;
    }
    setFinishing( true );
    // the app's own requests must see the session too, or nothing else would work
    const token = await fetchJSONWebToken( WEB_SESSION_LOGIN );
    if ( typeof token !== "string" ) {
      setFinishing( false );
      setFailed( true );
      return;
    }
    await saveAccessToken( WEB_SESSION_LOGIN );
    updateLogin( );
    navigation.navigate( "LoginSuccess" );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.screen, { backgroundColor: theme.colors.canvas }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={i18n.t( "accessibility.back" )}
          accessibilityRole="button"
          onPress={( ) => navigation.goBack( )}
          style={styles.iconButton}
        >
          <ArrowLeftIcon color={theme.colors.text} size={24} strokeWidth={2} />
        </Pressable>
        <Text accessibilityRole="header" numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
          {i18n.t( "login.log_in" )}
        </Text>
        {finishing && <ActivityIndicator color={theme.colors.primary} style={styles.spinner} />}
      </View>
      {failed && (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.destructive }]}>
          {i18n.t( "inat_login.web_session_failed" )}
        </Text>
      )}
      <WebView
        domStorageEnabled
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
        ref={webView}
        sharedCookiesEnabled
        source={{ uri: `${SITE}/login` }}
        startInLoadingState
        thirdPartyCookiesEnabled
        // the same agent as the app's API requests, so the site treats both alike
        userAgent={createUserAgent( )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create( {
  screen: { flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  iconButton: { alignItems: "center", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  title: { flex: 1, fontSize: 20, lineHeight: 26 },
  spinner: { marginRight: 12 },
  error: { fontSize: 14, lineHeight: 20, paddingBottom: 8, paddingHorizontal: 16 },
} );

export default WebLogin;
