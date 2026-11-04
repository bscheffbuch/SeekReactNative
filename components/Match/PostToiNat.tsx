// @ts-nocheck
import React, { useState, useCallback, useContext, useEffect } from "react";
import { View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import i18n from "../../i18n";
import styles from "../../styles/match/match";
import { fetchPostingSuccess } from "../../utility/loginHelpers";
import GreenButton from "../UIComponents/Buttons/GreenButton";
import { UserContext } from "../UserContext";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";

interface Props {
  readonly color: string;
  readonly taxaInfo: {
    commonName?: string | null;
    taxaId?: number | null;
    scientificName?: string | null;
  };
}

const PostToiNat = ( { color, taxaInfo }: Props ) => {
  const navigation = useNavigation( );
  // TODO: UserContext to TS
  const { login } = useContext( UserContext );
  const [postingSuccess, setPostingSuccess] = useState( false );

  const fetchPostingStatus = useCallback( ( ) => {
    fetchPostingSuccess( ).then( ( success ) => setPostingSuccess( success === "true" ) );
  }, [] );

  // refetch on focus (back from posting) and when the species changes, which resets it
  useFocusEffect( fetchPostingStatus );
  useEffect( fetchPostingStatus, [fetchPostingStatus, taxaInfo.taxaId] );

  // TODO: navigation to TS
  const navToPostingScreen = ( ) => navigation.navigate( "Post", taxaInfo );

  if ( !login ) {
    return (
      <>
        <StyledText style={[baseTextStyles.body, styles.text]}>
          {i18n.t( "results.post_inat_login" )}
        </StyledText>
        <View style={styles.marginMedium} />
        <GreenButton
          color={color}
          handlePress={( ) => navigation.navigate( "LoginOrSignup" )}
          text="results.log_in_to_post"
        />
      </>
    );
  }

  if ( !postingSuccess ) {
    return (
      <>
        <StyledText style={[baseTextStyles.body, styles.text]}>
          {i18n.t( "results.post_inat" )}
        </StyledText>
        <View style={styles.marginMedium} />
        <GreenButton
          color={color}
          handlePress={navToPostingScreen}
          text="results.post"
        />
      </>
    );
  }

  return null;
};

export default PostToiNat;
