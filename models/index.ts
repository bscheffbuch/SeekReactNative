import type Realm from "realm";

import BadgeRealm from "./BadgeRealm";
import ChallengeRealm from "./ChallengeRealm";
import CommonNamesRealm from "./CommonNamesRealm";
import LoginRealm from "./LoginRealm";
import NotificationRealm from "./NotificationRealm";
import ObservationRealm from "./ObservationRealm";
import PhotoRealm from "./PhotoRealm";
import TaxonRealm from "./TaxonRealm";
import ReviewRealm from "./ReviewRealm";
import UploadObservationRealm from "./UploadObservationRealm";
import UploadPhotoRealm from "./UploadPhotoRealm";
import UserSettingsRealm from "./UserSettingsRealm";

// realm-js only applies schema `default` values when an object is created, so
// properties added in later schema versions arrive as zero values ( 0 / "" /
// false ) on rows that already existed. Existing rows must be backfilled here.
// Only zero values are overwritten, so legitimately-set values are never
// clobbered ( the settings UI can't produce 0 or "" for these fields ).
//
// Schema history:
// v40 added UserSettingsRealm.cameraViewportResolution ( default "720p" )
// v41 added UserSettingsRealm.photoQualityBalance ( default "balanced" )
// v42 added UserSettingsRealm.confidenceThreshold ( default 50 )
// v43 added UploadObservationRealm.queued ( default false ) and photoUris
//     ( nullable ); their zero values ( false / null ) are already correct for
//     pre-existing rows, so no backfill is needed
const onMigration = ( oldRealm: Realm, newRealm: Realm ): void => {
  const oldVersion = oldRealm.schemaVersion;
  if ( oldVersion >= 42 || oldVersion <= 0 ) {
    // -1/0 = fresh install ( no old file ); >= 42 = all defaults already set
    return;
  }
  const allSettings = newRealm.objects<UserSettingsRealm>( "UserSettingsRealm" );
  allSettings.forEach( ( settings ) => {
    if ( oldVersion < 40 && !settings.cameraViewportResolution ) {
      settings.cameraViewportResolution = "720p";
    }
    if ( oldVersion < 41 && !settings.photoQualityBalance ) {
      settings.photoQualityBalance = "balanced";
    }
    if ( oldVersion < 42 && !settings.confidenceThreshold ) {
      settings.confidenceThreshold = 50;
    }
  } );
};

export { onMigration };

export default {
  schema: [
    BadgeRealm,
    ChallengeRealm,
    CommonNamesRealm,
    LoginRealm,
    NotificationRealm,
    ObservationRealm,
    PhotoRealm,
    ReviewRealm,
    TaxonRealm,
    UploadObservationRealm,
    UploadPhotoRealm,
    UserSettingsRealm,
  ],
  schemaVersion: 43,
  path: "db.realm",
  onMigration,
};
