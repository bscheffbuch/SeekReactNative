import * as React from "react";
import { View } from "react-native";

import { viewStyles, textStyles } from "../../styles/posting/postingHelp";
import i18n from "../../i18n";
import ScrollWithHeader from "../UIComponents/Screens/ScrollWithHeader";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";
import { useTheme } from "../Providers/ThemeProvider";
import { CalendarIcon, LockIcon, MapPinIcon, SearchIcon, SproutIcon } from "../UIComponents/AppIcons";
import type { GlyphIcon } from "../UIComponents/AppIcons";

const IconDisc = ( { icon: Icon }: { icon: GlyphIcon } ) => {
  const { theme } = useTheme( );
  return (
    <View style={[viewStyles.iconDisc, { backgroundColor: theme.colors.secondaryContainer }]}>
      <Icon color={theme.colors.onSecondaryContainer} size={20} strokeWidth={2} />
    </View>
  );
};

const PostingHelpScreen = ( ) => {
  const { theme } = useTheme( );

  return (
    <ScrollWithHeader header="posting_help.header">
      <View style={[viewStyles.textContainer, { backgroundColor: theme.colors.canvas }]}>
        <View style={viewStyles.row}>
          <IconDisc icon={SearchIcon} />
          <StyledText style={[baseTextStyles.header, textStyles.headerText]}>{i18n.t( "posting_help.identification" )}</StyledText>
        </View>
        <StyledText style={[baseTextStyles.body, textStyles.text]}>{i18n.t( "posting_help.id_description" )}</StyledText>
        <View style={viewStyles.row}>
          <IconDisc icon={CalendarIcon} />
          <View style={viewStyles.gap} />
          <IconDisc icon={MapPinIcon} />
          <StyledText style={[baseTextStyles.header, textStyles.headerText]}>{i18n.t( "posting_help.date" )}</StyledText>
        </View>
        <StyledText style={[baseTextStyles.body, textStyles.text]}>{i18n.t( "posting_help.date_description" )}</StyledText>
        <View style={viewStyles.row}>
          <IconDisc icon={LockIcon} />
          <StyledText style={[baseTextStyles.header, textStyles.headerText]}>{i18n.t( "posting_help.geoprivacy" )}</StyledText>
        </View>
        <View style={viewStyles.paragraph} />
        <StyledText style={viewStyles.paragraph}>
          <StyledText style={baseTextStyles.bodyBold}>{i18n.t( "posting_help.open_header" )}</StyledText>
          <StyledText style={[baseTextStyles.body, textStyles.text]}>{i18n.t( "posting_help.open" )}</StyledText>
        </StyledText>
        <StyledText style={viewStyles.paragraph}>
          <StyledText style={baseTextStyles.bodyBold}>{i18n.t( "posting_help.obscured_header" )}</StyledText>
          <StyledText style={[baseTextStyles.body, textStyles.text]}>{i18n.t( "posting_help.obscured" )}</StyledText>
        </StyledText>
        <StyledText style={viewStyles.paragraph}>
          <StyledText style={baseTextStyles.bodyBold}>{i18n.t( "posting_help.closed_header" )}</StyledText>
          <StyledText style={[baseTextStyles.body, textStyles.text]}>{i18n.t( "posting_help.closed" )}</StyledText>
        </StyledText>
        <View style={viewStyles.margin} />
        <View style={viewStyles.row}>
          <IconDisc icon={SproutIcon} />
          <StyledText style={[baseTextStyles.header, textStyles.headerText]}>{i18n.t( "posting_help.captive" )}</StyledText>
        </View>
        <View style={viewStyles.paragraph} />
        <StyledText style={viewStyles.paragraph}>
          <StyledText style={baseTextStyles.bodyBold}>{i18n.t( "posting_help.no_header" )}</StyledText>
          <StyledText style={[baseTextStyles.body, textStyles.text]}>{i18n.t( "posting_help.no" )}</StyledText>
        </StyledText>
        <StyledText style={viewStyles.paragraph}>
          <StyledText style={baseTextStyles.bodyBold}>{i18n.t( "posting_help.yes_header" )}</StyledText>
          <StyledText style={[baseTextStyles.body, textStyles.text]}>{i18n.t( "posting_help.yes" )}</StyledText>
        </StyledText>
        <View style={viewStyles.margin} />
        <StyledText style={[baseTextStyles.bodyItalic, textStyles.italicText]}>{i18n.t( "posting_help.addendum" )}</StyledText>
      </View>
    </ScrollWithHeader>
  );
};

export default PostingHelpScreen;
