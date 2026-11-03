import React from "react";
import { render, screen, fireEvent, waitFor } from "tests/jest-utils";

import ReframeScreen from "../../../../components/Camera/Reframe/ReframeScreen";

const mockImage = { uri: "content://media/1", time: 1, predictions: [], errorCode: 0, latitude: null, longitude: null };
const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn(), addListener: () => jest.fn() };
const mockStart = jest.fn( ( _image, cb ) => cb( ) );
jest.mock( "@react-navigation/native", () => {
  const actualNav = jest.requireActual( "@react-navigation/native" );
  return {
    ...actualNav,
    useNavigation: () => mockNavigation,
    useRoute: () => ( { params: { image: mockImage, photoPath: "/data/user/0/app/cache/photo.jpg" } } ),
  };
} );
jest.mock( "../../../../components/Providers/ObservationProvider", () => ( {
  ...jest.requireActual( "../../../../components/Providers/ObservationProvider" ),
  useObservation: () => ( { startObservationWithImage: mockStart } ),
} ) );
jest.mock( "../../../../utility/modelPacks", () => ( {
  getActiveModelPack: jest.fn( async () => ( { version: "x", modelPath: "m", taxonomyPath: "t", geomodelPath: null } ) ),
} ) );

const mockPredict = jest.fn( async () => ( {
  predictions: [{ taxon_id: 49322, name: "Quercus robur", rank_level: 10, score: 82, combined_score: 82 }],
} ) );
jest.mock( "../../../../components/Camera/ARCamera/helpers/visionPluginWrapper", () => ( {
  __esModule: true,
  default: { MODE: { COMMON_ANCESTOR: "COMMON_ANCESTOR" }, getPredictionsForImage: ( o ) => mockPredict( o ) },
} ) );
jest.mock( "../../../../utility/commonNamesHelpers", () => ( {
  ...jest.requireActual( "../../../../utility/commonNamesHelpers" ),
  getTaxonCommonName: jest.fn( async () => "English Oak" ),
  setupCommonNames: jest.fn( ),
} ) );

describe( "ReframeScreen", () => {
  test( "without detected subjects it offers the centre box and continues to Match", async () => {
    render( <ReframeScreen /> );
    expect( await screen.findByText( "Frame the subject" ) ).toBeTruthy();
    expect( await screen.findByText( "No subject found - drag the box onto it" ) ).toBeTruthy();
    // suggestions for the (centre) crop
    expect( await screen.findByText( "English Oak" ) ).toBeTruthy();
    expect( screen.getByText( "82%" ) ).toBeTruthy();
    expect( mockPredict.mock.calls[0][0].cropRect ).toEqual( { left: 0.2, top: 0.2, width: 0.6, height: 0.6 } );
    fireEvent.press( screen.getByText( "Use this crop" ) );
    await waitFor( () => expect( mockStart ).toHaveBeenCalled() );
    expect( mockStart.mock.calls[0][0].uri ).toBe( "content://media/1" );
    expect( mockStart.mock.calls[0][0].predictions[0].taxon_id ).toBe( 49322 );
    expect( mockNavigation.dispatch ).toHaveBeenCalledWith(
      expect.objectContaining( { type: "REPLACE", payload: expect.objectContaining( { name: "Match" } ) } )
    );
  } );

  test( "Retake goes back to the camera", async () => {
    render( <ReframeScreen /> );
    fireEvent.press( await screen.findByText( "Retake" ) );
    expect( mockNavigation.goBack ).toHaveBeenCalled();
  } );
} );
