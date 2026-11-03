import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import Realm from "realm";

import i18n from "../../i18n";
import { colors } from "../../styles/global";
import styles from "../../styles/observations/sectionHeader";
import badges from "../../assets/badges";
import { ChevronDownIcon } from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";
import { iconicTaxaNamesById } from "../../utility/dictionaries/taxonomyDicts";
import realmConfig from "../../models/index";
import StyledText from "../UIComponents/StyledText";
import { baseTextStyles } from "../../styles/textStyles";

interface Props {
  id: number;
  dataLength: number;
  open: boolean;
  toggleSection: ( id: number ) => void;
}

const SectionHeader = ( { id, dataLength, open, toggleSection }: Props ) => {
  const { theme } = useTheme( );
  const [badgeCount, setBadgeCount] = useState( 0 );

  const noBadge = badgeCount === 0;
  const badge = badges.badge_gold;
  let tint;

  if ( badgeCount === 1 ) {
    tint = colors.bronze;
  } else if ( badgeCount === 2 ) {
    tint = colors.silver;
  }

  const fetchBadgeCount = useCallback( () => {
    Realm.open( realmConfig ).then( ( realm ) => {
      const count = realm.objects( "BadgeRealm" )
        .filtered( `iconicTaxonId == ${id} AND earned == true` ).length;

      setBadgeCount( count );
    } );
  }, [id] );

  useEffect( () => fetchBadgeCount(), [fetchBadgeCount] );

  return (
    <TouchableOpacity accessibilityRole="button"
      onPress={() => toggleSection( id )}
      style={[styles.header, styles.row]}
    >
      <StyledText allowFontScaling={false} style={[baseTextStyles.header, styles.headerText]}>
        {i18n.t( iconicTaxaNamesById[id] )}
      </StyledText>
      <View style={styles.row}>
        <StyledText style={[baseTextStyles.sectionNumber]} allowFontScaling={false}>{dataLength}</StyledText>
        {id !== 1 && (
          <Image
            source={noBadge ? badges.badge_empty_small : badge}
            style={[styles.badge, noBadge && styles.empty, tint && { tintColor: tint }]}
          />
        )}
        <View style={!open ? styles.margin : styles.marginOpen}>
          <ChevronDownIcon color={theme.colors.onSurfaceVariant} size={22} strokeWidth={2.2} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SectionHeader;
