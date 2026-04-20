import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline, Line, Circle, Path, Text as SvgText, Rect, LinearGradient, Defs, Stop } from 'react-native-svg';

const ORANGE = '#FF5722';
const ORANGE_LIGHT = '#FF8A65';
const SURFACE = '#1A1A1A';
const BORDER = '#27272A';
const TEXT_SECONDARY = '#A1A1AA';

// ─── Weight Progress Line Chart ───────────────────────────────────────────────
export function WeightLineChart({ data = [], width = 300, height = 140 }) {
  if (!data || data.length < 2) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: TEXT_SECONDARY, fontSize: 13 }}>No weight data yet</Text>
      </View>
    );
  }

  const padding = { left: 36, right: 16, top: 16, bottom: 28 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const minVal = Math.min(...values) - 1;
  const maxVal = Math.max(...values) + 1;

  const xStep = chartW / (data.length - 1);
  const toY = (v) => padding.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
  const toX = (i) => padding.left + i * xStep;

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');

  // Area fill path
  const areaPath = `M${toX(0)},${toY(data[0].value)} ` +
    data.map((d, i) => `L${toX(i)},${toY(d.value)}`).join(' ') +
    ` L${toX(data.length - 1)},${padding.top + chartH} L${padding.left},${padding.top + chartH} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ORANGE} stopOpacity="0.3" />
          <Stop offset="1" stopColor={ORANGE} stopOpacity="0.0" />
        </LinearGradient>
      </Defs>

      {/* Horizontal grid lines */}
      {[0, 0.5, 1].map((t, i) => {
        const y = padding.top + t * chartH;
        const val = (maxVal - (maxVal - minVal) * t).toFixed(1);
        return (
          <React.Fragment key={i}>
            <Line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={BORDER} strokeWidth="1" />
            <SvgText x={padding.left - 4} y={y + 4} fontSize="9" fill={TEXT_SECONDARY} textAnchor="end">{val}</SvgText>
          </React.Fragment>
        );
      })}

      {/* Area fill */}
      <Path d={areaPath} fill="url(#weightGrad)" />

      {/* Line */}
      <Polyline points={points} fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points */}
      {data.map((d, i) => (
        <Circle key={i} cx={toX(i)} cy={toY(d.value)} r="4" fill={ORANGE} stroke="#121212" strokeWidth="2" />
      ))}

      {/* X labels */}
      {data.map((d, i) => (
        <SvgText key={i} x={toX(i)} y={height - 6} fontSize="9" fill={TEXT_SECONDARY} textAnchor="middle">
          {d.label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── Workout Intensity Bar Chart ──────────────────────────────────────────────
export function WorkoutIntensityBarChart({ data = [], width = 300, height = 140 }) {
  const defaultData = [
    { day: 'Mon', volume: 0 },
    { day: 'Tue', volume: 0 },
    { day: 'Wed', volume: 0 },
    { day: 'Thu', volume: 0 },
    { day: 'Fri', volume: 0 },
    { day: 'Sat', volume: 0 },
    { day: 'Sun', volume: 0 },
  ];
  const chartData = data.length >= 7 ? data : defaultData.map((d, i) => ({
    ...d, ...(data[i] || {})
  }));

  const padding = { left: 8, right: 8, top: 12, bottom: 28 };
  const chartH = height - padding.top - padding.bottom;
  const maxVol = Math.max(...chartData.map(d => d.volume), 1);
  const barCount = chartData.length;
  const totalWidth = width - padding.left - padding.right;
  const barWidth = (totalWidth / barCount) * 0.5;
  const barSpacing = totalWidth / barCount;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ORANGE} stopOpacity="1" />
          <Stop offset="1" stopColor={ORANGE} stopOpacity="0.4" />
        </LinearGradient>
      </Defs>

      {/* Grid */}
      {[0, 0.5, 1].map((t, i) => (
        <Line key={i}
          x1={padding.left} y1={padding.top + t * chartH}
          x2={width - padding.right} y2={padding.top + t * chartH}
          stroke={BORDER} strokeWidth="1"
        />
      ))}

      {/* Bars */}
      {chartData.map((d, i) => {
        const barH = (d.volume / maxVol) * chartH;
        const cx = padding.left + i * barSpacing + barSpacing / 2;
        const isToday = d.day === today.slice(0, 3);
        return (
          <React.Fragment key={i}>
            <Rect
              x={cx - barWidth / 2}
              y={padding.top + chartH - barH}
              width={barWidth}
              height={Math.max(barH, 2)}
              rx="5"
              fill={d.volume > 0 ? "url(#barGrad)" : BORDER}
              opacity={isToday ? 1 : 0.7}
            />
            {isToday && d.volume > 0 && (
              <Circle cx={cx} cy={padding.top + chartH - barH - 8} r="3" fill={ORANGE} />
            )}
            <SvgText x={cx} y={height - 6} fontSize="10" fill={isToday ? ORANGE : TEXT_SECONDARY} textAnchor="middle" fontWeight={isToday ? 'bold' : 'normal'}>
              {d.day}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── Circular Progress Ring ───────────────────────────────────────────────────
export function CalorieRing({ consumed = 0, goal = 2000, size = 120 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(consumed / goal, 1);
  const strokeDash = pct * circumference;
  const cx = size / 2;
  const cy = size / 2;
  const remaining = Math.max(goal - consumed, 0);
  const overBudget = consumed > goal;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={ORANGE} stopOpacity="1" />
            <Stop offset="1" stopColor={ORANGE_LIGHT} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Background track */}
        <Circle cx={cx} cy={cy} r={radius} stroke={BORDER} strokeWidth="10" fill="none" />
        {/* Progress */}
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={overBudget ? "#EF4444" : "url(#ringGrad)"}
          strokeWidth="10" fill="none"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          originX={cx} originY={cy}
        />
      </Svg>
      {/* Center text */}
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ color: overBudget ? '#EF4444' : '#fff', fontSize: 22, fontWeight: '800' }}>
          {remaining > 999 ? `${(remaining / 1000).toFixed(1)}k` : remaining}
        </Text>
        <Text style={{ color: TEXT_SECONDARY, fontSize: 10, marginTop: 1 }}>
          {overBudget ? 'over' : 'left'}
        </Text>
      </View>
    </View>
  );
}
