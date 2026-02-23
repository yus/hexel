// static/js/utils/constants.js
export const HEXEL_SIZE = 24; // Base unit - everything derives from this!

export const H_STEP = HEXEL_SIZE * 2;           // 48 - horizontal spacing
export const V_STEP = HEXEL_SIZE * 1.7320508;    // ~41.569 - vertical spacing (sqrt(3) * size)

export const SQRT3 = 1.73205080757;
export const TAU = 6.28318530718;

// Grid colors
export const GRID_COLOR = '#c893d2';
export const DEFAULT_POINT_COLOR = '#ffaa66';

// Line widths based on HEXEL_SIZE
export const GRID_LINE_WIDTH = Math.max(1, HEXEL_SIZE / 24);
export const POINT_SIZE = HEXEL_SIZE / 3;
