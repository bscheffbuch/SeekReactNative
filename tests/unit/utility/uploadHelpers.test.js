import inatjs from "inaturalistjs";

import { uploadObservation } from "../../../utility/uploadHelpers";

const mockPhotoRow = { id: 7, uploadSucceeded: false, uploadFailed: false };

jest.mock( "realm", ( ) => ( {
  open: jest.fn( async ( ) => ( {
    write: ( fn ) => fn( ),
    objects: ( ) => ( { filtered: ( ) => [mockPhotoRow] } ),
  } ) ),
} ) );
jest.mock( "../../../models/index", ( ) => ( {} ) );
jest.mock( "inaturalistjs", ( ) => ( {
  __esModule: true,
  FileUpload: class {
    constructor( params ) { Object.assign( this, params ); }
  },
  default: {
    observations: { create: jest.fn( ) },
    observation_photos: { create: jest.fn( ) },
    taxa: { fetch: jest.fn( async ( ) => ( { results: [{ is_active: true }] } ) ) },
  },
} ) );
jest.mock( "../../../utility/photoHelpers", ( ) => ( {
  resizeImage: jest.fn( async ( uri ) => `resized-${uri}` ),
  deleteBackupFile: jest.fn( ),
} ) );
jest.mock( "../../../utility/loginHelpers", ( ) => ( { fetchAccessToken: jest.fn( async ( ) => "login" ) } ) );
jest.mock( "../../../utility/tokenHelpers", ( ) => ( { fetchJSONWebToken: jest.fn( async ( ) => "token" ) } ) );

const flush = ( ) => new Promise( resolve => setImmediate( resolve ) );

const makeObservation = ( photoUris ) => ( {
  uuid: "obs",
  taxon_id: 1,
  vision: true,
  photo: { id: null, uri: "a", uuid: "photo" },
  photoUris,
} );

const uploadedUris = ( ) => inatjs.observation_photos.create.mock.calls.map( ( [params] ) => params.file.uri );

describe( "uploadObservation with several photos", ( ) => {
  beforeEach( ( ) => {
    jest.clearAllMocks( );
    mockPhotoRow.uploadSucceeded = false;
    mockPhotoRow.uploadFailed = false;
    inatjs.observations.create.mockResolvedValue( [{ id: 7 }] );
    inatjs.observation_photos.create.mockResolvedValue( {} );
  } );

  it( "adds every photo to one observation, in order", async ( ) => {
    const observation = makeObservation( JSON.stringify( ["a", "b", "c"] ) );

    await expect( uploadObservation( observation ) ).resolves.toBe( true );
    await flush( );

    expect( inatjs.observations.create ).toHaveBeenCalledTimes( 1 );
    expect( uploadedUris( ) ).toEqual( ["resized-a", "resized-b", "resized-c"] );
    expect( inatjs.observation_photos.create.mock.calls.every( ( [p] ) => p["observation_photo[observation_id]"] === 7 ) )
      .toBe( true );
    expect( observation.photoUris ).toBe( "[]" );
    expect( mockPhotoRow.uploadSucceeded ).toBe( true );
  } );

  it( "keeps a failed photo for the retry and only uploads what is left", async ( ) => {
    inatjs.observation_photos.create
      .mockResolvedValueOnce( {} )
      .mockRejectedValueOnce( new Error( "server error" ) )
      .mockResolvedValueOnce( {} );
    const observation = makeObservation( JSON.stringify( ["a", "b", "c"] ) );

    const first = await uploadObservation( observation );
    await flush( );

    expect( first ).toEqual( { error: { type: "photo", errorText: "server error" } } );
    expect( observation.photoUris ).toBe( JSON.stringify( ["b"] ) );
    expect( mockPhotoRow.uploadSucceeded ).toBe( false );

    inatjs.observation_photos.create.mockClear( );
    await expect( uploadObservation( observation ) ).resolves.toBe( true );
    await flush( );

    // the observation exists already, so it is not created again
    expect( inatjs.observations.create ).toHaveBeenCalledTimes( 1 );
    expect( uploadedUris( ) ).toEqual( ["resized-b"] );
    expect( mockPhotoRow.uploadSucceeded ).toBe( true );
  } );

  it( "uploads only the main photo when there are no others", async ( ) => {
    const observation = makeObservation( null );

    await expect( uploadObservation( observation ) ).resolves.toBe( true );

    expect( uploadedUris( ) ).toEqual( ["resized-a"] );
  } );
} );
