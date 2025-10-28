# ChromaGUI Customization Guide

This guide explains how to customize the theme, colors, and styling of your ChromaGUI application.

## Table of Contents
- [Overview](#overview)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Quick Customization Examples](#quick-customization-examples)
- [Testing Your Changes](#testing-your-changes)

---

## Overview

ChromaGUI uses a **centralized theme system** with CSS custom properties (variables) that make it easy to customize all colors, typography, and spacing from a single location.

### Key Files
- `frontend/src/styles/colors.css` - All theme variables (colors, typography, spacing)
- `frontend/.env` - Environment variables for theme colors
- `frontend/tailwind.config.cjs` - Tailwind configuration that references CSS variables
- `frontend/src/styles/theme.ts` - TypeScript theme access

---

## Color System

All colors are defined in `frontend/src/styles/colors.css` as CSS custom properties.

### Primary & Accent Colors

Change the main brand colors by editing these variables in `colors.css`:

```css
:root {
  /* Primary Colors - Main brand color */
  --color-primary: #06b6d4;              /* Cyan-500 */
  --color-primary-hover: #0891b2;        /* Darker on hover */
  --color-primary-light: #67e8f9;        /* Lighter variant */
  --color-primary-dark: #0e7490;         /* Darker variant */

  /* Accent Colors - Secondary brand color */
  --color-accent: #3b82f6;               /* Blue-500 */
  --color-accent-secondary: #8b5cf6;     /* Purple-500 */
  --color-accent-dark: #1e40af;          /* Darker accent */
  --color-accent-light: #93c5fd;         /* Lighter accent */
}
```

### Background Colors

Customize the background colors:

```css
:root {
  /* Background Colors */
  --color-bg-main: #09090b;              /* Zinc-950 - Main background */
  --color-bg-dark: #18181b;              /* Zinc-900 - Dark panels */
  --color-bg-card: #27272a;              /* Zinc-800 - Cards/inputs */
  --color-bg-hover: #3f3f46;             /* Zinc-700 - Hover states */
}
```

### Text Colors

Adjust text colors for different levels of emphasis:

```css
:root {
  /* Text Colors */
  --color-text-primary: #fafafa;         /* Zinc-50 - Primary text (white) */
  --color-text-secondary: #d4d4d8;       /* Zinc-300 - Secondary text */
  --color-text-tertiary: #a1a1aa;        /* Zinc-400 - Tertiary/muted text */
  --color-text-disabled: #71717a;        /* Zinc-500 - Disabled text */
}
```

### Status Colors

Change success, warning, error, and info colors:

```css
:root {
  /* Status Colors */
  --color-success: #22c55e;              /* Green-500 */
  --color-success-bg: #16a34a;           /* Green-600 */
  --color-warning: #eab308;              /* Yellow-500 */
  --color-warning-bg: #ca8a04;           /* Yellow-600 */
  --color-error: #ef4444;                /* Red-500 */
  --color-error-bg: #dc2626;             /* Red-600 */
  --color-info: #3b82f6;                 /* Blue-500 */
  --color-info-bg: #2563eb;              /* Blue-600 */
}
```

---

## Typography

### Font Families

Change fonts by updating these variables:

```css
:root {
  /* Typography - Font Families */
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
}
```

To use custom fonts:
1. Add font files to `frontend/src/fonts/`
2. Define `@font-face` in `frontend/src/index.css`
3. Update `--font-primary` or `--font-mono` variables

### Font Sizes

Adjust font sizes for different elements:

```css
:root {
  /* Typography - Font Sizes */
  --font-size-xs: 0.75rem;      /* 12px */
  --font-size-sm: 0.875rem;     /* 14px */
  --font-size-base: 1rem;       /* 16px */
  --font-size-lg: 1.125rem;     /* 18px */
  --font-size-xl: 1.25rem;      /* 20px */
  --font-size-2xl: 1.5rem;      /* 24px */
  --font-size-3xl: 1.875rem;    /* 30px */
  --font-size-4xl: 2.25rem;     /* 36px */
}
```

### Font Weights

Customize font weights:

```css
:root {
  /* Typography - Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

---

## Spacing & Layout

### Border Radius

Adjust corner roundness:

```css
:root {
  /* Border Radius */
  --radius-sm: 0.25rem;         /* 4px */
  --radius-md: 0.5rem;          /* 8px */
  --radius-lg: 0.75rem;         /* 12px */
  --radius-xl: 1rem;            /* 16px */
  --radius-2xl: 1.5rem;         /* 24px */
  --radius-full: 9999px;        /* Fully rounded */
}
```

### Shadows

Customize shadow depths:

```css
:root {
  /* Shadow Values */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* Glow shadows for hover effects */
  --shadow-glow: 0 0 20px rgba(6, 182, 212, 0.3);
  --shadow-glow-hover: 0 0 30px rgba(6, 182, 212, 0.5);
}
```

### Transitions

Adjust animation speeds:

```css
:root {
  /* Transition Durations */
  --transition-fast: 150ms;
  --transition-normal: 200ms;
  --transition-slow: 300ms;
}
```

---

## Quick Customization Examples

### Example 1: Change Primary Color to Purple

In `frontend/src/styles/colors.css`:

```css
:root {
  --color-primary: #a855f7;              /* Purple-500 */
  --color-primary-hover: #9333ea;        /* Purple-600 */
  --color-primary-light: #c084fc;        /* Purple-400 */
  --color-primary-dark: #7e22ce;         /* Purple-700 */
}
```

**Result**: All buttons, links, highlights, and accent colors will now be purple!

### Example 2: Light Theme

To create a light theme, change background and text colors:

```css
:root {
  /* Light Background Colors */
  --color-bg-main: #ffffff;              /* White */
  --color-bg-dark: #f9fafb;              /* Gray-50 */
  --color-bg-card: #f3f4f6;              /* Gray-100 */
  --color-bg-hover: #e5e7eb;             /* Gray-200 */

  /* Light Text Colors */
  --color-text-primary: #111827;         /* Gray-900 - Dark text */
  --color-text-secondary: #4b5563;       /* Gray-600 */
  --color-text-tertiary: #6b7280;        /* Gray-500 */
  --color-text-disabled: #9ca3af;        /* Gray-400 */

  /* Light Border Colors */
  --color-border: #e5e7eb;               /* Gray-200 */
  --color-border-light: #f3f4f6;         /* Gray-100 */
  --color-border-dark: #d1d5db;          /* Gray-300 */
}
```

### Example 3: Increase Border Radius (More Rounded)

```css
:root {
  --radius-sm: 0.5rem;          /* 8px instead of 4px */
  --radius-md: 0.75rem;         /* 12px instead of 8px */
  --radius-lg: 1rem;            /* 16px instead of 12px */
  --radius-xl: 1.5rem;          /* 24px instead of 16px */
}
```

### Example 4: Change Font to Inter

1. Add Inter font link to `frontend/index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

2. Update font variable in `colors.css`:
```css
:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

---

## Testing Your Changes

### 1. Local Development

After making changes:

```bash
cd frontend
npm run start
```

The app will hot-reload with your new theme!

### 2. Verify Changes

Check these areas to ensure your theme is applied correctly:

- **Sidebar** - Check background and hover colors
- **Buttons** - Check primary color and hover states
- **Cards** - Check background and border colors
- **Text** - Check readability with new text colors
- **Status indicators** - Check success/warning/error colors
- **Forms** - Check input backgrounds and focus states

### 3. Browser Testing

Test in different browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari

### 4. Responsive Testing

Test on different screen sizes:
- Desktop: 1920x1080 (primary)
- Laptop: 1366x768 (secondary)
- Tablet: 768x1024
- Mobile: 375x667

---

## Using Tailwind Classes

After defining CSS variables, you can use them in Tailwind classes:

```tsx
// Primary colors
<button className="bg-primary hover:bg-primary-hover">
  Click Me
</button>

// Background colors
<div className="bg-card border border-DEFAULT">
  Card Content
</div>

// Text colors
<p className="text-primary">Primary text</p>
<p className="text-secondary">Secondary text</p>

// Status colors
<span className="text-status-success">Success</span>
<span className="text-status-error">Error</span>
```

---

## Environment Variables (Optional)

You can also define theme colors in `frontend/.env` and read them in TypeScript:

```env
# Primary Colors
VITE_THEME_PRIMARY=#06b6d4
VITE_THEME_PRIMARY_HOVER=#0891b2

# Background Colors
VITE_THEME_BG_MAIN=#09090b
VITE_THEME_BG_DARK=#18181b
```

Then access in TypeScript:

```typescript
import { theme } from '@/styles/theme';

const primaryColor = theme.colors.primary.default; // '#06b6d4'
```

---

## Need Help?

- **Documentation**: Check `STYLING_GUIDE.md` for complete color reference
- **Issues**: Report bugs or request features on GitHub
- **Community**: Join discussions in GitHub Discussions

---

## Best Practices

1. **Always test changes locally** before deploying
2. **Maintain color contrast** for accessibility (WCAG 2.1 AA minimum)
3. **Use semantic naming** - prefer `--color-primary` over `--color-blue`
4. **Keep backups** - save your original `colors.css` before major changes
5. **Document your changes** - note custom colors for future reference

---

## Summary

ChromaGUI's theme system is designed for easy customization:

- ✅ All colors in one place (`colors.css`)
- ✅ CSS variables for instant updates
- ✅ Tailwind integration for utility classes
- ✅ TypeScript support for type-safe access
- ✅ Environment variable support
- ✅ No build step required for color changes

Happy customizing! 🎨
