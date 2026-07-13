// @ts-nocheck

import * as React from "react";
import {
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

import { viewStyles, textStyles } from "../../styles/fullWebView/fullWebView";
import icons from "../../assets/icons";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";
import createUserAgent from "../../utility/userAgent";
import { fetchAccessToken, removeAccessToken } from "../../utility/loginHelpers";
import { fetchJSONWebToken } from "../../utility/tokenHelpers";
import ErrorScreen from "../Camera/Gallery/Error";
import { UserContext } from "../UserContext";

interface Props {
  // TODO: navigation TS
  navigation: any;
  headerText: string;
  uri: string;
  loggedIn?: boolean;
}

const FullWebView = ( { navigation, headerText, uri, loggedIn }: Props ) => {
  const navBack = () => navigation.goBack();
  const { updateLogin } = React.useContext( UserContext );

  const [token, setToken] = React.useState<
    string | {
      error: {
        type: "downtime" | "timeout" | "login";
        errorText?: string;
        numOfHours?: number;
      };
    } | undefined
  >();

  React.useEffect( ( ) => {
    let current = true;
    async function fetchData( ) {
      const login = await fetchAccessToken();
      const jwt = await fetchJSONWebToken( login );
      if ( !current ) {
        return;
      }
      setToken( jwt );
    }
    fetchData();
    return ( ) => {
      current = false;
    };
  }, [] );

  let source: {
    uri: string;
    headers?: {
      Authorization: string;
    };
  } = { uri };

  if ( loggedIn && typeof token === "string" ) {
    source = {
      ...source,
      headers: {
        Authorization: token,
      },
    };
  }

  React.useEffect( ( ) => {
    const unsubscribe = navigation.addListener( "blur", async ( ) => {
      // Log out user if they navigate away from the webview and the server
      // definitively no longer sends back a token. Transient failures
      // (downtime, timeout, network errors) return an error object and
      // should not log the user out.
      const login = await fetchAccessToken();
      if ( !login ) {
        return;
      }
      const jwt = await fetchJSONWebToken( login );
      if ( jwt === undefined ) {
        const loggedOut = await removeAccessToken( );
        if ( loggedOut !== false ) {
          updateLogin( );
        }
      }
    } );

    return unsubscribe;
  }, [navigation, updateLogin] );

  const renderWebview = ( ) => {
    if ( loggedIn ) {
      // undefined before fetching the token
      if ( !token ) {
        return null;
      }
      // token is an object if there was an error
      if ( token && typeof token === "object" ) {
        return <ErrorScreen error={token.error.type} number={token.error.numOfHours} />;
      }
    }
    return (
      <WebView startInLoadingState source={source} userAgent={createUserAgent()} />
    );
  };

  return (
    <SafeAreaView style={viewStyles.container} edges={["top"]}>
      <View style={viewStyles.header}>
        <StyledText style={[baseTextStyles.button, textStyles.text]}>{headerText}</StyledText>
        <TouchableOpacity onPress={navBack} style={viewStyles.back}>
          <Image source={icons.closeWhite} />
        </TouchableOpacity>
      </View>
      {renderWebview()}
      <View style={viewStyles.bottom} />
    </SafeAreaView>
  );
};

export default FullWebView;
