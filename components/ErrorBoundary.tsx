// @ts-nocheck
import React from "react";
import RNRestart from "react-native-restart";
import { log } from "../react-native-logs.config";
import i18n from "../i18n";
import { SafeAreaView } from "react-native-safe-area-context";

import { viewStyles, textStyles } from "../styles/errorBoundary";
import { baseTextStyles } from "../styles/textStyles";
import StyledText from "./UIComponents/StyledText";
import GreenButton from "./UIComponents/Buttons/GreenButton";
import { ScrollView } from "react-native";
import { LogLevels, logToApi } from "../utility/apiCalls";

const logger = log.extend( "ErrorBoundary" );

// https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
class ErrorBoundary extends React.Component {
  constructor( props ) {
    super( props );
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError( error ) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  componentDidCatch( error, info ) {
    this.setState( { info } );
    // Keep the throwing frames AND the component stack: the JS stack names the
    // function that actually threw (which the component stack cannot), while
    // the component stack locates it in the tree. Overwriting error.stack with
    // the component stack here used to destroy the only record of the real
    // throw site before it was logged or displayed.
    const backtrace = [error.stack, info?.componentStack]
      .filter( Boolean )
      .join( "\n--- component stack ---\n" );
    logger.error( `${error.message}\n${backtrace}` );
    logToApi( {
      level: LogLevels.ERROR,
      context: "ErrorBoundary",
      message: error.message,
      errorType: error.constructor?.name,
      backtrace,
    } );
  }

  render() {
    if ( this.state.error ) {
      // TODO allow this to take a fallback component as a prop so individual
      // boundaries can customize their error states
      return (
        <SafeAreaView style={viewStyles.container} edges={["top"]}>
          <ScrollView contentContainerStyle={viewStyles.scrollView}>
            <StyledText style={baseTextStyles.emptyState}>
              {i18n.t( "error_boundary.something_went_wrong" )}
            </StyledText>
            <StyledText style={[baseTextStyles.body, textStyles.text, viewStyles.marginBottom]}>
              {i18n.t( "error_boundary.if_youre_seeing_this_error" )}
            </StyledText>
            <GreenButton
              text="error_boundary.restart"
              handlePress={() => RNRestart.restart()}
              />
            <StyledText style={[baseTextStyles.body, textStyles.text]}>
              {i18n.t( "error_boundary.error" )}
            </StyledText>
            <StyledText style={[baseTextStyles.body, textStyles.text]}>
              {this.state.error.toString()}
            </StyledText>
            {/* The JS stack first: its top frames name the function that threw,
                which is what a bug report screenshot needs most. */}
            <StyledText style={[baseTextStyles.body, textStyles.text]}>
              {this.state.error.stack?.split( "\n" ).slice( 0, 12 ).join( "\n" )}
            </StyledText>
            <StyledText style={[baseTextStyles.body, textStyles.text]}>
              {this.state.info?.componentStack}
            </StyledText>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
