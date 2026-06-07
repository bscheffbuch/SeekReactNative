// @ts-nocheck
import React, { useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import HTML from "react-native-render-html";

import i18n from "../../../i18n";
import { UserContext } from "../../UserContext";
import SpeciesDetailCard from "../../UIComponents/SpeciesDetailCard";
import { textStyles } from "../../../styles/species/species";
import { useCommonName } from "../../../utility/customHooks/useCommonName";
import StyledText from "../../UIComponents/StyledText";
import { baseTextStyles } from "../../../styles/textStyles";
import { htmlFonts } from "../../../styles/global";
import { useTheme } from "../../Providers/ThemeProvider";

interface Props {
  readonly loading: boolean;
  readonly about: string | null;
  readonly wikiUrl: string | null;
  readonly id: number;
  readonly scientificName: string | null;
}

const About = ( {
  loading,
  about,
  wikiUrl,
  id,
  scientificName,
}: Props ) => {
  const navigation = useNavigation();
  // TODO: UserContext TS
  const { login } = useContext( UserContext );
  const { theme } = useTheme( );
  const themedStyles = StyleSheet.create( {
    source: {
      color: theme.colors.muted,
      fontFamily: theme.typography.body,
    },
  } );
  const commonName = useCommonName( id );

  const html = about ? `${about}`.replace( /<b>/g, "" ) : null;

  // TODO: navigation TS
  const navToWikipediaView = () => navigation.navigate( "Wikipedia", { wikiUrl, scientificName } );

  // hide empty About section
  if ( !about && !login ) {
    return null;
  }

  return (
    <SpeciesDetailCard text="species_detail.about">
      {!loading ? <>
        {about && html && (
          <>
            <HTML
              baseStyle={{
                ...baseTextStyles.body,
                color: theme.colors.text,
                fontFamily: theme.typography.body,
              }}
              source={{ html }}
              systemFonts={htmlFonts}
              defaultTextProps={{ allowFontScaling: true, maxFontSizeMultiplier: 2 }}
              tagsStyles={{
                b: {
                  ...baseTextStyles.bodySpacedBold,
                  color: theme.colors.text,
                  fontFamily: theme.typography.heading,
                },
                strong: {
                  ...baseTextStyles.bodySpacedBold,
                  color: theme.colors.text,
                  fontFamily: theme.typography.heading,
                },
                em: {
                  ...baseTextStyles.bodySpacedItalic,
                  color: theme.colors.text,
                  fontFamily: theme.typography.scientific,
                },
                i: {
                  ...baseTextStyles.bodySpacedItalic,
                  color: theme.colors.text,
                  fontFamily: theme.typography.scientific,
                },
              }}
            />
            <StyledText
              style={[
                baseTextStyles.body,
                themedStyles.source,
              ]}
            >
              {/* TODO: the parentheses should probably be part of the string? Because in some cultures maybe they would different character for tis. */}
              {"\n("}
              {i18n.t( "species_detail.wikipedia" )}
              {")"}
            </StyledText>
          </>
        )}
        {login && id !== 43584 && (
          <StyledText onPress={navToWikipediaView} style={[baseTextStyles.bodyGreen, textStyles.linkText]}>
            {commonName || scientificName}
          </StyledText>
        )}
      </> : null}
    </SpeciesDetailCard>
  );
};

export default About;
