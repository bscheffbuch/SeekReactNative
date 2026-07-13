// @ts-nocheck
import { useState, useEffect } from "react";
import Realm from "realm";

import realmConfig from "../../../models";

export interface Notification {
  title: string;
  message: string;
  iconName?: string;
  nextScreen: string;
  challengeIndex?: number;
  index: number;
  seen: boolean;
  viewed: boolean;
}
const useFetchNotifications = ( ) => {
  const [notifications, setNotifications] = useState<Notification[]>( [] );

  useEffect( ( ) => {
    const fetchNotifications = async ( ) => {
      try {
        const realm = await Realm.open( realmConfig );
        const notificationList = realm.objects( "NotificationRealm" ).sorted( "index", true );
        // copy to a plain array so state doesn't hold live Realm results
        setNotifications( notificationList.map( ( notification ) => notification.toJSON( ) ) );
      } catch ( e ) {
        console.log( e, "couldn't open realm: notifications" );
      }
    };
    fetchNotifications( );
  }, [] );

  return notifications;
};

export default useFetchNotifications;
