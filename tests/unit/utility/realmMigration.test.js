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
  it( "backfills defaults for settings rows created before the fields existed", () => {
    const settings = {
      autoCapture: true,
      cameraViewportResolution: "",
      photoQualityBalance: "",
      confidenceThreshold: 0,
      themePreference: "",
    };
    const oldRealm = makeRealmStub( 39 );
    const newRealm = makeRealmStub( 46, [settings] );

    onMigration( oldRealm, newRealm );

    expect( newRealm.objects ).toHaveBeenCalledWith( "UserSettingsRealm" );
    expect( settings.cameraViewportResolution ).toBe( "720p" );
    expect( settings.photoQualityBalance ).toBe( "balanced" );
    expect( settings.confidenceThreshold ).toBe( 50 );
    expect( settings.themePreference ).toBe( "system" );
    // untouched pre-existing setting
    expect( settings.autoCapture ).toBe( true );
  } );

  it( "does not clobber legitimately-set values", () => {
    const settings = {
      cameraViewportResolution: "1080p",
      photoQualityBalance: "quality",
      confidenceThreshold: 65,
      themePreference: "dark",
    };
    const oldRealm = makeRealmStub( 43 );
    const newRealm = makeRealmStub( 46, [settings] );

    onMigration( oldRealm, newRealm );

    expect( settings.cameraViewportResolution ).toBe( "1080p" );
    expect( settings.photoQualityBalance ).toBe( "quality" );
    expect( settings.confidenceThreshold ).toBe( 65 );
    expect( settings.themePreference ).toBe( "dark" );
  } );

  it( "does nothing when the old file already has the current schema", () => {
    const oldRealm = makeRealmStub( 46 );
    const newRealm = makeRealmStub( 46, [] );

    onMigration( oldRealm, newRealm );

    expect( newRealm.objects ).not.toHaveBeenCalled();
  } );

  it( "does nothing on a fresh install with no previous file", () => {
    const oldRealm = makeRealmStub( 0 );
    const newRealm = makeRealmStub( 46, [] );

    onMigration( oldRealm, newRealm );

    expect( newRealm.objects ).not.toHaveBeenCalled();
  } );
} );
