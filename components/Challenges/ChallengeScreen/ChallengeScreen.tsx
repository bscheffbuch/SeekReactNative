// @ts-nocheck
import React, { useCallback } from "react";
import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";

import styles from "../../../styles/challenges/challenges";
import ChallengeProgressCard from "./ChallengeProgressCard";
import GreenText from "../../UIComponents/GreenText";
import NoChallenges from "../../Home/Challenges/NoChallenges";
import EmptyChallengesCard from "./EmptyChallengesCard";
import ViewWithHeader from "../../UIComponents/Screens/ViewWithHeader";
import { useFetchChallenges } from "../hooks/challengeHooks";
import { useTheme } from "../../Providers/ThemeProvider";

interface Item {
  type: string;
  header: string;
  empty: string;
  name: string;
  availableDate: Date;
  percentComplete: number;
  startedDate: Date;
  index: number;
  earnedIconName: string;
  sponsorName: string;
}

const ChallengeScreen = ( ) => {
  const list: Item[] = useFetchChallenges( );
  const { theme } = useTheme( );

  const extractKey = useCallback( ( item: Item, index: number ) => (
    item.type
      ? `${item.type}-${item.header || item.empty || item.name || index}`
      : `challenge-${item.name}-${item.availableDate?.toString?.() || index}`
  ), [] );

  const renderItem = useCallback( ( { item }: { item: Item } ) => {
    if ( item.type === "header" ) {
      // Render header
      return (
        <View style={styles.header}>
          <GreenText text={item.header} />
        </View>
      );
    }
    if ( item.type === "empty" ) {
      // Render empty card
      return <EmptyChallengesCard type={item.empty} />;
    }
    if ( item.type === "noChallenges" ) {
      // Render no challenges text
      return (
        <View style={styles.noChallenges}>
          <NoChallenges />
        </View>
      );
    }
    // Render item
    return <ChallengeProgressCard challenge={item} />;
  }, [] );

  return (
    <ViewWithHeader testID="challenge-screen-container" header="challenges.header">
      <FlashList
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.challengeList,
          { backgroundColor: theme.colors.canvas },
        ]}
        data={list}
        keyExtractor={extractKey}
        renderItem={renderItem}
        getItemType={( item ) => {
          if ( item.hasOwnProperty( "type" ) ) {
            return item.type;
          }
          return "challenge";
        }}
        removeClippedSubviews
      />
    </ViewWithHeader>
  );
};

export default ChallengeScreen;
