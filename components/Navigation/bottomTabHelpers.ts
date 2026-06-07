import type { BottomTabParamList } from "./types";

export const tabLabels: Record<keyof BottomTabParamList, string> = {
  Home: "menu.home",
  Observations: "menu.observations",
  Scan: "menu.scan",
  Challenges: "menu.challenges",
  More: "menu.more",
};

export const handleScanTabPress = ( navigation: { navigate: ( route: string ) => void } ) => ( event: {
  preventDefault: () => void;
} ) => {
  event.preventDefault();
  navigation.navigate( "Camera" );
};