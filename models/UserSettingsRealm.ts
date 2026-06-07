import Realm from "realm";

class UserSettingsRealm extends Realm.Object<UserSettingsRealm> {
  autoCapture!: boolean;
  localSeasonality!: boolean;
  scientificNames!: boolean;
  themePreference!: "system" | "light" | "dark";
  cameraViewportResolution!: string;
  photoQualityBalance!: string;
  confidenceThreshold!: number;
  hideCameraReminder!: boolean;
  appVersion!: string;

  static schema: Realm.ObjectSchema = {
    name: "UserSettingsRealm",
    properties: {
      autoCapture: { type: "bool", default: false },
      localSeasonality: { type: "bool", default: false },
      scientificNames: { type: "bool", default: false },
      themePreference: { type: "string", default: "system" },
      cameraViewportResolution: { type: "string", default: "720p" },
      photoQualityBalance: { type: "string", default: "balanced" },
      confidenceThreshold: { type: "int", default: 50 },
      hideCameraReminder: { type: "bool", default: false },
      appVersion: { type: "string", default: "2.0.0" },
    },
  };
}

export default UserSettingsRealm;
