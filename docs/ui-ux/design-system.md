# PropCRM Production Design System & UI Contract

## 1. Product Vision & Design Principles
PropCRM is a professional rental-property CRM and communication intelligence operating system designed for brokers and property professionals.

### Principles:
1. **Operational Calm & Clarity**: High-density information presentation without visual clutter.
2. **Trust & Transparency**: Explicit distinction between AI extractions (`Confidence %`) and human-verified facts (`✓ Verified`).
3. **Deterministic Score Explainability**: Match scores display explicit weighted criteria breakdowns rather than black-box AI scores.
4. **Scannability First**: Tables and list views prioritize high-density data scannability over oversized decorative cards.
5. **Purpose-Built Real Estate Identity**: Forest Green primary palette paired with warm stone and slate neutral tones.

---

## 2. Color System & Design Tokens
All color custom properties are defined centrally and exposed via CSS variables and Tailwind extensions:

```css
:root {
  /* Surface & Backgrounds */
  --bg-app: #f8fafc;            /* slate-50 */
  --surface: #ffffff;           /* pure white */
  --surface-muted: #f1f5f9;     /* slate-100 */
  --surface-dark: #0f172a;      /* slate-900 */
  --border: #e2e8f0;           /* slate-200 */
  --border-subtle: #f1f5f9;    /* slate-100 */

  /* Primary Identity — Forest / Emerald Green */
  --primary: #059669;          /* emerald-600 */
  --primary-hover: #047857;    /* emerald-700 */
  --primary-active: #065f46;   /* emerald-800 */
  --primary-light: #ecfdf5;    /* emerald-50 */
  --primary-border: #a7f3d0;   /* emerald-200 */

  /* Text Colors */
  --text-primary: #0f172a;     /* slate-900 */
  --text-secondary: #475569;   /* slate-600 */
  --text-muted: #94a3b8;       /* slate-400 */
  --text-inverse: #ffffff;

  /* Semantic Feedback Tokens */
  --success: #10b981;          /* emerald-500 */
  --success-bg: #ecfdf5;       /* emerald-50 */
  --warning: #d97706;          /* amber-600 */
  --warning-bg: #fffbeb;       /* amber-50 */
  --danger: #e11d48;           /* rose-600 */
  --danger-bg: #fff1f2;        /* rose-50 */
  --info: #0284c7;             /* sky-600 */
  --info-bg: #f0f9ff;          /* sky-50 */
}
```

---

## 3. Typography & Spacing Scale
- **Primary Font Family**: Inter, system-ui, -apple-system, sans-serif.
- **Monospace Font Family**: JetBrains Mono, ui-monospace, SFMono-Regular, monospace (for E.164 phone numbers, UUIDs, external call SIDs, confidence percentages).

### Scale:
- **Heading 1**: 1.5rem (24px), font-weight: 700, tracking-tight.
- **Heading 2**: 1.25rem (20px), font-weight: 700.
- **Heading 3**: 1rem (16px), font-weight: 600.
- **Body Regular**: 0.875rem (14px), font-weight: 400.
- **Body Medium**: 0.875rem (14px), font-weight: 500.
- **Caption / Meta**: 0.75rem (12px), font-weight: 500.
- **Badge / Micro**: 0.625rem (10px), font-weight: 700, uppercase.

---

## 4. Component Contract

### A. Buttons (`Button.tsx`)
- **Primary**: `bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition`
- **Secondary**: `bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 shadow-sm transition`
- **Ghost**: `text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition`
- **Danger**: `bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition`

### B. Badges & Status (`Badge.tsx`, `StatusBadge.tsx`)
- **Success (`AVAILABLE`, `CLOSED`, `COMPLETED`, `VERIFIED`)**: `bg-emerald-50 text-emerald-800 border-emerald-200`
- **Warning (`PENDING`, `ON_HOLD`, `REVIEW`)**: `bg-amber-50 text-amber-800 border-amber-200`
- **Danger (`LOST`, `REJECTED`, `OVERDUE`, `INACTIVE`)**: `bg-rose-50 text-rose-800 border-rose-200`
- **Info / Neutral (`NEW`, `CONTACTED`, `QUALIFIED`)**: `bg-slate-100 text-slate-700 border-slate-200`

### C. Tables (`Table.tsx`)
- High-density layout with `px-4 py-3` cell padding.
- Light slate header background (`bg-slate-50`) with subtle bottom border (`border-slate-200`).
- Interactive row hover background (`hover:bg-slate-50/80`).

### D. System States
- **Loading State**: Subtle Skeleton pulses (`animate-pulse bg-slate-200`) preserving page layout.
- **Empty State**: Centered icon, clear description, and primary action button.
- **Error State**: Red banner with explicit human-readable message and retry action.

---

## 5. Responsive & Accessibility Specifications
1. **WCAG Color Contrast**: Text-to-background contrast ratio >= 4.5:1.
2. **Keyboard Navigation**: All interactive elements (buttons, inputs, links, tabs) feature visible focus rings (`focus:ring-2 focus:ring-emerald-500 focus:outline-none`).
3. **Responsive Breakpoints**:
   - Mobile (`< 768px`): Sidebar collapses to overlay / top drawer. Table containers scroll horizontally. Form fields stack vertically.
   - Tablet (`768px - 1024px`): 2-column grid metrics.
   - Desktop (`> 1024px`): Full sidebar navigation, 3-column operational layout.
