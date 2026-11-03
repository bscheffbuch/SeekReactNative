import * as React from "react";
import { Text, View } from "react-native";

import { ChevronRightIcon } from "../UIComponents/AppIcons";
import type { GlyphIcon } from "../UIComponents/AppIcons";
import { useTheme } from "../Providers/ThemeProvider";
import { makeThemedStyles } from "../../styles/themedStyles";
import type { ThemeTokens } from "../../styles/theme";

interface Props {
  icon: GlyphIcon;
  label: string;
  value: string;
  detail?: string | null;
}

const getStyles = makeThemedStyles( ( theme: ThemeTokens ) => ( {
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 72,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  iconDisc: {
    alignItems: "center",
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginRight: theme.spacing.md,
    width: 40,
  },
  text: {
    flex: 1,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: theme.typography.body,
    fontSize: 12,
    lineHeight: 16,
  },
  value: {
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 2,
  },
  detail: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: theme.typography.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
} ) );

// Material 3 three-line list item for a post-to-iNat field: tonal icon disc,
// overline label, current value and a trailing chevron. Presentational only,
// the pickers wrap it in their own touchable.
const PostFieldRow = ( { icon: Icon, label, value, detail }: Props ) => {
  const { theme } = useTheme( );
  const styles = getStyles( theme );
  return (
    <View style={styles.row}>
      <View style={styles.iconDisc}>
        <Icon color={theme.colors.onSecondaryContainer} size={22} strokeWidth={2} />
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      <ChevronRightIcon color={theme.colors.onSurfaceVariant} size={22} strokeWidth={2.2} />
    </View>
  );
};

export default PostFieldRow;
