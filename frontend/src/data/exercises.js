/**
 * FlexAI Comprehensive Exercise Database
 * 150+ exercises across all muscle groups with scientifically validated MET values.
 * MET source: ACSM, Compendium of Physical Activities (Ainsworth et al.)
 */

import { calcCaloriesAdvanced, calcCaloriesCardio, calcExerciseTotal } from '../utils/fitnessCalc';


export const MUSCLE_GROUPS = [
  'All', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core',
  'Glutes', 'Cardio', 'Full Body', 'Forearms',
];

export const EXERCISES = [

  // ─────────────────────────── CHEST ───────────────────────────────────────
  { id: 'barbell_bench',       name: 'Barbell Bench Press',          muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['shoulders', 'triceps'],  met: 5.0, icon: '🏋️' },
  { id: 'dumbbell_bench',      name: 'Dumbbell Bench Press',         muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['shoulders', 'triceps'],  met: 4.8, icon: '🏋️' },
  { id: 'incline_barbell',     name: 'Incline Barbell Press',        muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['shoulders'],             met: 4.8, icon: '🏋️' },
  { id: 'incline_dumbbell',    name: 'Incline Dumbbell Press',       muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['shoulders'],             met: 4.5, icon: '🏋️' },
  { id: 'decline_bench',       name: 'Decline Bench Press',          muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['triceps'],               met: 4.8, icon: '🏋️' },
  { id: 'smith_bench',         name: 'Smith Machine Bench Press',    muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['shoulders', 'triceps'],  met: 4.5, icon: '🏋️' },
  { id: 'cable_fly',           name: 'Cable Fly',                    muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: [],                        met: 4.0, icon: '💪' },
  { id: 'dumbbell_fly',        name: 'Dumbbell Fly',                 muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: [],                        met: 3.8, icon: '💪' },
  { id: 'pec_deck',            name: 'Pec Deck Machine',             muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'chest_press_machine', name: 'Chest Press Machine',          muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['triceps'],               met: 4.0, icon: '🏋️' },
  { id: 'pushup',              name: 'Push Up',                      muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['shoulders', 'triceps'],  met: 3.8, icon: '💪' },
  { id: 'wide_pushup',         name: 'Wide Grip Push Up',            muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['shoulders'],             met: 3.8, icon: '💪' },
  { id: 'diamond_pushup',      name: 'Diamond Push Up',              muscleGroup: 'Chest',    primaryMuscles: ['chest', 'triceps'],secondaryMuscles: [],                       met: 4.0, icon: '💪' },
  { id: 'decline_pushup',      name: 'Decline Push Up',              muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['shoulders'],             met: 4.0, icon: '💪' },
  { id: 'incline_pushup',      name: 'Incline Push Up',              muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'chest_dips',          name: 'Chest Dips',                   muscleGroup: 'Chest',    primaryMuscles: ['chest', 'triceps'],secondaryMuscles: ['shoulders'],            met: 4.2, icon: '🏋️' },
  { id: 'low_cable_fly',       name: 'Low Cable Fly',                muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: [],                        met: 3.8, icon: '💪' },
  { id: 'high_cable_fly',      name: 'High Cable Fly',               muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: [],                        met: 3.8, icon: '💪' },
  { id: 'landmine_press',      name: 'Landmine Press',               muscleGroup: 'Chest',    primaryMuscles: ['chest'],          secondaryMuscles: ['shoulders', 'triceps'],  met: 4.2, icon: '🏋️' },

  // ─────────────────────────── BACK ────────────────────────────────────────
  { id: 'conventional_dl',     name: 'Conventional Deadlift',        muscleGroup: 'Back',     primaryMuscles: ['lats', 'lowerBack'],secondaryMuscles: ['hamstrings', 'glutes'], met: 6.0, icon: '🏋️' },
  { id: 'romanian_dl',         name: 'Romanian Deadlift',            muscleGroup: 'Back',     primaryMuscles: ['lowerBack', 'hamstrings'],secondaryMuscles: ['glutes'],         met: 5.5, icon: '🏋️' },
  { id: 'sumo_deadlift',       name: 'Sumo Deadlift',                muscleGroup: 'Back',     primaryMuscles: ['lats', 'lowerBack'],secondaryMuscles: ['quads', 'glutes'],     met: 6.0, icon: '🏋️' },
  { id: 'stiff_leg_dl',        name: 'Stiff-Leg Deadlift',           muscleGroup: 'Back',     primaryMuscles: ['lowerBack', 'hamstrings'],secondaryMuscles: ['glutes'],         met: 5.0, icon: '🏋️' },
  { id: 'rack_pull',           name: 'Rack Pull',                    muscleGroup: 'Back',     primaryMuscles: ['lats', 'lowerBack'],secondaryMuscles: ['traps'],              met: 5.5, icon: '🏋️' },
  { id: 'pull_up',             name: 'Pull Up',                      muscleGroup: 'Back',     primaryMuscles: ['lats'],           secondaryMuscles: ['biceps'],               met: 5.0, icon: '💪' },
  { id: 'chin_up',             name: 'Chin Up',                      muscleGroup: 'Back',     primaryMuscles: ['lats'],           secondaryMuscles: ['biceps'],               met: 5.0, icon: '💪' },
  { id: 'neutral_grip_pullup', name: 'Neutral Grip Pull Up',         muscleGroup: 'Back',     primaryMuscles: ['lats'],           secondaryMuscles: ['biceps'],               met: 5.0, icon: '💪' },
  { id: 'wide_lat_pulldown',   name: 'Wide Grip Lat Pulldown',       muscleGroup: 'Back',     primaryMuscles: ['lats'],           secondaryMuscles: ['biceps'],               met: 4.5, icon: '🏋️' },
  { id: 'close_lat_pulldown',  name: 'Close Grip Lat Pulldown',      muscleGroup: 'Back',     primaryMuscles: ['lats'],           secondaryMuscles: ['biceps'],               met: 4.5, icon: '🏋️' },
  { id: 'reverse_lat_pulldown',name: 'Reverse Grip Lat Pulldown',    muscleGroup: 'Back',     primaryMuscles: ['lats'],           secondaryMuscles: ['biceps'],               met: 4.2, icon: '🏋️' },
  { id: 'seated_cable_row',    name: 'Seated Cable Row',             muscleGroup: 'Back',     primaryMuscles: ['lats', 'rhomboids'],secondaryMuscles: ['biceps'],             met: 4.5, icon: '🏋️' },
  { id: 'single_arm_db_row',   name: 'Single Arm Dumbbell Row',      muscleGroup: 'Back',     primaryMuscles: ['lats'],           secondaryMuscles: ['biceps'],               met: 4.5, icon: '🏋️' },
  { id: 'bent_over_row',       name: 'Bent-Over Barbell Row',        muscleGroup: 'Back',     primaryMuscles: ['lats', 'rhomboids'],secondaryMuscles: ['biceps', 'lowerBack'], met: 5.5, icon: '🏋️' },
  { id: 'pendlay_row',         name: 'Pendlay Row',                  muscleGroup: 'Back',     primaryMuscles: ['lats', 'rhomboids'],secondaryMuscles: ['biceps'],             met: 5.5, icon: '🏋️' },
  { id: 't_bar_row',           name: 'T-Bar Row',                    muscleGroup: 'Back',     primaryMuscles: ['lats', 'rhomboids'],secondaryMuscles: ['biceps'],             met: 5.0, icon: '🏋️' },
  { id: 'chest_supported_row', name: 'Chest Supported Row',          muscleGroup: 'Back',     primaryMuscles: ['rhomboids', 'lats'],secondaryMuscles: ['biceps'],             met: 4.0, icon: '🏋️' },
  { id: 'machine_row',         name: 'Machine Row',                  muscleGroup: 'Back',     primaryMuscles: ['lats', 'rhomboids'],secondaryMuscles: ['biceps'],             met: 4.0, icon: '🏋️' },
  { id: 'back_extension',      name: 'Back Extension',               muscleGroup: 'Back',     primaryMuscles: ['lowerBack'],      secondaryMuscles: ['glutes', 'hamstrings'], met: 3.8, icon: '💪' },
  { id: 'good_morning',        name: 'Good Morning',                 muscleGroup: 'Back',     primaryMuscles: ['lowerBack', 'hamstrings'],secondaryMuscles: ['glutes'],       met: 4.5, icon: '🏋️' },
  { id: 'straight_arm_pulldown',name: 'Straight Arm Pulldown',       muscleGroup: 'Back',     primaryMuscles: ['lats'],           secondaryMuscles: [],                       met: 3.8, icon: '💪' },

  // ─────────────────────────── LEGS ────────────────────────────────────────
  { id: 'barbell_squat',       name: 'Barbell Squat',                muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['hamstrings', 'calves'], met: 5.5, icon: '🏋️' },
  { id: 'front_squat',         name: 'Front Squat',                  muscleGroup: 'Legs',     primaryMuscles: ['quads'],          secondaryMuscles: ['glutes', 'calves'],      met: 5.5, icon: '🏋️' },
  { id: 'goblet_squat',        name: 'Goblet Squat',                 muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['calves'],               met: 5.0, icon: '🏋️' },
  { id: 'hack_squat',          name: 'Hack Squat Machine',           muscleGroup: 'Legs',     primaryMuscles: ['quads'],          secondaryMuscles: ['glutes', 'hamstrings'], met: 5.0, icon: '🏋️' },
  { id: 'smith_squat',         name: 'Smith Machine Squat',          muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['hamstrings'],           met: 5.0, icon: '🏋️' },
  { id: 'leg_press',           name: 'Leg Press',                    muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['hamstrings'],           met: 5.0, icon: '🏋️' },
  { id: 'bulgarian_split',     name: 'Bulgarian Split Squat',        muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['hamstrings'],           met: 5.5, icon: '🏋️' },
  { id: 'walking_lunge',       name: 'Walking Lunges',               muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['hamstrings', 'calves'], met: 4.5, icon: '🏃' },
  { id: 'reverse_lunge',       name: 'Reverse Lunge',                muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['hamstrings'],           met: 4.5, icon: '🏃' },
  { id: 'side_lunge',          name: 'Side Lunge',                   muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['hamstrings'],           met: 4.0, icon: '🏃' },
  { id: 'leg_extension',       name: 'Leg Extension',                muscleGroup: 'Legs',     primaryMuscles: ['quads'],          secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'lying_leg_curl',      name: 'Lying Hamstring Curl',         muscleGroup: 'Legs',     primaryMuscles: ['hamstrings'],     secondaryMuscles: ['calves'],               met: 4.0, icon: '💪' },
  { id: 'seated_leg_curl',     name: 'Seated Hamstring Curl',        muscleGroup: 'Legs',     primaryMuscles: ['hamstrings'],     secondaryMuscles: [],                        met: 3.8, icon: '💪' },
  { id: 'standing_calf_raise', name: 'Standing Calf Raise',          muscleGroup: 'Legs',     primaryMuscles: ['calves'],         secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'seated_calf_raise',   name: 'Seated Calf Raise',            muscleGroup: 'Legs',     primaryMuscles: ['calves'],         secondaryMuscles: [],                        met: 3.0, icon: '💪' },
  { id: 'leg_press_calf',      name: 'Leg Press Calf Raise',         muscleGroup: 'Legs',     primaryMuscles: ['calves'],         secondaryMuscles: [],                        met: 3.0, icon: '💪' },
  { id: 'step_up',             name: 'Step Up (Dumbbell)',            muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['hamstrings'],           met: 5.0, icon: '🏃' },
  { id: 'wall_sit',            name: 'Wall Sit',                     muscleGroup: 'Legs',     primaryMuscles: ['quads'],          secondaryMuscles: ['glutes'],               met: 3.5, icon: '💪' },
  { id: 'sissy_squat',         name: 'Sissy Squat',                  muscleGroup: 'Legs',     primaryMuscles: ['quads'],          secondaryMuscles: [],                        met: 4.0, icon: '💪' },
  { id: 'box_squat',           name: 'Box Squat',                    muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['hamstrings'],           met: 5.0, icon: '🏋️' },
  { id: 'sumo_squat',          name: 'Sumo Squat (Dumbbell)',         muscleGroup: 'Legs',     primaryMuscles: ['quads', 'glutes'],secondaryMuscles: ['hamstrings'],           met: 4.5, icon: '🏋️' },

  // ─────────────────────────── GLUTES ──────────────────────────────────────
  { id: 'barbell_hip_thrust',  name: 'Barbell Hip Thrust',           muscleGroup: 'Glutes',   primaryMuscles: ['glutes'],         secondaryMuscles: ['hamstrings'],           met: 4.8, icon: '🏋️' },
  { id: 'dumbbell_hip_thrust', name: 'Dumbbell Hip Thrust',          muscleGroup: 'Glutes',   primaryMuscles: ['glutes'],         secondaryMuscles: ['hamstrings'],           met: 4.5, icon: '🏋️' },
  { id: 'glute_bridge',        name: 'Glute Bridge',                 muscleGroup: 'Glutes',   primaryMuscles: ['glutes'],         secondaryMuscles: ['hamstrings'],           met: 3.8, icon: '💪' },
  { id: 'single_leg_thrust',   name: 'Single Leg Hip Thrust',        muscleGroup: 'Glutes',   primaryMuscles: ['glutes'],         secondaryMuscles: ['hamstrings'],           met: 4.0, icon: '💪' },
  { id: 'cable_kickback',      name: 'Cable Glute Kickback',         muscleGroup: 'Glutes',   primaryMuscles: ['glutes'],         secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'donkey_kick',         name: 'Donkey Kick',                  muscleGroup: 'Glutes',   primaryMuscles: ['glutes'],         secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'fire_hydrant',        name: 'Fire Hydrant',                 muscleGroup: 'Glutes',   primaryMuscles: ['glutes'],         secondaryMuscles: [],                        met: 3.0, icon: '💪' },
  { id: 'sumo_deadlift_glute', name: 'Sumo Deadlift (Glute Focus)',  muscleGroup: 'Glutes',   primaryMuscles: ['glutes'],         secondaryMuscles: ['hamstrings', 'quads'],  met: 5.5, icon: '🏋️' },
  { id: 'frog_pump',           name: 'Frog Pump',                    muscleGroup: 'Glutes',   primaryMuscles: ['glutes'],         secondaryMuscles: [],                        met: 3.0, icon: '💪' },
  { id: 'clamshell',           name: 'Clamshell',                    muscleGroup: 'Glutes',   primaryMuscles: ['glutes'],         secondaryMuscles: [],                        met: 2.8, icon: '💪' },
  { id: 'cable_pull_through', name: 'Cable Pull Through',            muscleGroup: 'Glutes',   primaryMuscles: ['glutes', 'hamstrings'],secondaryMuscles: [],                   met: 4.0, icon: '💪' },
  { id: 'rdl_single_leg',      name: 'Single Leg RDL',               muscleGroup: 'Glutes',   primaryMuscles: ['glutes', 'hamstrings'],secondaryMuscles: ['lowerBack'],         met: 4.5, icon: '🏋️' },

  // ─────────────────────────── ARMS — BICEPS ───────────────────────────────
  { id: 'barbell_curl',        name: 'Barbell Curl',                 muscleGroup: 'Arms',     primaryMuscles: ['biceps'],         secondaryMuscles: ['forearms'],             met: 3.5, icon: '💪' },
  { id: 'dumbbell_curl',       name: 'Dumbbell Bicep Curl',          muscleGroup: 'Arms',     primaryMuscles: ['biceps'],         secondaryMuscles: ['forearms'],             met: 3.5, icon: '💪' },
  { id: 'hammer_curl',         name: 'Hammer Curl',                  muscleGroup: 'Arms',     primaryMuscles: ['biceps'],         secondaryMuscles: ['forearms'],             met: 3.5, icon: '💪' },
  { id: 'incline_curl',        name: 'Incline Dumbbell Curl',        muscleGroup: 'Arms',     primaryMuscles: ['biceps'],         secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'concentration_curl',  name: 'Concentration Curl',           muscleGroup: 'Arms',     primaryMuscles: ['biceps'],         secondaryMuscles: [],                        met: 3.0, icon: '💪' },
  { id: 'preacher_curl',       name: 'Preacher Curl',                muscleGroup: 'Arms',     primaryMuscles: ['biceps'],         secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'cable_curl',          name: 'Cable Bicep Curl',             muscleGroup: 'Arms',     primaryMuscles: ['biceps'],         secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'reverse_curl',        name: 'Reverse Barbell Curl',         muscleGroup: 'Arms',     primaryMuscles: ['biceps'],         secondaryMuscles: ['forearms'],             met: 3.5, icon: '💪' },
  { id: 'spider_curl',         name: 'Spider Curl',                  muscleGroup: 'Arms',     primaryMuscles: ['biceps'],         secondaryMuscles: [],                        met: 3.0, icon: '💪' },
  { id: 'cross_body_hammer',   name: 'Cross Body Hammer Curl',       muscleGroup: 'Arms',     primaryMuscles: ['biceps'],         secondaryMuscles: ['forearms'],             met: 3.0, icon: '💪' },
  // TRICEPS
  { id: 'tricep_pushdown_rope',name: 'Tricep Rope Pushdown',         muscleGroup: 'Arms',     primaryMuscles: ['triceps'],        secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'tricep_pushdown_bar', name: 'Tricep Bar Pushdown',          muscleGroup: 'Arms',     primaryMuscles: ['triceps'],        secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'overhead_tricep_ext', name: 'Overhead Tricep Extension',    muscleGroup: 'Arms',     primaryMuscles: ['triceps'],        secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'skull_crusher',       name: 'Skull Crusher (EZ Bar)',       muscleGroup: 'Arms',     primaryMuscles: ['triceps'],        secondaryMuscles: [],                        met: 3.8, icon: '🏋️' },
  { id: 'close_grip_bench',    name: 'Close Grip Bench Press',       muscleGroup: 'Arms',     primaryMuscles: ['triceps'],        secondaryMuscles: ['chest'],                 met: 4.5, icon: '🏋️' },
  { id: 'tricep_dips',         name: 'Tricep Dips (Bench)',          muscleGroup: 'Arms',     primaryMuscles: ['triceps'],        secondaryMuscles: ['shoulders'],             met: 4.0, icon: '💪' },
  { id: 'tricep_kickback',     name: 'Dumbbell Tricep Kickback',     muscleGroup: 'Arms',     primaryMuscles: ['triceps'],        secondaryMuscles: [],                        met: 3.0, icon: '💪' },
  { id: 'cable_overhead_tri',  name: 'Cable Overhead Tricep Ext',   muscleGroup: 'Arms',     primaryMuscles: ['triceps'],        secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'single_arm_pushdown', name: 'Single Arm Cable Pushdown',   muscleGroup: 'Arms',     primaryMuscles: ['triceps'],        secondaryMuscles: [],                        met: 3.0, icon: '💪' },

  // ─────────────────────────── SHOULDERS ───────────────────────────────────
  { id: 'barbell_ohp',         name: 'Barbell Overhead Press',       muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: ['triceps'],               met: 5.0, icon: '🏋️' },
  { id: 'dumbbell_ohp',        name: 'Dumbbell Overhead Press',      muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: ['triceps'],               met: 4.8, icon: '🏋️' },
  { id: 'seated_ohp',          name: 'Seated Dumbbell Press',        muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: ['triceps'],               met: 4.5, icon: '🏋️' },
  { id: 'arnold_press',        name: 'Arnold Press',                 muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: ['triceps'],               met: 4.5, icon: '🏋️' },
  { id: 'smith_ohp',           name: 'Smith Machine Shoulder Press', muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: ['triceps'],               met: 4.5, icon: '🏋️' },
  { id: 'lateral_raise',       name: 'Lateral Raise',                muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: [],                        met: 4.0, icon: '💪' },
  { id: 'cable_lateral_raise', name: 'Cable Lateral Raise',          muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: [],                        met: 3.8, icon: '💪' },
  { id: 'front_raise',         name: 'Front Raise (Dumbbell)',       muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: [],                        met: 3.8, icon: '💪' },
  { id: 'barbell_front_raise', name: 'Front Raise (Barbell)',        muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: [],                        met: 4.0, icon: '🏋️' },
  { id: 'cable_front_raise',   name: 'Cable Front Raise',            muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: [],                        met: 3.8, icon: '💪' },
  { id: 'rear_delt_fly',       name: 'Rear Delt Fly',                muscleGroup: 'Shoulders',primaryMuscles: ['shoulders', 'rhomboids'],secondaryMuscles: [],                 met: 3.5, icon: '💪' },
  { id: 'face_pull',           name: 'Face Pull',                    muscleGroup: 'Shoulders',primaryMuscles: ['shoulders', 'rhomboids'],secondaryMuscles: [],                 met: 4.0, icon: '💪' },
  { id: 'upright_row',         name: 'Upright Row',                  muscleGroup: 'Shoulders',primaryMuscles: ['shoulders', 'traps'],secondaryMuscles: ['biceps'],             met: 4.5, icon: '🏋️' },
  { id: 'landmine_lateral',    name: 'Landmine Lateral Raise',       muscleGroup: 'Shoulders',primaryMuscles: ['shoulders'],      secondaryMuscles: [],                        met: 3.8, icon: '💪' },
  { id: 'machine_fly_rear',    name: 'Reverse Fly Machine',          muscleGroup: 'Shoulders',primaryMuscles: ['shoulders', 'rhomboids'],secondaryMuscles: [],                 met: 3.5, icon: '💪' },

  // ─────────────────────────── TRAPS (in Shoulders/Back) ───────────────────
  { id: 'barbell_shrug',       name: 'Barbell Shrug',                muscleGroup: 'Shoulders',primaryMuscles: ['traps'],          secondaryMuscles: [],                        met: 4.0, icon: '🏋️' },
  { id: 'dumbbell_shrug',      name: 'Dumbbell Shrug',               muscleGroup: 'Shoulders',primaryMuscles: ['traps'],          secondaryMuscles: [],                        met: 3.8, icon: '🏋️' },
  { id: 'cable_shrug',         name: 'Cable Shrug',                  muscleGroup: 'Shoulders',primaryMuscles: ['traps'],          secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'overhead_carry',      name: 'Overhead Carry (Barbell)',     muscleGroup: 'Shoulders',primaryMuscles: ['traps', 'shoulders'],secondaryMuscles: [],                      met: 5.0, icon: '🏋️' },

  // ─────────────────────────── CORE ────────────────────────────────────────
  { id: 'plank',               name: 'Plank',                        muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.5, icon: '🧘' },
  { id: 'side_plank',          name: 'Side Plank',                   muscleGroup: 'Core',     primaryMuscles: ['abs', 'obliques'],secondaryMuscles: [],                        met: 3.5, icon: '🧘' },
  { id: 'crunch',              name: 'Crunches',                     muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.5, icon: '🧘' },
  { id: 'bicycle_crunch',      name: 'Bicycle Crunch',               muscleGroup: 'Core',     primaryMuscles: ['abs', 'obliques'],secondaryMuscles: [],                        met: 4.0, icon: '🧘' },
  { id: 'reverse_crunch',      name: 'Reverse Crunch',               muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.5, icon: '🧘' },
  { id: 'hanging_leg_raise',   name: 'Hanging Leg Raise',            muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.8, icon: '💪' },
  { id: 'hanging_knee_raise',  name: 'Hanging Knee Raise',           muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'cable_crunch',        name: 'Cable Crunch',                 muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.8, icon: '💪' },
  { id: 'russian_twist',       name: 'Russian Twist',                muscleGroup: 'Core',     primaryMuscles: ['abs', 'obliques'],secondaryMuscles: [],                        met: 3.5, icon: '🧘' },
  { id: 'decline_crunch',      name: 'Decline Crunch',               muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.8, icon: '🧘' },
  { id: 'ab_wheel',            name: 'Ab Wheel Rollout',             muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: ['lats'],                  met: 4.0, icon: '💪' },
  { id: 'dead_bug',            name: 'Dead Bug',                     muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.0, icon: '🧘' },
  { id: 'mountain_climber',    name: 'Mountain Climbers',            muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: ['shoulders'],             met: 5.0, icon: '🏃' },
  { id: 'v_sit',               name: 'V-Sit Hold',                   muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.5, icon: '🧘' },
  { id: 'toe_touch',           name: 'Toe Touch Crunch',             muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.5, icon: '🧘' },
  { id: 'woodchop',            name: 'Cable Woodchop',               muscleGroup: 'Core',     primaryMuscles: ['obliques', 'abs'],secondaryMuscles: ['shoulders'],             met: 4.0, icon: '💪' },
  { id: 'dragon_flag',         name: 'Dragon Flag',                  muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: ['lats'],                  met: 5.0, icon: '💪' },
  { id: 'pallof_press',        name: 'Pallof Press',                 muscleGroup: 'Core',     primaryMuscles: ['abs', 'obliques'],secondaryMuscles: [],                        met: 3.5, icon: '💪' },
  { id: 'hollow_body',         name: 'Hollow Body Hold',             muscleGroup: 'Core',     primaryMuscles: ['abs'],            secondaryMuscles: [],                        met: 3.5, icon: '🧘' },

  // ─────────────────────────── FOREARMS ────────────────────────────────────
  { id: 'wrist_curl',          name: 'Wrist Curl (Barbell)',         muscleGroup: 'Forearms', primaryMuscles: ['forearms'],       secondaryMuscles: [],                        met: 2.8, icon: '💪' },
  { id: 'reverse_wrist_curl',  name: 'Reverse Wrist Curl',          muscleGroup: 'Forearms', primaryMuscles: ['forearms'],       secondaryMuscles: [],                        met: 2.8, icon: '💪' },
  { id: 'farmers_carry',       name: "Farmer's Carry",              muscleGroup: 'Forearms', primaryMuscles: ['forearms'],       secondaryMuscles: ['traps', 'shoulders'],     met: 5.0, icon: '🏋️' },
  { id: 'plate_pinch',         name: 'Plate Pinch',                 muscleGroup: 'Forearms', primaryMuscles: ['forearms'],       secondaryMuscles: [],                        met: 3.0, icon: '💪' },
  { id: 'finger_curl',         name: 'Barbell Finger Curl',         muscleGroup: 'Forearms', primaryMuscles: ['forearms'],       secondaryMuscles: [],                        met: 2.8, icon: '💪' },

  // ─────────────────────────── FULL BODY ───────────────────────────────────
  { id: 'power_clean',         name: 'Power Clean',                  muscleGroup: 'Full Body',primaryMuscles: ['quads', 'lats', 'shoulders'],secondaryMuscles: ['glutes', 'hamstrings'], met: 7.5, icon: '🏋️' },
  { id: 'clean_and_press',     name: 'Clean & Press',                muscleGroup: 'Full Body',primaryMuscles: ['quads', 'lats', 'shoulders'],secondaryMuscles: ['triceps', 'glutes'],    met: 8.0, icon: '🏋️' },
  { id: 'snatch',              name: 'Barbell Snatch',               muscleGroup: 'Full Body',primaryMuscles: ['quads', 'lats', 'shoulders'],secondaryMuscles: ['glutes', 'hamstrings'], met: 8.0, icon: '🏋️' },
  { id: 'kb_swing',            name: 'Kettlebell Swing',             muscleGroup: 'Full Body',primaryMuscles: ['glutes', 'hamstrings'],secondaryMuscles: ['lats', 'shoulders'],   met: 6.0, icon: '🏋️' },
  { id: 'kb_clean',            name: 'Kettlebell Clean',             muscleGroup: 'Full Body',primaryMuscles: ['glutes', 'lats'],  secondaryMuscles: ['shoulders'],              met: 6.0, icon: '🏋️' },
  { id: 'kb_press',            name: 'Kettlebell Press',             muscleGroup: 'Full Body',primaryMuscles: ['shoulders'],       secondaryMuscles: ['triceps', 'lats'],         met: 5.0, icon: '🏋️' },
  { id: 'kb_turkish_getup',    name: 'Turkish Get-Up',               muscleGroup: 'Full Body',primaryMuscles: ['shoulders', 'abs'],secondaryMuscles: ['glutes', 'quads'],         met: 5.5, icon: '🏋️' },
  { id: 'thruster',            name: 'Barbell Thruster',             muscleGroup: 'Full Body',primaryMuscles: ['quads', 'shoulders'],secondaryMuscles: ['glutes', 'triceps'],     met: 7.0, icon: '🏋️' },
  { id: 'burpee',              name: 'Burpee',                       muscleGroup: 'Full Body',primaryMuscles: ['quads', 'chest'],  secondaryMuscles: ['shoulders', 'abs'],       met: 7.0, icon: '🏃' },
  { id: 'bear_crawl',          name: 'Bear Crawl',                   muscleGroup: 'Full Body',primaryMuscles: ['shoulders', 'abs'],secondaryMuscles: ['quads'],                  met: 5.5, icon: '🏃' },
  { id: 'battle_rope',         name: 'Battle Ropes',                 muscleGroup: 'Full Body',primaryMuscles: ['shoulders', 'abs'],secondaryMuscles: ['quads', 'lats'],          met: 7.5, icon: '🏃' },
  { id: 'sandbag_carry',       name: 'Sandbag Carry',                muscleGroup: 'Full Body',primaryMuscles: ['quads', 'lats'],   secondaryMuscles: ['glutes', 'abs'],          met: 6.0, icon: '🏋️' },

  // ─────────────────────────── CARDIO ──────────────────────────────────────
  { id: 'treadmill_run',       name: 'Treadmill Run',                muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['quads', 'hamstrings'],secondaryMuscles: ['calves', 'glutes'],    met: 9.8,  icon: '🏃' },
  { id: 'treadmill_walk',      name: 'Treadmill Walk (Incline)',     muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['calves'],               met: 4.5,  icon: '🚶' },
  { id: 'elliptical',          name: 'Elliptical',                   muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'],           met: 5.5,  icon: '🏃' },
  { id: 'rowing_machine',      name: 'Rowing Machine',               muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['lats', 'quads'],   secondaryMuscles: ['shoulders', 'biceps'],  met: 7.0,  icon: '🚣' },
  { id: 'stationary_bike',     name: 'Stationary Bike',              muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'calves'], met: 7.0,  icon: '🚴' },
  { id: 'assault_bike',        name: 'Assault / Air Bike',           muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['quads', 'shoulders'],secondaryMuscles: ['hamstrings'],          met: 10.0, icon: '🚴' },
  { id: 'jump_rope',           name: 'Jump Rope',                    muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['calves'],          secondaryMuscles: ['shoulders'],            met: 11.0, icon: '🏃' },
  { id: 'jumping_jacks',       name: 'Jumping Jacks',                muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['quads', 'calves'], secondaryMuscles: ['shoulders'],            met: 8.0,  icon: '🏃' },
  { id: 'stair_climber',       name: 'Stair Climber Machine',        muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['calves', 'hamstrings'], met: 8.5,  icon: '🏃' },
  { id: 'box_jump',            name: 'Box Jump',                     muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['calves'],               met: 7.0,  icon: '🏃' },
  { id: 'jump_squat',          name: 'Jump Squat',                   muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['calves'],               met: 7.0,  icon: '🏃' },
  { id: 'ski_erg',             name: 'Ski Erg',                      muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['lats', 'shoulders'],secondaryMuscles: ['abs'],                  met: 8.5,  icon: '🏃' },
  { id: 'sprint',              name: 'Sprint Intervals',             muscleGroup: 'Cardio',   type: 'cardio', primaryMuscles: ['quads', 'hamstrings'],secondaryMuscles: ['glutes', 'calves'],   met: 14.0, icon: '🏃' },
];

/**
 * Calories burned per set — routes to correct formula based on exercise.type.
 * Cardio: uses duration (minutes). Strength: uses reps + weightLifted.
 */
export const calculateCaloriesPerSet = (exercise, userWeightKg, repsOrDuration, weightLifted = 0, activityLevel = 'sedentary') => {
  if (exercise.type === 'cardio') {
    return calcCaloriesCardio(exercise, userWeightKg, parseFloat(repsOrDuration) || 0, activityLevel);
  }
  return calcCaloriesAdvanced(exercise, userWeightKg, parseInt(repsOrDuration) || 0, weightLifted, activityLevel);
};

/**
 * Total calories across all COMPLETED sets — auto-detects exercise type.
 * Cardio sets use set.duration (minutes). Strength sets use set.reps + set.weight.
 */
export const calculateTotalCalories = (exercise, userWeightKg, sets, activityLevel = 'sedentary') =>
  calcExerciseTotal(exercise, userWeightKg, sets, activityLevel);
