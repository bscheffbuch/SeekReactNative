// include this line for mocking react-native-gesture-handler
import "react-native-gesture-handler/jestSetup";
import "@shopify/flash-list/jestSetup";
// Recommendation from the uuid library is to import get-random-values before
// uuid, so we're importing it first thing in the entry point.
// https://www.npmjs.com/package/uuid#react-native--expo
import "react-native-get-random-values";
import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import mockRNDeviceInfo from "react-native-device-info/jest/react-native-device-info-mock";
import * as mockRNLocalize from "react-native-localize/mock";
import mockRNCNetInfo from "@react-native-community/netinfo/jest/netinfo-mock";
import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";
import {
  mockCamera,
  mockGetCameraDevice,
  mockSortDevices,
  mockUseCameraDevice,
  mockUseCameraDevices,
  mockUseCameraFormat,
  mockUseLocationPermission,
} from "./vision-camera/vision-camera";

const mockReact = require( "react" );
const { View: mockView } = require( "react-native" );

const mockRenderComponent = component => {
  if ( !component ) {
    return null;
  }
  return typeof component === "function"
    ? mockReact.createElement( component )
    : component;
};

const mockFlashList = mockReact.forwardRef( ( props, ref ) => {
  const {
    data = [],
    horizontal,
    keyExtractor,
    ListEmptyComponent,
    ListFooterComponent,
    ListHeaderComponent,
    onScroll,
    onViewableItemsChanged,
    renderItem,
    testID,
  } = props;
  const [visibleIndex, setVisibleIndex] = mockReact.useState( 0 );

  const setIndex = index => {
    setVisibleIndex( index );
    onViewableItemsChanged?.( {
      changed: [{ index, item: data[index], isViewable: true }],
      viewableItems: [{ index, item: data[index], isViewable: true }],
    } );
  };

  mockReact.useImperativeHandle( ref, () => ( {
    scrollToIndex: ( { index } ) => setIndex( index ),
  } ) );

  const handleScroll = event => {
    onScroll?.( event );
    if ( horizontal && data.length > 1 ) {
      const x = event?.nativeEvent?.contentOffset?.x || 0;
      if ( x > 0 ) {
        setIndex( data.length - 1 );
      }
    }
  };

  const renderRow = ( item, index ) => mockReact.createElement(
    mockReact.Fragment,
    { key: keyExtractor?.( item, index ) || index },
    renderItem?.( { item, index } )
  );

  const items = horizontal
    ? ( data[visibleIndex] ? [renderRow( data[visibleIndex], visibleIndex )] : [] )
    : data.map( renderRow );

  return mockReact.createElement(
    mockView,
    { testID, onScroll: handleScroll },
    mockRenderComponent( ListHeaderComponent ),
    items.length > 0 ? items : mockRenderComponent( ListEmptyComponent ),
    mockRenderComponent( ListFooterComponent )
  );
} );

require( "react-native-reanimated" ).setUpTests();
// Reanimated 4.2 + Worklets 0.7: Jest loads native worklets which fails in Node. See:
// https://github.com/software-mansion/react-native-reanimated/discussions/8806
// we can remove this once the fix is released
jest.mock( "react-native-worklets", () => require( "react-native-worklets/src/mock" ) );

jest.mock( "@react-native-async-storage/async-storage", () => mockAsyncStorage );
jest.mock( "react-native-device-info", () => mockRNDeviceInfo );
jest.mock( "react-native-localize", () => mockRNLocalize );
jest.mock( "@react-native-community/netinfo", () => mockRNCNetInfo );
jest.mock( "react-native-safe-area-context", () => mockSafeAreaContext );
jest.mock( "uuid", () => ( {
  v4: jest.fn( () => "00000000-0000-4000-8000-000000000000" ),
} ) );
jest.mock( "@shopify/flash-list", () => ( { FlashList: mockFlashList } ) );
jest.mock( "react-native-webview", () => {
  const React = require( "react" );
  const { View } = require( "react-native" );
  return {
    WebView: React.forwardRef( ( props, ref ) => React.createElement( View, { ...props, ref } ) ),
  };
} );
jest.mock( "react-native-maps", () => {
  const React = require( "react" );
  const { View } = require( "react-native" );
  const MockMapView = React.forwardRef( ( props, ref ) => React.createElement( View, { ...props, ref } ) );
  const MockMapChild = props => React.createElement( View, props );
  MockMapView.Marker = MockMapChild;
  MockMapView.UrlTile = MockMapChild;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMapChild,
    PROVIDER_DEFAULT: "default",
    UrlTile: MockMapChild,
  };
} );

jest.mock( "vision-camera-plugin-inatvision" );
jest.mock( "react-native-worklets-core", () => ( {
  Worklets: {
    createRunInJsFn: jest.fn(),
  },
} ) );

jest.mock( "@dr.pogodin/react-native-fs", () => {
  const RNFS = {
    moveFile: async () => "testdata",
  };

  return RNFS;
} );

const mockErrorHandler = ( error ) => {
  console.log( error );
};
jest.mock( "react-native-exception-handler", () => ( {
  setJSExceptionHandler: jest
    .fn()
    .mockImplementation( ( ) => mockErrorHandler() ),
  setNativeExceptionHandler: jest
    .fn()
    .mockImplementation( ( ) => mockErrorHandler() ),
} ) );

jest.mock( "@react-navigation/native", () => {
  const actualNav = jest.requireActual( "@react-navigation/native" );
  return {
    ...actualNav,
    useNavigation: () => ( {
      navigate: jest.fn(),
      dispatch: jest.fn(),
      // To intercept on focus listener
      addListener: ( event, callback ) => {
        if ( event === "focus" ) {
          callback();
        }
      },
    } ),
    useRoute: () => ( {} ),
    useScrollToTop: () => jest.fn(),
  };
} );

jest.mock( "react-native-geolocation-service", () => ( {
  getCurrentPosition: jest.fn().mockImplementation( ( successCallback ) => {
    const position = {
      coords: {
        latitude: 42.42,
        longitude: 42.42,
        accuracy: 42,
      },
    };
    successCallback( position );
  } ),
  requestAuthorization: jest.fn().mockImplementation( () => Promise.resolve( true ) ),
} ) );

jest.mock( "react-native-geocoder", () => ( {
  geocodePosition: jest.fn().mockImplementation( ( { lat, lng } ) => {
    return new Promise( ( resolve, reject ) => {
      resolve( [
        {
          adminArea: "CA",
          country: "United States",
          countryCode: "US",
          feature: "771 Bush St",
          formattedAddress:
            "771 Bush St, San Francisco, CA  94108, United States",
          locality: "San Francisco",
          position: { lat: 37.79, lng: -122.41 },
          postalCode: "94108",
          streetName: "Bush St",
          streetNumber: "771",
          subAdminArea: "San Francisco",
          subLocality: "Union Square",
        },
      ] );
    } );
  } ),
} ) );

jest.mock( "realm", () => {
  const withRealmCollectionMethods = ( collection ) => Object.assign( collection, {
    filtered: jest.fn( () => collection ),
    sorted: jest.fn( () => collection ),
  } );

  const collections = {
    BadgeRealm: withRealmCollectionMethods( [] ),
    LoginRealm: withRealmCollectionMethods( [{ observationCount: 42 }] ),
    NotificationRealm: withRealmCollectionMethods( [
      {
        challengeIndex: 36,
        iconName: "badge_empty",
        index: 0,
        message: "notifications.view_challenges",
        nextScreen: "ChallengeDetails",
        seen: true,
        title: "notifications.new_challenge",
        viewed: true,
      },
    ] ),
    TaxonRealm: withRealmCollectionMethods( new Array( 42 ) ),
    UserSettingsRealm: withRealmCollectionMethods( [
      {
        autoCapture: false,
        localSeasonality: false,
        scientificNames: false,
        cameraViewportResolution: "720p",
        photoQualityBalance: "balanced",
        confidenceThreshold: 50,
        hideCameraReminder: false,
        themePreference: "system",
        appVersion: "2.0.0",
      },
    ] ),
    ObservationRealm: withRealmCollectionMethods( [
      {
        date: new Date( "2022-12-02T10:19:54.000Z" ),
        latitude: 42,
        longitude: 42,
        taxon: {
          ancestorIds: [1, 2, 3],
          defaultPhoto: {
            backupUri: "some_uri",
            lastUpdated: null,
            mediumUrl: "some_medium_url",
          },
          iconicTaxonId: 1,
          id: 4242,
          name: "some_name_1",
          preferredCommonName: "some_common_name_1",
        },
        uuidString: "some_uuid_2",
      },
      {
        date: new Date( "2022-12-02T10:19:54.000Z" ),
        latitude: 42,
        longitude: 42,
        taxon: {
          ancestorIds: [1, 2, 3],
          defaultPhoto: {
            backupUri: "some_uri",
            lastUpdated: null,
            mediumUrl: "some_medium_url",
          },
          iconicTaxonId: 1,
          id: 4242,
          name: "some_name_2",
          preferredCommonName: null,
        },
        uuidString: "some_uuid_2",
      },
    ] ),
  };

  class MockRealm {}
  MockRealm.Object = class {};
  MockRealm.open = jest.fn( () => Promise.resolve( {
    create: jest.fn( ( table, value ) => value ),
    delete: jest.fn( () => {} ),
    objects: jest.fn( ( table ) => collections[table] || withRealmCollectionMethods( [] ) ),
    write: jest.fn( callback => callback?.() ),
  } ) );

  return MockRealm;
} );

jest.mock( "react-native-vision-camera", () => ( {
  Camera: mockCamera,
  getCameraDevice: mockGetCameraDevice,
  sortDevices: mockSortDevices,
  useCameraDevice: mockUseCameraDevice,
  useCameraDevices: mockUseCameraDevices,
  useCameraFormat: mockUseCameraFormat,
  useFrameProcessor: jest.fn(),
  useLocationPermission: mockUseLocationPermission,
  VisionCameraProxy: {
    initFrameProcessorPlugin: jest.fn(),
  },
} ) );

jest.mock( "@react-native-camera-roll/camera-roll", () => ( {
  CameraRoll: {
    getPhotos: jest.fn(
      () =>
        new Promise( ( resolve ) => {
          resolve( {
            page_info: {
              end_cursor: jest.fn(),
              has_next_page: false,
            },
            edges: [
              {
                node: {
                  image: {
                    filename: "IMG_20210901_123456.jpg",
                    filepath: "/path/to/IMG_20210901_123456.jpg",
                    extension: "jpg",
                    uri: "file:///path/to/IMG_20210901_123456.jpg",
                    height: 1920,
                    width: 1080,
                    fileSize: 123456,
                    playableDuration: NaN,
                    orientation: 1,
                  },
                },
              },
            ],
          } );
        } )
    ),
    getAlbums: jest.fn( () => ( {
      // Expecting album titles as keys and photo counts as values
      // "My Amazing album": 12
    } ) ),
    save: jest.fn( ( _uri, _options = {} ) => "test_url" ),
  },
} ) );
