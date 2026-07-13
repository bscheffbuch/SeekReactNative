import React, { useEffect, useState } from "react";
import { View } from "react-native";

import i18n from "../../../i18n";
import { viewStyles, textStyles } from "../../../styles/camera/arCameraHeader";
import { ranks } from "../../../utility/dictionaries/taxonomyDicts";
import { getTaxonCommonName } from "../../../utility/commonNamesHelpers";
import { useFetchUserSettings } from "../../../utility/customHooks/useFetchUserSettings";
import StyledText from "../../UIComponents/StyledText";

interface Prediction {
  name: string;
  taxon_id: number;
  rank_level: number;
  rank?: string;
  combined_score: number;
  ancestor_ids: number[];
}

interface Props {
  prediction?: Prediction;
}

const RANK_LIST = ["kingdom", "phylum", "class", "order", "family", "genus", "species"];

const ARCameraHeader = ( { prediction }: Props ) => {
  const rankToRender = prediction?.rank;
  const [commonName, setCommonName] = useState<string | void | null>( null );
  const settings = useFetchUserSettings( );
  const scientificNames = settings?.scientificNames;
  const showScientificNameOnly = scientificNames || !commonName;
  const rankIndex = rankToRender ? RANK_LIST.indexOf( rankToRender ) : -1;
  const isSpecies = rankToRender === "species";

  let id: number | null = null;

  if ( rankToRender && !scientificNames ) {
    id = prediction?.taxon_id;
  } else {
    id = null;
  }

  useEffect( () => {
    let isCurrent = true;

    if ( !id ) {
      setCommonName( null );
      return () => {
        isCurrent = false;
      };
    }

    setCommonName( null );
    getTaxonCommonName( id ).then( ( name ) => {
      if ( isCurrent ) {
        setCommonName( name );
      }
    } );

    return () => {
      isCurrent = false;
    };
  }, [id] );

  if ( !prediction || !rankToRender ) {
    return null;
  }

  const scientificName = prediction.name;
  const rankLabel = i18n.t( ranks[rankToRender] );
  const progressLabel = isSpecies
    ? "OK"
    : `${rankIndex + 1}/${RANK_LIST.length}`;

  return (
    <View style={viewStyles.header}>
      <View
        testID="headerPrediction"
        style={[
          viewStyles.predictionPill,
          isSpecies && viewStyles.predictionPillSpecies,
        ]}
      >
        <View style={viewStyles.predictionCopy}>
          {isSpecies ? (
            <>
              <StyledText
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={textStyles.predictionName}
              >
                {showScientificNameOnly ? scientificName : commonName}
              </StyledText>
              {!showScientificNameOnly && (
                <StyledText
                  maxFontSizeMultiplier={1.1}
                  numberOfLines={1}
                  style={textStyles.scientificName}
                >
                  {scientificName}
                </StyledText>
              )}
            </>
          ) : (
            <>
              <StyledText
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={textStyles.rankLabel}
              >
                {rankLabel}
              </StyledText>
              <StyledText
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={textStyles.predictionName}
              >
                {scientificName}
              </StyledText>
            </>
          )}
        </View>
        <View
          style={[
            viewStyles.progressBubble,
            isSpecies && viewStyles.progressBubbleSpecies,
          ]}
        >
          <StyledText
            maxFontSizeMultiplier={1.1}
            numberOfLines={1}
            style={[
              textStyles.progressText,
              isSpecies && textStyles.progressTextSpecies,
            ]}
          >
            {progressLabel}
          </StyledText>
        </View>
      </View>
    </View>
  );
};

export default ARCameraHeader;
