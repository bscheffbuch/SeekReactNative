import type { ObjectSchema } from "realm";
import Realm from "realm";

class UploadObservationRealm extends Realm.Object {
  static schema: ObjectSchema = {
    name: "UploadObservationRealm",
    primaryKey: "uuid",
    properties: {
      uuid: "string",
      observed_on_string: "string?",
      taxon_id: "int?",
      geoprivacy: "string",
      captive_flag: "bool",
      place_guess: "string?",
      latitude: "float?",
      longitude: "float?",
      positional_accuracy: "int?",
      description: "string?",
      photo: "UploadPhotoRealm",
      vision: "bool",
      // marks a locally-saved "save for later" draft that has not been uploaded yet
      queued: { type: "bool", default: false },
      // JSON-encoded array of photo paths, used for multi-photo observations
      // created by combining queued drafts. Falls back to `photo.uri` when null.
      photoUris: "string?",
      // JSON-encoded array of AR-camera predictions captured at save time, used
      // to reopen the identification (Match) screen for a queued draft.
      predictions: "string?",
    },
  };
}

export default UploadObservationRealm;
