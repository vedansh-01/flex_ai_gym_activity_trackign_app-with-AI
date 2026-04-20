import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';

// Muscle color system
const COLORS = {
  active: '#FF5722',      // Orange - primary muscle targeted
  secondary: '#FF8A65',   // Light orange - secondary muscle
  inactive: '#2a2a2a',    // Dark gray - unused muscle
  skin: '#1e1e1e',        // Body base
  outline: '#444444',     // Body outline
};

const getColor = (muscleName, primaryMuscles = [], secondaryMuscles = []) => {
  if (primaryMuscles.includes(muscleName)) return COLORS.active;
  if (secondaryMuscles.includes(muscleName)) return COLORS.secondary;
  return COLORS.inactive;
};

export default function MuscleModelSVG({ primaryMuscles = [], secondaryMuscles = [], view = 'front' }) {
  const c = (name) => getColor(name, primaryMuscles, secondaryMuscles);

  if (view === 'front') {
    return (
      <View style={{ alignItems: 'center' }}>
        <Svg width="180" height="320" viewBox="0 0 180 320">
          {/* Head */}
          <Ellipse cx="90" cy="28" rx="22" ry="24" fill="#2a2a2a" stroke={COLORS.outline} strokeWidth="1.5" />

          {/* Neck */}
          <Path d="M80 50 Q90 58 100 50 L103 68 Q90 75 77 68 Z" fill="#2a2a2a" stroke={COLORS.outline} strokeWidth="1" />

          {/* SHOULDERS */}
          <Ellipse cx="55" cy="85" rx="18" ry="14" fill={c('shoulders')} stroke={COLORS.outline} strokeWidth="1.5" />
          <Ellipse cx="125" cy="85" rx="18" ry="14" fill={c('shoulders')} stroke={COLORS.outline} strokeWidth="1.5" />

          {/* CHEST */}
          <Path d="M72 72 Q90 68 108 72 L112 100 Q100 110 90 112 Q80 110 68 100 Z" fill={c('chest')} stroke={COLORS.outline} strokeWidth="1.5" />

          {/* CHEST Pec line divide */}
          <Path d="M90 72 L90 112" stroke={COLORS.outline} strokeWidth="0.8" opacity="0.4" />

          {/* TRICEPS (left arm outer) */}
          <Path d="M38 82 Q30 90 28 110 L38 112 Q44 95 46 85 Z" fill={c('triceps')} stroke={COLORS.outline} strokeWidth="1.5" />
          {/* TRICEPS (right arm outer) */}
          <Path d="M142 82 Q150 90 152 110 L142 112 Q136 95 134 85 Z" fill={c('triceps')} stroke={COLORS.outline} strokeWidth="1.5" />

          {/* BICEPS (left) */}
          <Path d="M46 85 Q52 88 54 108 L44 110 Q38 95 38 85 Z" fill={c('biceps')} stroke={COLORS.outline} strokeWidth="1.5" />
          {/* BICEPS (right) */}
          <Path d="M134 85 Q128 88 126 108 L136 110 Q142 95 142 85 Z" fill={c('biceps')} stroke={COLORS.outline} strokeWidth="1.5" />

          {/* Forearms left */}
          <Path d="M38 112 Q33 130 35 148 L44 148 Q44 130 44 112 Z" fill={c('forearms')} stroke={COLORS.outline} strokeWidth="1.5" />
          {/* Forearms right */}
          <Path d="M142 112 Q147 130 145 148 L136 148 Q136 130 136 112 Z" fill={c('forearms')} stroke={COLORS.outline} strokeWidth="1.5" />

          {/* ABS - 3x2 grid */}
          {/* Row 1 */}
          <Path d="M80 114 L90 114 L90 130 L80 130 Z" rx="3" fill={c('abs')} stroke={COLORS.outline} strokeWidth="1.2" />
          <Path d="M90 114 L100 114 L100 130 L90 130 Z" rx="3" fill={c('abs')} stroke={COLORS.outline} strokeWidth="1.2" />
          {/* Row 2 */}
          <Path d="M80 132 L90 132 L90 148 L80 148 Z" rx="3" fill={c('abs')} stroke={COLORS.outline} strokeWidth="1.2" />
          <Path d="M90 132 L100 132 L100 148 L90 148 Z" rx="3" fill={c('abs')} stroke={COLORS.outline} strokeWidth="1.2" />
          {/* Row 3 */}
          <Path d="M80 150 L90 150 L90 164 L80 164 Z" rx="3" fill={c('abs')} stroke={COLORS.outline} strokeWidth="1.2" />
          <Path d="M90 150 L100 150 L100 164 L90 164 Z" rx="3" fill={c('abs')} stroke={COLORS.outline} strokeWidth="1.2" />

          {/* Obliques */}
          <Path d="M68 100 Q64 130 68 165 L80 160 L80 114 Q74 108 68 100 Z" fill={c('obliques')} stroke={COLORS.outline} strokeWidth="1.2" />
          <Path d="M112 100 Q116 130 112 165 L100 160 L100 114 Q106 108 112 100 Z" fill={c('obliques')} stroke={COLORS.outline} strokeWidth="1.2" />

          {/* QUADS Left */}
          <Path d="M70 168 Q65 200 66 235 L82 235 Q82 200 78 168 Z" fill={c('quads')} stroke={COLORS.outline} strokeWidth="1.5" />
          {/* QUADS Right */}
          <Path d="M110 168 Q115 200 114 235 L98 235 Q98 200 102 168 Z" fill={c('quads')} stroke={COLORS.outline} strokeWidth="1.5" />

          {/* Inner quad divide */}
          <Path d="M77 168 Q80 200 80 235" stroke={COLORS.outline} strokeWidth="0.8" opacity="0.3" />
          <Path d="M103 168 Q100 200 100 235" stroke={COLORS.outline} strokeWidth="0.8" opacity="0.3" />

          {/* Knee caps */}
          <Ellipse cx="74" cy="240" rx="10" ry="7" fill="#252525" stroke={COLORS.outline} strokeWidth="1" />
          <Ellipse cx="106" cy="240" rx="10" ry="7" fill="#252525" stroke={COLORS.outline} strokeWidth="1" />

          {/* CALVES Left */}
          <Path d="M66 248 Q62 275 65 295 L80 295 Q81 270 79 248 Z" fill={c('calves')} stroke={COLORS.outline} strokeWidth="1.5" />
          {/* CALVES Right */}
          <Path d="M114 248 Q118 275 115 295 L100 295 Q99 270 101 248 Z" fill={c('calves')} stroke={COLORS.outline} strokeWidth="1.5" />

          {/* Feet */}
          <Ellipse cx="72" cy="300" rx="13" ry="7" fill="#1a1a1a" stroke={COLORS.outline} strokeWidth="1" />
          <Ellipse cx="108" cy="300" rx="13" ry="7" fill="#1a1a1a" stroke={COLORS.outline} strokeWidth="1" />

          {/* Hip / Groin divider */}
          <Path d="M72 162 Q80 172 90 174 Q100 172 108 162 L112 165 L90 180 L68 165 Z" fill="#252525" stroke={COLORS.outline} strokeWidth="1" />
        </Svg>
      </View>
    );
  }

  // BACK VIEW
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="180" height="320" viewBox="0 0 180 320">
        {/* Head */}
        <Ellipse cx="90" cy="28" rx="22" ry="24" fill="#2a2a2a" stroke={COLORS.outline} strokeWidth="1.5" />

        {/* Neck back */}
        <Path d="M80 50 Q90 55 100 50 L100 68 Q90 72 80 68 Z" fill="#2a2a2a" stroke={COLORS.outline} strokeWidth="1" />

        {/* SHOULDERS back */}
        <Ellipse cx="55" cy="85" rx="18" ry="14" fill={c('shoulders')} stroke={COLORS.outline} strokeWidth="1.5" />
        <Ellipse cx="125" cy="85" rx="18" ry="14" fill={c('shoulders')} stroke={COLORS.outline} strokeWidth="1.5" />

        {/* TRAPS */}
        <Path d="M80 52 Q90 50 100 52 L115 80 Q90 85 65 80 Z" fill={c('traps')} stroke={COLORS.outline} strokeWidth="1.5" />

        {/* RHOMBOIDS */}
        <Path d="M75 82 L105 82 L108 104 L72 104 Z" fill={c('rhomboids')} stroke={COLORS.outline} strokeWidth="1.5" />

        {/* LATS - Left */}
        <Path d="M72 78 Q62 95 60 130 Q65 145 78 152 L80 105 Z" fill={c('lats')} stroke={COLORS.outline} strokeWidth="1.5" />
        {/* LATS - Right */}
        <Path d="M108 78 Q118 95 120 130 Q115 145 102 152 L100 105 Z" fill={c('lats')} stroke={COLORS.outline} strokeWidth="1.5" />

        {/* Triceps back */}
        <Path d="M38 82 Q30 90 28 110 L38 112 Q44 95 46 85 Z" fill={c('triceps')} stroke={COLORS.outline} strokeWidth="1.5" />
        <Path d="M142 82 Q150 90 152 110 L142 112 Q136 95 134 85 Z" fill={c('triceps')} stroke={COLORS.outline} strokeWidth="1.5" />

        {/* Bicep (visible round back) */}
        <Path d="M46 85 Q52 88 54 108 L44 110 Q38 95 38 85 Z" fill={c('biceps')} stroke={COLORS.outline} strokeWidth="1" opacity="0.5" />
        <Path d="M134 85 Q128 88 126 108 L136 110 Q142 95 142 85 Z" fill={c('biceps')} stroke={COLORS.outline} strokeWidth="1" opacity="0.5" />

        {/* Forearms */}
        <Path d="M38 112 Q33 130 35 148 L44 148 Q44 130 44 112 Z" fill={c('forearms')} stroke={COLORS.outline} strokeWidth="1.5" />
        <Path d="M142 112 Q147 130 145 148 L136 148 Q136 130 136 112 Z" fill={c('forearms')} stroke={COLORS.outline} strokeWidth="1.5" />

        {/* LOWER BACK */}
        <Path d="M78 152 Q72 165 75 178 L105 178 Q108 165 102 152 Q96 160 84 160 Z" fill={c('lowerBack')} stroke={COLORS.outline} strokeWidth="1.5" />

        {/* GLUTES */}
        <Path d="M75 178 Q70 200 72 215 Q80 220 90 218 Q100 220 108 215 Q110 200 105 178 Z" fill={c('glutes')} stroke={COLORS.outline} strokeWidth="1.5" />
        <Path d="M90 180 L90 218" stroke={COLORS.outline} strokeWidth="0.8" opacity="0.3" />

        {/* HAMSTRINGS Left */}
        <Path d="M72 218 Q68 250 70 270 L84 270 Q84 248 80 218 Z" fill={c('hamstrings')} stroke={COLORS.outline} strokeWidth="1.5" />
        {/* HAMSTRINGS Right */}
        <Path d="M108 218 Q112 250 110 270 L96 270 Q96 248 100 218 Z" fill={c('hamstrings')} stroke={COLORS.outline} strokeWidth="1.5" />

        {/* Knee back */}
        <Ellipse cx="76" cy="274" rx="10" ry="7" fill="#252525" stroke={COLORS.outline} strokeWidth="1" />
        <Ellipse cx="104" cy="274" rx="10" ry="7" fill="#252525" stroke={COLORS.outline} strokeWidth="1" />

        {/* CALVES back */}
        <Path d="M68 280 Q64 308 67 314 L82 314 Q83 298 82 280 Z" fill={c('calves')} stroke={COLORS.outline} strokeWidth="1.5" />
        <Path d="M112 280 Q116 308 113 314 L98 314 Q97 298 98 280 Z" fill={c('calves')} stroke={COLORS.outline} strokeWidth="1.5" />

        {/* Feet */}
        <Ellipse cx="74" cy="316" rx="13" ry="5" fill="#1a1a1a" stroke={COLORS.outline} strokeWidth="1" />
        <Ellipse cx="106" cy="316" rx="13" ry="5" fill="#1a1a1a" stroke={COLORS.outline} strokeWidth="1" />
      </Svg>
    </View>
  );
}
