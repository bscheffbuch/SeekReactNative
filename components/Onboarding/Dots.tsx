import * as React from "react";
import { View } from "react-native";

import { viewStyles } from "../../styles/onboarding";
import { useTheme } from "../Providers/ThemeProvider";

interface Props {
  index: number;
  count?: number;
}

// M3 page indicator: the current page is a primary pill, others small dots.
const Dots = ( { index, count = 3 }: Props ) => {
  const { theme } = useTheme( );
  return (
    <View
      accessibilityLabel={`${index + 1} / ${count}`}
      style={[viewStyles.pagination, viewStyles.center]}
    >
      {Array.from( { length: count }, ( _, key ) => (
        <View
          key={key}
          style={[
            viewStyles.dot,
            { backgroundColor: theme.colors.outlineVariant },
            key === index && [viewStyles.activeDot, { backgroundColor: theme.colors.primary }],
          ]}
        />
      ) )}
    </View>
  );
};

export default Dots;
