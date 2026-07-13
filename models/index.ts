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
// clobbered ( the settings UI can't produce 0 or "" for these fields; false is
// a legal value for the bool settings, whose zero value is also their default ).
const onMigration = ( oldRealm: Realm, newRealm: Realm ): void => {
  const oldVersion = oldRealm.schemaVersion;
  if ( oldVersion >= 46 || oldVersion <= 0 ) {
    // -1/0 = fresh install ( no old file ); >= 46 = all defaults already set
    return;
  }
  const allSettings = newRealm.objects<UserSettingsRealm>( "UserSettingsRealm" );
  allSettings.forEach( ( settings ) => {
    if ( !settings.cameraViewportResolution ) {
      settings.cameraViewportResolution = "720p";
    }
    if ( !settings.photoQualityBalance ) {
      settings.photoQualityBalance = "balanced";
    }
    if ( !settings.confidenceThreshold ) {
      settings.confidenceThreshold = 50;
    }
    if ( !settings.themePreference ) {
      settings.themePreference = "system";
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
  schemaVersion: 46,
  path: "db.realm",
  onMigration,
};
