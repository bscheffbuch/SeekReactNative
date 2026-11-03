import * as React from "react";
import i18n from "../../../i18n";
import Picker from "../../UIComponents/Picker";
import PostFieldRow from "../PostFieldRow";
import { LockIcon } from "../../UIComponents/AppIcons";

type Geoprivacy = "geoprivacy";
interface Props {
  updateObservation: ( string: Geoprivacy, value: string ) => void;
  geoprivacy: string;
}

const GeoprivacyPicker = ( { updateObservation, geoprivacy }: Props ) => {
  const geoprivacyTypes = [{
    label: i18n.t( "posting.open" ),
    value: "open",
  },
  {
    label: i18n.t( "posting.obscured" ),
    value: "obscured",
  },
  {
    label: i18n.t( "posting.private" ),
    value: "private",
  }];

  const setGeoprivacy = ( value: string ) => updateObservation( "geoprivacy", value );

  const geoprivacyText = geoprivacyTypes.filter( type => type.value === geoprivacy )[0].label;

  const renderGeoprivacyPicker = React.useMemo( ( ) => (
    <PostFieldRow
      icon={LockIcon}
      label={i18n.t( "posting.geoprivacy" )}
      value={geoprivacyText}
    />
  ), [geoprivacyText] );

  return (
    <Picker
      itemList={geoprivacyTypes}
      handleValueChange={setGeoprivacy}
    >
      {renderGeoprivacyPicker}
    </Picker>
  );
};

export default GeoprivacyPicker;
