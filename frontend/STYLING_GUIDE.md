# ChromaGUI Styling Guide

## Overview
This guide provides a comprehensive reference for all colors, styles, and design patterns used in ChromaGUI. All colors are centralized and configurable via environment variables.

## Table of Contents
1. [Color System](#color-system)
2. [Component Patterns](#component-patterns)
3. [Usage Examples](#usage-examples)
4. [Environment Configuration](#environment-configuration)

---

## Color System

### Primary Colors
**Purpose**: Interactive elements, buttons, links, active states

| Usage | Environment Variable | Default Value | Tailwind Class |
|-------|---------------------|---------------|----------------|
| Primary accent | `VITE_THEME_PRIMARY` | #06b6d4 (Cyan-500) | `bg-cyan-500` |
| Primary hover | `VITE_THEME_PRIMARY_HOVER` | #0891b2 (Cyan-600) | `bg-cyan-600` |
| Light accent | `VITE_THEME_PRIMARY_LIGHT` | #67e8f9 (Cyan-300) | `bg-cyan-300` |

**Where used**:
- Primary buttons (`bg-cyan-500 hover:bg-cyan-600`)
- Links and interactive text (`text-cyan-400`)
- Active/selected states (`border-cyan-500/50`)
- Icons and accents
- "See inside!" labels
- Sort dropdowns on focus
- AI Search button
- Progress indicators

---

### Background Colors
**Purpose**: Page backgrounds, panels, cards, inputs

| Usage | Environment Variable | Default Value | Tailwind Class |
|-------|---------------------|---------------|----------------|
| Main background | `VITE_THEME_BG_MAIN` | #09090b (Zinc-950) | `bg-zinc-950` |
| Dark panels | `VITE_THEME_BG_DARK` | #18181b (Zinc-900) | `bg-zinc-900` |
| Cards/inputs | `VITE_THEME_BG_CARD` | #27272a (Zinc-800) | `bg-zinc-800` |
| Hover state | `VITE_THEME_BG_HOVER` | #3f3f46 (Zinc-700) | `bg-zinc-700` |

**Where used**:
- **Main background**: Body, root container
- **Dark panels**: Modals, sticky headers, sidebars
- **Cards**: Collection cards, document cards, input fields, dropdowns, select boxes
- **Hover**: Card hover states, dropdown hover, button hover

**Component mapping**:
```tsx
// Page wrapper
<body className="bg-zinc-950">  // Main background

// Modal backdrop + content
<div className="bg-black/70">  // Backdrop
  <div className="bg-zinc-900">  // Modal content

// Cards
<div className="bg-zinc-800 hover:bg-zinc-700">  // Interactive card

// Inputs
<input className="bg-zinc-800" />  // Form inputs
```

---

### Text Colors
**Purpose**: All text content with hierarchy

| Usage | Environment Variable | Default Value | Tailwind Class |
|-------|---------------------|---------------|----------------|
| Primary text | `VITE_THEME_TEXT_PRIMARY` | #fafafa (Zinc-50) | `text-white` |
| Secondary text | `VITE_THEME_TEXT_SECONDARY` | #d4d4d8 (Zinc-300) | `text-gray-300` |
| Muted text | `VITE_THEME_TEXT_MUTED` | #a1a1aa (Zinc-400) | `text-gray-400` |
| Disabled text | `VITE_THEME_TEXT_DISABLED` | #71717a (Zinc-500) | `text-gray-500` |

**Where used**:
- **Primary**: Headings, labels, important text (`text-white`)
- **Secondary**: Body text, descriptions (`text-gray-300`)
- **Muted**: Placeholders, helper text, icons (`text-gray-400`)
- **Disabled**: Disabled form elements (`text-gray-500`)

**Component mapping**:
```tsx
<h1 className="text-white">Heading</h1>                    // Primary
<p className="text-gray-300">Description</p>               // Secondary
<input placeholder="..." className="placeholder-gray-400"> // Muted
<button disabled className="text-gray-500">Disabled</button> // Disabled
```

---

### Border Colors
**Purpose**: Borders, dividers, outlines

| Usage | Environment Variable | Default Value | Tailwind Class |
|-------|---------------------|---------------|----------------|
| Default border | `VITE_THEME_BORDER_DEFAULT` | #ffffff1a (White 10%) | `border-white/10` |
| Hover border | `VITE_THEME_BORDER_HOVER` | #06b6d480 (Cyan 50%) | `border-cyan-500/50` |
| Focus border | `VITE_THEME_BORDER_FOCUS` | #06b6d480 (Cyan 50%) | `border-cyan-500/50` |

**Where used**:
- **Default**: Cards, inputs, modals (`border border-white/10`)
- **Hover**: Interactive cards on hover (`hover:border-cyan-500/50`)
- **Focus**: Input fields on focus (`focus:border-cyan-500/50`)

---

### Status Colors
**Purpose**: Feedback, alerts, notifications

| Usage | Environment Variable | Default Value | Tailwind Class |
|-------|---------------------|---------------|----------------|
| Success | `VITE_THEME_SUCCESS` | #22c55e (Green-500) | `text-green-500` or `bg-green-500` |
| Error | `VITE_THEME_ERROR` | #ef4444 (Red-500) | `text-red-400` or `bg-red-500` |
| Warning | `VITE_THEME_WARNING` | #f59e0b (Amber-500) | `text-amber-500` or `bg-amber-500` |
| Info | `VITE_THEME_INFO` | #3b82f6 (Blue-500) | `text-blue-500` or `bg-blue-500` |

**Where used**:
- **Success**: Success toasts, checkmarks, "created successfully"
- **Error**: Error messages, delete buttons, validation errors
- **Warning**: Warning messages, caution states
- **Info**: Info messages, tooltips

**Component mapping**:
```tsx
<div className="text-green-500">✓ Success!</div>           // Success
<div className="text-red-400">✗ Error occurred</div>       // Error
<button className="bg-red-500 hover:bg-red-600">Delete</button>  // Danger button
```

---

### Shadow Colors
**Purpose**: Glows, elevation, depth

| Usage | Environment Variable | Default Value | Description |
|-------|---------------------|---------------|-------------|
| Glow effect | `VITE_THEME_SHADOW_GLOW` | #06b6d41a (Cyan 10%) | Subtle glow |
| Hover glow | `VITE_THEME_SHADOW_GLOW_HOVER` | #06b6d433 (Cyan 20%) | Stronger glow |

**Where used**:
- Collection card hover: `hover:shadow-lg hover:shadow-cyan-500/10`
- Focused inputs: `focus:shadow-cyan-500/10`
- Active buttons: `shadow-cyan-500/20`

---

## Component Patterns

### Buttons

#### Primary Button
```tsx
<button className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-white transition-all hover:bg-cyan-600">
  <svg className="h-5 w-5">...</svg>
  Button Text
</button>
```
**Used in**: "New" button, "Create" button, primary actions

#### Secondary Button
```tsx
<button className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white transition-all hover:border-white/20">
  Cancel
</button>
```
**Used in**: Cancel buttons, secondary actions

#### Danger Button
```tsx
<button className="rounded-lg bg-red-500 px-4 py-2 text-white transition-all hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
  Delete
</button>
```
**Used in**: Delete confirmations, destructive actions

---

### Cards

#### Collection Card
```tsx
<div className="relative group cursor-pointer rounded-lg border border-white/10 bg-zinc-800 p-4 transition-all hover:border-cyan-500/50 hover:bg-zinc-700 hover:shadow-lg hover:shadow-cyan-500/10">
  {/* Content */}
</div>
```
**Features**:
- Default state: `border-white/10 bg-zinc-800`
- Hover: `border-cyan-500/50 bg-zinc-700`
- Glow effect: `shadow-cyan-500/10`
- Cursor: `cursor-pointer`
- Group for child animations: `group`

#### Document Card
```tsx
<div className="cursor-pointer rounded-lg border border-white/10 bg-zinc-800 p-4 transition-all hover:border-cyan-500/50 hover:bg-zinc-700">
  {/* Content */}
</div>
```

---

### Inputs

#### Text Input
```tsx
<input
  type="text"
  className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:outline-none"
  placeholder="Placeholder text..."
/>
```
**States**:
- Default: `border-white/10`
- Focus: `focus:border-cyan-500/50`
- Error: `border-red-500/50`

#### Select/Dropdown
```tsx
<select className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 pr-10 text-white text-sm appearance-none cursor-pointer transition-all hover:border-cyan-500/50 focus:border-cyan-500/50 focus:outline-none">
  <option>Option 1</option>
</select>
```

---

### Modals

#### Modal Structure
```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
  {/* Modal content */}
  <div className="max-w-md w-full rounded-lg border border-white/10 bg-zinc-900 p-6 m-4">
    <h3 className="text-xl font-semibold text-white mb-4">Modal Title</h3>
    {/* Content */}
  </div>
</div>
```
**Features**:
- Backdrop: `bg-black/70` (70% opacity black)
- Content: `bg-zinc-900 border border-white/10`
- Centered: `flex items-center justify-center`
- Z-index: `z-50`

---

### Search Bars

```tsx
<div className="flex-1 relative">
  <input
    type="text"
    placeholder="Search..."
    className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 pl-10 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:outline-none"
  />
  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400">...</svg>
</div>
```

---

### Animations

#### Fade In + Slide
```tsx
<p className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
  See inside! →
</p>
```
**Used in**: Collection card "See inside!" label

#### Smooth Transitions
```tsx
className="transition-all duration-300"  // All properties
className="transition-colors"            // Colors only
className="transition-transform"         // Transform only
```

---

## Environment Configuration

### Setup (.env file)
```env
# Primary Colors
VITE_THEME_PRIMARY="#06b6d4"
VITE_THEME_PRIMARY_HOVER="#0891b2"
VITE_THEME_PRIMARY_LIGHT="#67e8f9"

# Background Colors
VITE_THEME_BG_MAIN="#09090b"
VITE_THEME_BG_DARK="#18181b"
VITE_THEME_BG_CARD="#27272a"
VITE_THEME_BG_HOVER="#3f3f46"

# Text Colors
VITE_THEME_TEXT_PRIMARY="#fafafa"
VITE_THEME_TEXT_SECONDARY="#d4d4d8"
VITE_THEME_TEXT_MUTED="#a1a1aa"
VITE_THEME_TEXT_DISABLED="#71717a"

# Border Colors
VITE_THEME_BORDER_DEFAULT="#ffffff1a"
VITE_THEME_BORDER_HOVER="#06b6d480"
VITE_THEME_BORDER_FOCUS="#06b6d480"

# Status Colors
VITE_THEME_SUCCESS="#22c55e"
VITE_THEME_ERROR="#ef4444"
VITE_THEME_WARNING="#f59e0b"
VITE_THEME_INFO="#3b82f6"

# Shadow Colors
VITE_THEME_SHADOW_GLOW="#06b6d41a"
VITE_THEME_SHADOW_GLOW_HOVER="#06b6d433"
```

### Using Theme in Code
```tsx
import { theme } from '@/styles/theme';

// Access colors
const primaryColor = theme.colors.primary.default;
const bgColor = theme.colors.bg.main;
```

---

## Quick Reference

### Most Common Combinations

**Primary Button**:
```tsx
bg-cyan-500 hover:bg-cyan-600 text-white
```

**Secondary Button**:
```tsx
border border-white/10 bg-zinc-800 hover:border-white/20 text-white
```

**Card**:
```tsx
border border-white/10 bg-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-700
```

**Card with Glow**:
```tsx
border border-white/10 bg-zinc-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10
```

**Input**:
```tsx
border border-white/10 bg-zinc-800 text-white placeholder-gray-400 focus:border-cyan-500/50
```

**Modal Backdrop**:
```tsx
bg-black/70
```

**Modal Content**:
```tsx
border border-white/10 bg-zinc-900
```

---

## Notes
- All color values support hex codes with opacity (e.g., `#06b6d480` = 50% opacity)
- Tailwind classes are preferred over inline styles for consistency
- Use `transition-all` for smooth state changes
- Group parent elements with `group` class to enable child hover effects (`group-hover:`)
