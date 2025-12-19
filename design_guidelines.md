# Property Management System Design Guidelines

## Design Approach
**System-Based Approach** using Material Design principles. This data-intensive property management application requires clear information hierarchy, efficient workflows, and professional presentation optimized for daily operational use.

---

## Typography System

**Font Families:**
- Primary: Inter (Google Fonts) - headings, UI elements
- Secondary: IBM Plex Sans (Google Fonts) - body text, data tables

**Type Scale:**
- Page Titles: text-3xl font-bold (contracts, tenants pages)
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base
- Labels/Captions: text-sm
- Table Data: text-sm
- Micro-copy: text-xs

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16** exclusively
- Component padding: p-6
- Card spacing: gap-6
- Section margins: mb-8
- Table cell padding: px-4 py-3
- Form field spacing: space-y-4

**Grid Structure:**
- Main container: max-w-7xl mx-auto px-6
- Dashboard cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Content sections: Two-column layout for forms (lg:grid-cols-2)
- Tables: Full-width with horizontal scroll on mobile

---

## Core Components

### Navigation & Header
- Top navigation bar with logo left, user profile/notifications right
- Height: h-16
- Sticky positioning (sticky top-0)
- Main menu: Horizontal tabs for Desktop, Hamburger for Mobile
- Menu items: Dashboard, Tenants, Properties, Contracts, Payments

### Dashboard Metrics Cards
- Four-column grid showing: Total Units, Occupancy Rate, Pending Payments, Expiring Contracts
- Card structure: Icon top-left, metric number large, label below, trend indicator
- Rounded corners: rounded-lg
- Elevation: Subtle shadow treatment

### Data Tables
- Striped rows for readability
- Fixed header on scroll
- Status badges (Occupied/Vacant, Paid/Pending/Overdue)
- Action column right-aligned with icon buttons
- Row hover states for interactivity
- Pagination at bottom-right

### Forms
- Two-column layout for desktop (single column mobile)
- Input fields with floating labels
- Required field indicators (asterisk)
- Field spacing: space-y-4
- Submit buttons: Full width on mobile, auto width on desktop (right-aligned)

### Status Badges
- Pill-shaped: rounded-full px-3 py-1
- Small text: text-xs font-medium
- Categories: Success (Paid, Occupied), Warning (Pending), Error (Overdue), Neutral (Vacant)

### Modal Dialogs
- Max width: max-w-2xl
- Padding: p-6
- Header with title and close button
- Content area with form or details
- Footer with actions (Cancel left, Primary action right)

---

## Page-Specific Layouts

### Dashboard
- Metrics cards in 4-column grid (top section)
- Recent activity feed (left, 2/3 width)
- Upcoming notifications panel (right, 1/3 width)
- Quick actions floating button bottom-right

### Tenants List
- Search/filter bar at top
- Data table with columns: Name, Phone, Email, Status, Units, Actions
- Add Tenant button top-right

### Properties & Units
- Building cards in masonry grid
- Each card shows: Building name, address, total units, vacancy count
- Click to expand unit list within building
- Unit status indicators with quick-view details

### Contract Management
- Active contracts table prominent
- Expiring soon section highlighted at top
- Contract detail view: Two-column (contract info left, tenant/unit details right)
- Document preview/upload area

### Payments Dashboard
- Payment calendar view option
- Filter by status, unit, date range
- Summary totals at top
- Payment detail modal on row click

---

## Icons
**Library:** Heroicons (Outline for UI, Solid for filled states)
- Use via CDN link
- Standard size: w-5 h-5 for inline icons
- Large icons for empty states: w-12 h-12

---

## Animations
**Minimal approach:**
- Subtle fade-in for modals
- Smooth transitions on hover states (transition-colors duration-200)
- Loading spinners for async operations
- No decorative animations

---

## Accessibility
- Form labels always visible
- High contrast for all text
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- ARIA labels for icon-only buttons
- Keyboard navigation support throughout

---

## Responsive Behavior
- Mobile: Single-column layouts, hamburger menu, full-width cards
- Tablet: Two-column grids, condensed navigation
- Desktop: Full multi-column layouts, expanded tables

This system prioritizes data clarity, efficient workflows, and professional presentation for daily property management operations.