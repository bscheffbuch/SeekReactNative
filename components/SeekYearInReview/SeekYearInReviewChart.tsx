// @ts-nocheck
import React, { useMemo } from "react";
import { View } from "react-native";
import type { NumberProp } from "react-native-svg";
import { Circle } from "react-native-svg";
import { XAxis, LineChart } from "react-native-svg-charts";

import styles from "../../styles/species/speciesChart";
import { createShortMonthsList } from "../../utility/dateHelpers";
import { useTheme } from "../Providers/ThemeProvider";
import { baseTextStyles } from "../../styles/textStyles";

interface Datum {
  month: number;
  count: number;
}
interface Props {
  readonly data: Datum[];
}

interface DecoratorProps {
  readonly data: Datum[];
  readonly color: string;
  x: ( _: number ) => NumberProp;
  y: ( _: number ) => NumberProp;
}

const Decorator = ( { data, color, x, y }: DecoratorProps ) => data.map( ( value ) => (
  <Circle
    key={`circle-${value.month}`}
    cx={x( value.month )}
    cy={y( value.count )}
    fill={color}
    r={4}
  />
) );

const SeekYearInReviewChart = ( { data }: Props ) => {
  const xAccessor = ( { item }: { item: Datum } ) => item.month;
  const yAccessor = ( { item }: { item: Datum } ) => item.count;
  const { theme } = useTheme( );
  const lineChartSvg = { stroke: theme.colors.primary, strokeWidth: 2 };
  const chartBaseline = { borderBottomColor: theme.colors.outlineVariant };

  const xAxis = useMemo( ( ) => {
    const axisLabel = { ...baseTextStyles.chartAxis, fill: theme.colors.onSurfaceVariant, fontSize: 14 };
    const allMonths = createShortMonthsList();
    const formatXAxis = ( index: number ) => allMonths[index];
    const formatLabel = ( value: number ) => formatXAxis( value - 1 );
    return (
      <XAxis
        contentInset={styles.xAxisWidth}
        data={data}
        formatLabel={formatLabel}
        svg={axisLabel}
        xAccessor={xAccessor}
      />
    );
  }, [data, theme] );

  return (
    <View
      testID="year-in-review-chart-container"
      style={styles.chartContainer}
    >
      <LineChart
        contentInset={styles.chartInset}
        data={data}
        style={[styles.chart, chartBaseline]}
        svg={lineChartSvg}
        xAccessor={xAccessor}
        yAccessor={yAccessor}
      >
        <Decorator data={data} color={theme.colors.primary} />
      </LineChart>
      {xAxis}
    </View>
  );
};

export default SeekYearInReviewChart;
