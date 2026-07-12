import { onMigration } from "../../../models";

// realm-js only applies schema defaults at object creation, so rows that
// existed before a schema version added a property arrive in the new version
// with zero values ( 0 / "" / false ). onMigration must backfill the real
// defaults without clobbering values the user actually set.

const makeRealmStub = ( schemaVersion, rows = [] ) => ( {
  schemaVersion,
  objects: jest.fn( ( ) => rows ),
} );

describe( "onMigration", () => {
  it( "backfills defaults for settings rows created before schema 40", () => {
    const settings = {
      autoCapture: true,
      cameraViewportResolution: "",
      photoQualityBalance: "",
      confidenceThreshold: 0,
    };
    const oldRealm = makeRealmStub( 39 );
    const newRealm = makeRealmStub( 43, [settings] );

    onMigration( oldRealm, newRealm );

    expect( newRealm.objects ).toHaveBeenCalledWith( "UserSettingsRealm" );
    expect( settings.cameraViewportResolution ).toBe( "720p" );
    expect( settings.photoQualityBalance ).toBe( "balanced" );
    expect( settings.confidenceThreshold ).toBe( 50 );
    // untouched pre-existing setting
    expect( settings.autoCapture ).toBe( true );
  } );

  it( "does not clobber legitimately-set values", () => {
    const settings = {
      cameraViewportResolution: "1080p",
      photoQualityBalance: "quality",
      confidenceThreshold: 65,
    };
    const oldRealm = makeRealmStub( 39 );
    const newRealm = makeRealmStub( 43, [settings] );

    onMigration( oldRealm, newRealm );

    expect( settings.cameraViewportResolution ).toBe( "1080p" );
    expect( settings.photoQualityBalance ).toBe( "quality" );
    expect( settings.confidenceThreshold ).toBe( 65 );
  } );

  it( "only backfills fields added after the old schema version", () => {
    const settings = {
      cameraViewportResolution: "540p",
      photoQualityBalance: "speed",
      confidenceThreshold: 0,
    };
    const oldRealm = makeRealmStub( 41 );
    const newRealm = makeRealmStub( 43, [settings] );

    onMigration( oldRealm, newRealm );

    // confidenceThreshold was added in schema 42, so it gets the default;
    // the older fields keep whatever the existing file already had
    expect( settings.confidenceThreshold ).toBe( 50 );
    expect( settings.cameraViewportResolution ).toBe( "540p" );
    expect( settings.photoQualityBalance ).toBe( "speed" );
  } );

  it( "does nothing when upgrading from a schema that already has all fields", () => {
    const oldRealm = makeRealmStub( 42 );
    const newRealm = makeRealmStub( 43, [] );

    onMigration( oldRealm, newRealm );

    expect( newRealm.objects ).not.toHaveBeenCalled();
  } );
} );
