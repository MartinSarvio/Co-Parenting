# Huska Website — Technical Specification

---

## 1. Component Inventory

### shadcn/ui Components (built-in)
- **Button** — CTAs, nav actions
- **Card** — feature cards, testimonial cards, step cards
- **Badge** — labels ("Populær", "Gratis", etc.)
- **Separator** — footer dividers

### Custom Components to Build

| Component | Purpose | Props |
|-----------|---------|-------|
| `PhoneMockup` | Hero device frame with screen | `screenImage: string, className?: string` |
| `FeatureCard` | White card with icon, title, description | `icon: ReactNode, title: string, description: string, image?: string` |
| `SplitFeatureSection` | Reusable pinned split layout (photo + text) | `variant: 'leftPhoto' \| 'rightPhoto', photo: string, title: string, subtitle: string, body: string[], bullets: string[], badge?: string` |
| `StepCard` | Numbered step card | `number: number, title: string, description: string` |
| `TestimonialCard` | Quote card with avatar | `quote: string, name: string, role: string, avatar?: string` |
| `EyebrowPill` | Small rounded label | `children: string` |
| `TrustBadge` | Icon + text pill | `icon: ReactNode, text: string` |
| `GrainOverlay` | Static noise texture | `className?: string` |
| `Navigation` | Sticky header with logo + links | — |
| `Footer` | Dark footer with links | — |

---

## 2. Animation Implementation Table

| Animation | Library | Implementation Approach | Complexity |
|-----------|---------|------------------------|------------|
| **Hero load entrance** | GSAP Timeline | Auto-play timeline on mount; staggered reveals for text, phone, badges | High |
| **Hero scroll exit** | GSAP ScrollTrigger | `scrub: 0.6`, translate/rotate/opacity to exit positions | Medium |
| **Section 2 cards stagger entrance** | GSAP ScrollTrigger | `fromTo()` with stagger; scale + translateY + opacity | Medium |
| **Section 2 cards exit collapse** | GSAP ScrollTrigger | translateX outward + scale down; keep opacity until 95% | Medium |
| **Split sections entrance (3-6)** | GSAP ScrollTrigger | Photo from ±55vw, text card from opposite side; text content stagger | High |
| **Split sections exit (3-6)** | GSAP ScrollTrigger | Cards slide ±18vw; opacity held to 95% | Medium |
| **Floating UI overlays (chat/expense)** | GSAP ScrollTrigger | Scale + translateY entrance; fade exit | Low |
| **Flowing section headers** | GSAP ScrollTrigger | Simple `fromTo` opacity + translateY on scroll | Low |
| **Step cards stagger** | GSAP ScrollTrigger | Each card triggers independently as it enters viewport | Low |
| **Testimonial parallax** | GSAP ScrollTrigger | Subtle `y: 0 → -20px` across section scroll | Low |
| **Button hover states** | CSS Transitions | `transform: translateY(-2px) scale(1.02)` | Low |
| **Card hover states** | CSS Transitions | `transform: scale(1.01)` | Low |
| **Phone breathing (ambient)** | GSAP | Yoyo translateY loop, 4s duration, ease-in-out | Low |
| **Global scroll snap** | GSAP ScrollTrigger | Global snap function targeting pinned section centers only | High |

---

## 3. Animation Library Choices

### Primary: GSAP + ScrollTrigger
- **Rationale**: precise scrubbed animations, pin support, timeline control
- **Usage**: all section animations, scroll snap, staggered reveals

### Secondary: CSS Transitions
- **Rationale**: performant for simple hover states
- **Usage**: button/card hover effects

### Optional: Lenis (smooth scroll)
- **Rationale**: premium scroll feel
- **Integration**: must configure ScrollTrigger scrollerProxy if used

---

## 4. Project File Structure

```
app/
├── public/
│   ├── images/
│   │   ├── hero-phone-ui.jpg
│   │   ├── samvaersplan-photo.jpg
│   │   ├── kalender-photo.jpg
│   │   ├── kommunikation-photo.jpg
│   │   ├── udgifter-photo.jpg
│   │   ├── chat-bubble-ui.png
│   │   └── expense-list-ui.png
│   └── grain-overlay.png
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── PhoneMockup.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── SplitFeatureSection.tsx
│   │   ├── StepCard.tsx
│   │   ├── TestimonialCard.tsx
│   │   ├── EyebrowPill.tsx
│   │   ├── TrustBadge.tsx
│   │   ├── GrainOverlay.tsx
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesOverviewSection.tsx
│   │   ├── SamvaersplanSection.tsx
│   │   ├── KalenderSection.tsx
│   │   ├── KommunikationSection.tsx
│   │   ├── UdgifterSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   └── ClosingSection.tsx
│   ├── hooks/
│   │   └── useScrollAnimation.ts  # reusable scroll trigger hook
│   ├── lib/
│   │   ├── utils.ts
│   │   └── animations.ts          # animation presets/timelines
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Dependencies to Install

### Core (from init)
- `react`, `react-dom`
- `vite`, `typescript`
- `tailwindcss`, `postcss`, `autoprefixer`
- `clsx`, `tailwind-merge`, `class-variance-authority`

### Animation
```bash
npm install gsap @gsap/react
```

### Fonts
```bash
# Using Google Fonts via CDN in index.html
# Space Grotesk + Inter
```

### Optional
```bash
npm install lenis  # smooth scroll (optional)
```

---

## 6. Key Technical Decisions

### Pinned Section Architecture
- Each pinned section is a separate component in `src/sections/`
- Use `useGSAP()` hook per section for local ScrollTrigger management
- Global snap function in `App.tsx` that collects all pinned triggers

### Z-Index Stacking
- Section 1: z-10
- Section 2: z-20
- Section 3: z-30
- ...increment by 10 for each section

### Responsive Breakpoints
- Mobile: < 768px (stack layouts)
- Tablet: 768px–1024px (adjusted widths)
- Desktop: > 1024px (exact compositions)

### Performance Optimizations
- `will-change: transform` on animated elements
- Use `transform` only (no layout-triggering properties)
- Lazy load images below fold
- Static grain overlay (no animation)

### Accessibility
- `prefers-reduced-motion` media query disables pinned animations
- All interactive elements keyboard accessible
- Focus states visible (blue outline)

---

## 7. Animation Specifications Reference

### Hero Load Timeline (auto-play)
```javascript
// Total: ~1.1s, ease: power2.out
timeline
  .from(nav, { opacity: 0, duration: 0.3 })
  .from(eyebrow, { opacity: 0, y: 24 }, 0.1)
  .from(headline, { opacity: 0, y: 24 }, 0.18)
  .from(subheadline, { opacity: 0, y: 24 }, 0.26)
  .from(phone, { opacity: 0, x: '10vw', rotateZ: -6, scale: 0.96 }, 0.12)
  .from(buttons, { opacity: 0, y: 16, stagger: 0.06 }, 0.4)
  .from(badges, { opacity: 0, y: 16, stagger: 0.06 }, 0.5)
```

### Pinned Section ScrollTrigger Pattern
```javascript
ScrollTrigger.create({
  trigger: sectionRef.current,
  start: "top top",
  end: "+=130%",
  pin: true,
  scrub: 0.6,
  onUpdate: (self) => {
    // progress 0-1 drives timeline
  }
})
```

### Global Snap Function (simplified)
```javascript
ScrollTrigger.create({
  snap: {
    snapTo: (progress) => {
      // Find nearest pinned center based on actual trigger ranges
      // Return snapped progress or original if not in pinned range
    },
    duration: { min: 0.15, max: 0.35 },
    delay: 0,
    ease: "power2.out"
  }
})
```

---

## 8. Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Deploy
- Output: `dist/` folder
- Deploy to: Vercel, Netlify, or similar
- Ensure `dist/index.html` is entry point

---

## 9. Checklist Before Launch

- [ ] All 9 sections render correctly
- [ ] Hero auto-play entrance works
- [ ] All pinned sections snap to settle centers
- [ ] Reverse scroll restores all content
- [ ] Mobile responsive (stacked layouts)
- [ ] Reduced motion mode works
- [ ] All images optimized
- [ ] No console errors
- [ ] Performance audit (Lighthouse > 90)