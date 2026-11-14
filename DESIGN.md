# Design

Two visual surfaces share the brand (name **Meal Manager**, the crossed-utensils mark, green as the brand hue):

- **App** (`src/app/(dashboard)`, `/login`): dark slate (`slate-900/950`) with emerald accents, Geist, Tailwind utilities. An Operate surface; not covered further here.
- **Landing** (`/`, `src/features/landing`): described below.

## Landing

The landing page at `/` (`src/features/landing`) extends the app's own look so the two feel like one product: dark ground `#0b0f19`, slate text, emerald-500/400 for primary actions and accents, amber-300/400 only for money due. Font is Geist, applied on the landing root.

- **Layout:** centred hero (headline, two buttons) over an HTML preview of the dashboard filled with labelled sample data; a strip of real local facts; a 6-column feature grid with cards of varied widths, each with a small product visual; how it works (3 numbered steps) beside a live meal-rate calculator; a role comparison; a final call to sign in; footer.
- **Surfaces:** `border-white/[0.06–0.08]` hairlines on `slate-900/40` panels, `rounded-2xl`; no glass except the sticky nav once the page scrolls.
- **Buttons:** primary `bg-emerald-500 text-slate-950 rounded-lg h-11`; secondary a bordered ghost; the nav's Sign in button is white.
- **Motion:** hero entrance (`heroIn`, staggered) and a 3D tilt-in of the dashboard preview (`previewIn`); a slowly drifting emerald/teal aurora behind the hero; floating activity notifications around the preview (xl+); KPI numbers count up (`CountUp`); sections fade up on scroll (`Reveal`, IntersectionObserver); feature cards carry a cursor-following spotlight (`SpotlightCard`) and small looping product animations (meal grid glow, seat pulse, complaint status cycle, audit-log ticker); a light travels down the how-it-works line; a conic border rotates around the final call to action. Keyframes live in `globals.css`. Large movements use transform/opacity only (the small meal-grid and seat loops animate colour and shadow), and `prefers-reduced-motion` disables loops (`.motion-loop`) and reveals.
- **Content:** the primary action is Sign in only (no public sign-up). Numbers are labelled as a sample mess and use the `BillingService` formula. No invented testimonials, stats or logos.
