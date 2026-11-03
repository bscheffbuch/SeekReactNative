import React, { useState } from "react";
import { TouchableOpacity } from "react-native";

import i18n from "../../../i18n";
import DateTimePicker from "../../UIComponents/DateTimePicker";
import PostFieldRow from "../PostFieldRow";
import { CalendarIcon } from "../../UIComponents/AppIcons";

interface Props {
  dateToDisplay: string | null;
  handleDatePicked: ( date: Date ) => void;
}

const DatePicker = ( { dateToDisplay, handleDatePicked }: Props ) => {
  const [showModal, setShowModal] = useState( false );

  const openModal = ( ) => setShowModal( true );
  const closeModal = ( ) => setShowModal( false );

  const displayDate = ( ) => dateToDisplay || "";

  const handlePicked = ( date: Date ) => {
    handleDatePicked( date );
    closeModal( );
  };

  return (
    <>
      <DateTimePicker
        datetime
        isDateTimePickerVisible={showModal}
        onDatePicked={handlePicked}
        toggleDateTimePicker={closeModal}
      />
      <TouchableOpacity accessibilityRole="button" onPress={openModal}>
        <PostFieldRow icon={CalendarIcon} label={i18n.t( "posting.date" )} value={displayDate( )} />
      </TouchableOpacity>
    </>
  );
};

export default DatePicker;
