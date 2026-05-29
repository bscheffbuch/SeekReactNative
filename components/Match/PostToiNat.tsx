// @ts-nocheck
import React, { useState, useEffect, useContext } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import i18n from "../../i18n";
import styles from "../../styles/match/match";
import { fetchPostingSuccess, savePostingSuccess } from "../../utility/loginHelpers";
import { saveObservationLocally } from "../../utility/uploadHelpers";
import { setISOTime, formatGMTTimeWithTimeZone } from "../../utility/dateHelpers";
import GreenButton from "../UIComponents/Buttons/GreenButton";
import { UserContext } from "../UserContext";
import { useObservation } from "../Providers/ObservationProvider";
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
  const { observation } = useObservation( );
  const [postingSuccess, setPostingSuccess] = useState( false );

  const fetchPostingStatus = async ( ) => {
    const success = await fetchPostingSuccess( );
    if ( success && success === "true" ) {
      setPostingSuccess( true );
    } else {
      setPostingSuccess( false );
    }
  };

  useEffect( ( ) => {
    const unsubscribe = navigation.addListener( "focus", ( ) => {
      fetchPostingStatus( );
    } );

    return unsubscribe;
  }, [navigation] );

  // TODO: navigation to TS
  const navToPostingScreen = ( ) => navigation.navigate( "Post", taxaInfo );

  const handleSaveForLater = async ( ) => {
    if ( !observation || !taxaInfo.taxaId ) {
      return;
    }
    const { image } = observation;
    const { preciseCoords, time, uri } = image;
    const date = formatGMTTimeWithTimeZone( setISOTime( time ) );

    const obs = {
      captive_flag: false,
      description: null,
      geoprivacy: "open",
      latitude: preciseCoords?.latitude ?? null,
      longitude: preciseCoords?.longitude ?? null,
      observed_on_string: date.dateForServer,
      place_guess: null,
      positional_accuracy: preciseCoords?.accuracy != null ? Math.trunc( preciseCoords.accuracy ) : null,
      taxon_id: taxaInfo.taxaId,
      vision: true,
    };

    await saveObservationLocally( obs, uri );
    savePostingSuccess( true );
    setPostingSuccess( true );
  };

  if ( login && !postingSuccess ) {
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

  if ( !login && !postingSuccess && taxaInfo.taxaId ) {
    return (
      <>
        <StyledText style={[baseTextStyles.body, styles.text]}>
          {i18n.t( "results.post_inat" )}
        </StyledText>
        <View style={styles.marginMedium} />
        <GreenButton
          color={color}
          handlePress={handleSaveForLater}
          text="results.save_for_later"
        />
      </>
    );
  }

  if ( postingSuccess && !login ) {
    return (
      <StyledText style={[baseTextStyles.body, styles.text]}>
        {i18n.t( "results.saved_for_later" )}
      </StyledText>
    );
  }

  return null;
};

export default PostToiNat;
