/**
 * ChromaGUI Theme Configuration
 *
 * This file provides a centralized theme configuration for the entire application.
 * All colors are configurable via environment variables in .env file.
 *
 * Usage:
 * import { theme } from '@/styles/theme';
 * <div className={`bg-[${theme.colors.bg.main}]`}>
 *
 * Or use the provided utility classes (recommended):
 * <div className="bg-theme-main text-theme-primary">
 */

// Read theme colors from environment variables with fallbacks
const env = import.meta.env;

export const theme = {
  colors: {
    // Primary Colors - Used for main interactive elements, buttons, links
    primary: {
      default: env.VITE_THEME_PRIMARY || '#06b6d4',
      hover: env.VITE_THEME_PRIMARY_HOVER || '#0891b2',
      light: env.VITE_THEME_PRIMARY_LIGHT || '#67e8f9',
    },

    // Background Colors - Used for page backgrounds, cards, inputs
    bg: {
      main: env.VITE_THEME_BG_MAIN || '#09090b',      // Main page background
      dark: env.VITE_THEME_BG_DARK || '#18181b',      // Panels, modals, sticky headers
      card: env.VITE_THEME_BG_CARD || '#27272a',      // Cards, inputs, dropdowns
      hover: env.VITE_THEME_BG_HOVER || '#3f3f46',    // Hover states on cards/buttons
    },

    // Text Colors - Used for all text content
    text: {
      primary: env.VITE_THEME_TEXT_PRIMARY || '#fafafa',       // Main text (white)
      secondary: env.VITE_THEME_TEXT_SECONDARY || '#d4d4d8',   // Secondary text
      muted: env.VITE_THEME_TEXT_MUTED || '#a1a1aa',          // Muted/placeholder text
      disabled: env.VITE_THEME_TEXT_DISABLED || '#71717a',     // Disabled text
    },

    // Border Colors - Used for borders, dividers, outlines
    border: {
      default: env.VITE_THEME_BORDER_DEFAULT || '#ffffff1a',   // Default borders (white 10%)
      hover: env.VITE_THEME_BORDER_HOVER || '#06b6d480',       // Hover borders (cyan 50%)
      focus: env.VITE_THEME_BORDER_FOCUS || '#06b6d480',       // Focus borders (cyan 50%)
    },

    // Status Colors - Used for alerts, notifications, feedback
    status: {
      success: env.VITE_THEME_SUCCESS || '#22c55e',   // Success messages, checkmarks
      error: env.VITE_THEME_ERROR || '#ef4444',       // Error messages, alerts
      warning: env.VITE_THEME_WARNING || '#f59e0b',   // Warning messages
      info: env.VITE_THEME_INFO || '#3b82f6',         // Info messages
    },

    // Shadow Colors - Used for box shadows, glows
    shadow: {
      glow: env.VITE_THEME_SHADOW_GLOW || '#06b6d41a',           // Glow effect (cyan 10%)
      glowHover: env.VITE_THEME_SHADOW_GLOW_HOVER || '#06b6d433', // Hover glow (cyan 20%)
    },
  },
} as const;

/**
 * Color Usage Guide
 *
 * PRIMARY COLORS (theme.colors.primary.*)
 * - Buttons: bg-[theme.colors.primary.default] hover:bg-[theme.colors.primary.hover]
 * - Links: text-[theme.colors.primary.default]
 * - Active states: border-[theme.colors.primary.default]
 *
 * BACKGROUND COLORS (theme.colors.bg.*)
 * - Page background: bg-[theme.colors.bg.main]
 * - Modals/panels: bg-[theme.colors.bg.dark]
 * - Cards/inputs: bg-[theme.colors.bg.card]
 * - Hover states: hover:bg-[theme.colors.bg.hover]
 *
 * TEXT COLORS (theme.colors.text.*)
 * - Headings: text-[theme.colors.text.primary]
 * - Body text: text-[theme.colors.text.secondary]
 * - Placeholders: text-[theme.colors.text.muted]
 * - Disabled: text-[theme.colors.text.disabled]
 *
 * BORDER COLORS (theme.colors.border.*)
 * - Default: border-[theme.colors.border.default]
 * - Hover: hover:border-[theme.colors.border.hover]
 * - Focus: focus:border-[theme.colors.border.focus]
 *
 * STATUS COLORS (theme.colors.status.*)
 * - Success messages: text-[theme.colors.status.success] or bg-[theme.colors.status.success]
 * - Error messages: text-[theme.colors.status.error]
 * - Warning messages: text-[theme.colors.status.warning]
 * - Info messages: text-[theme.colors.status.info]
 *
 * SHADOW COLORS (theme.colors.shadow.*)
 * - Glow effect: shadow-[theme.colors.shadow.glow]
 * - Hover glow: hover:shadow-[theme.colors.shadow.glowHover]
 */

/**
 * Common Class Combinations
 *
 * BUTTONS:
 * Primary: `bg-cyan-500 hover:bg-cyan-600 text-white`
 * Secondary: `border border-white/10 bg-zinc-800 hover:border-white/20 text-white`
 * Danger: `bg-red-500 hover:bg-red-600 text-white`
 *
 * CARDS:
 * Default: `border border-white/10 bg-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-700`
 * With Glow: `border border-white/10 bg-zinc-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10`
 *
 * INPUTS:
 * Default: `border border-white/10 bg-zinc-800 text-white placeholder-gray-400 focus:border-cyan-500/50`
 * Error: `border border-red-500/50 bg-zinc-800 text-white`
 *
 * MODALS:
 * Backdrop: `bg-black/70`
 * Content: `border border-white/10 bg-zinc-900`
 */

export default theme;
