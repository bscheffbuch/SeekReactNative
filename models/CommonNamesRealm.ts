import type { ObjectSchema } from "realm";
import Realm from "realm";

class CommonNamesRealm extends Realm.Object {
  static schema: ObjectSchema = {
    name: "CommonNamesRealm",
    properties: {
      // indexed (schema 47): every name lookup filters on taxon_id, and a
      // large model pack can add 100k+ rows
      taxon_id: { type: "int", indexed: true },
      locale: "string",
      name: "string",
    },
  };
}

export default CommonNamesRealm;
