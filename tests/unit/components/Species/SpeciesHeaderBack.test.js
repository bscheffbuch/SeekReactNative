import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen, fireEvent, waitFor } from "tests/jest-utils";

import SpeciesHeader from "../../../../components/Species/SpeciesHeader";

jest.mock( "@react-native-clipboard/clipboard", () => ( { setString: jest.fn(), getString: jest.fn() } ) );

const mockNavigation = { navigate: jest.fn(), popTo: jest.fn(), dispatch: jest.fn(), addListener: () => jest.fn() };
jest.mock( "@react-navigation/native", () => {
  const actualNav = jest.requireActual( "@react-navigation/native" );
  return {
    ...actualNav,
    useNavigation: () => mockNavigation,
    useRoute: () => ( {} ),
    useFocusEffect: jest.fn(),
  };
} );

const pressBack = async ( storedRoute ) => {
  await AsyncStorage.setItem( "route", storedRoute );
  render(
    <SpeciesHeader loading photos={[]} id={1} taxon={{ scientificName: "Quercus robur", iconicTaxonId: 47126 }}
      selectedText={false} highlightSelectedText={jest.fn()} />
  );
  fireEvent.press( screen.getByLabelText( "Go back to previous screen" ) );
};

describe( "Species back button", () => {
  beforeEach( () => {
    mockNavigation.navigate.mockClear();
    mockNavigation.popTo.mockClear();
  } );

  // tab screens are nested in MainTabs: React Navigation 7 can't reach them by bare name
  test.each( [["Home", "Home"], ["Observations", "Observations"], ["SideMenu", "More"]] )(
    "from %s returns to the %s tab", async ( stored, tab ) => {
      await pressBack( stored );
      await waitFor( () => expect( mockNavigation.popTo ).toHaveBeenCalledWith( "MainTabs", { screen: tab } ) );
      expect( mockNavigation.navigate ).not.toHaveBeenCalled();
    }
  );

  test.each( ["Match", "ChallengeDetails", "SeekYearInReview"] )( "from %s navigates to that screen", async ( stored ) => {
    await pressBack( stored );
    await waitFor( () => expect( mockNavigation.navigate ).toHaveBeenCalledWith( stored ) );
  } );

  test( "from Achievements pops back to it", async () => {
    await pressBack( "Achievements" );
    await waitFor( () => expect( mockNavigation.popTo ).toHaveBeenCalledWith( "Achievements" ) );
  } );
} );
