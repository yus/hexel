// static/js/utils/constants.js
export const HEXEL_SIZE = 24.0; // Force float with .0

// Force ALL derived values to be floats by using .0 in calculations
export const H_STEP = HEXEL_SIZE * 2.0;           // 48.0 - horizontal spacing
export const V_STEP = HEXEL_SIZE * 1.73205080757; // 41.569... - already float

export const SQRT3 = 1.73205080757;
export const TAU = 6.28318530718;

// Grid colors as vec3 components
export const GRID_COLOR_R = 0.784;
export const GRID_COLOR_G = 0.576;
export const GRID_COLOR_B = 0.824;

// Line widths as floats
export const GRID_LINE_WIDTH = Math.max(1.0, HEXEL_SIZE / 24.0);
export const POINT_SIZE = HEXEL_SIZE / 3.0;
