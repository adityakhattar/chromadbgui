/**
 * Theme Utilities
 *
 * Helper functions to access CSS custom properties defined in styles/colors.css
 * This allows for centralized theme management - change colors.css to update the entire app
 */

/**
 * Get a CSS custom property value from the document root
 * Returns empty string if document is not available (SSR)
 */
function getCSSVariable(variableName: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

/**
 * Get a CSS custom property as a number (for animation durations, etc.)
 * Returns 0 if document is not available (SSR)
 */
function getCSSVariableAsNumber(variableName: string): number {
  if (typeof document === 'undefined') return 0;
  const value = getCSSVariable(variableName);
  return parseFloat(value) || 0;
}

/**
 * Chart colors array - pulls from CSS variables
 * Used for consistent chart coloring across the application
 * Falls back to default colors if CSS variables aren't loaded yet
 */
export function getChartColors(): string[] {
  // Default fallback colors matching the CSS variables
  const defaults = ['#06b6d4', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  if (typeof document === 'undefined') return defaults;

  const colors = [
    getCSSVariable('--color-chart-1'),
    getCSSVariable('--color-chart-2'),
    getCSSVariable('--color-chart-3'),
    getCSSVariable('--color-chart-4'),
    getCSSVariable('--color-chart-5'),
    getCSSVariable('--color-chart-6'),
    getCSSVariable('--color-chart-7'),
    getCSSVariable('--color-chart-8'),
  ];

  // If any color is empty, return defaults
  if (colors.some(c => !c)) return defaults;

  return colors;
}

/**
 * Animation duration values - pulls from CSS variables
 * Use these for Framer Motion animations
 * Falls back to default values if CSS variables aren't loaded yet
 */
export const animationDurations = {
  instant: () => getCSSVariableAsNumber('--anim-duration-instant') || 0.1,
  fast: () => getCSSVariableAsNumber('--anim-duration-fast') || 0.15,
  normal: () => getCSSVariableAsNumber('--anim-duration-normal') || 0.2,
  medium: () => getCSSVariableAsNumber('--anim-duration-medium') || 0.3,
  slow: () => getCSSVariableAsNumber('--anim-duration-slow') || 0.5,
};

/**
 * Animation delay values - pulls from CSS variables
 * Falls back to default values if CSS variables aren't loaded yet
 */
export const animationDelays = {
  none: () => getCSSVariableAsNumber('--anim-delay-none') || 0,
  tiny: () => getCSSVariableAsNumber('--anim-delay-tiny') || 0.05,
  small: () => getCSSVariableAsNumber('--anim-delay-small') || 0.1,
  medium: () => getCSSVariableAsNumber('--anim-delay-medium') || 0.2,
  large: () => getCSSVariableAsNumber('--anim-delay-large') || 0.3,
};

/**
 * Animation stagger values - pulls from CSS variables
 * Falls back to default values if CSS variables aren't loaded yet
 */
export const animationStagger = {
  items: () => getCSSVariableAsNumber('--anim-stagger-items') || 0.05,
  cards: () => getCSSVariableAsNumber('--anim-stagger-cards') || 0.1,
};

/**
 * Animation distances for slide effects - pulls from CSS variables
 */
export const animationDistances = {
  sm: () => getCSSVariable('--anim-distance-sm'),
  md: () => getCSSVariable('--anim-distance-md'),
  lg: () => getCSSVariable('--anim-distance-lg'),
};

/**
 * Hover effect values - pulls from CSS variables
 */
export const hoverEffects = {
  scale: () => getCSSVariableAsNumber('--anim-hover-scale'),
  scaleLarge: () => getCSSVariableAsNumber('--anim-hover-scale-large'),
  lift: () => getCSSVariable('--anim-hover-lift'),
  tapScale: () => getCSSVariableAsNumber('--anim-tap-scale'),
};

/**
 * Color values - pulls from CSS variables
 */
export const colors = {
  primary: () => getCSSVariable('--color-primary'),
  primaryHover: () => getCSSVariable('--color-primary-hover'),
  primaryLight: () => getCSSVariable('--color-primary-light'),
  primaryDark: () => getCSSVariable('--color-primary-dark'),

  success: () => getCSSVariable('--color-success'),
  warning: () => getCSSVariable('--color-warning'),
  error: () => getCSSVariable('--color-error'),
  info: () => getCSSVariable('--color-info'),
};
