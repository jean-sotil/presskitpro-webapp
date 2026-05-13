# GSAP Animations Guide for Presskit-Pro Preset Components

## Overview

All presskit-pro template preset components have been enhanced with stunning GSAP animations using the `@gsap/react` hook. These animations bring the profile pages to life with smooth, polished entrance and interaction effects.

## Installation

GSAP and @gsap/react are already installed:
```bash
pnpm add gsap @gsap/react
```

## Animation Patterns Used

### 1. **Entrance Animations** (Fade + Slide)
- Used for: Hero title, About section, Contact CTAs
- Effect: Elements fade in while sliding up from their initial position
- Duration: 0.6-0.8s
- Easing: `power3.out` (smooth deceleration)

### 2. **Staggered Animations** (Sequential reveal)
- Used for: Services cards, Photo gallery, Social links, Instagram posts
- Effect: Each element reveals with a slight delay creating a cascading wave
- Stagger delay: 0.06-0.1s between each item
- Duration: 0.4-0.6s per item

### 3. **Scale + Opacity** (Growth animations)
- Used for: Featured track, CTA buttons, Service cards on hover
- Effect: Elements grow from a smaller scale while fading in
- Start scale: 0.9-0.95
- Duration: 0.5-0.8s
- Easing: `back.out` (elastic bounce effect)

### 4. **Hover Effects** (Interactive feedback)
- Used for: Service cards, CTA buttons, Social links
- Effect: Lift or translate on mouseenter, reset on mouseleave
- Duration: 0.2-0.3s per transition
- Motion: Y-axis lift (cards) or X-axis shift (links)

## Component-by-Component Breakdown

### Hero (HeroRender.template-preset.tsx)
**Animations:**
- Title: Fade in + slide up (0.8s)
- Tagline: Fade in + slide up (0.6s, -0.4s offset)
- CTA Button: Fade in + scale (0.5s, -0.3s offset)
- Hover: Scale up to 1.05 on mouseenter, reset on mouseleave

**Code Pattern:**
```tsx
useGSAP((context) => {
  const tl = gsap.timeline();
  // Stagger animations using timeline offsets
  tl.fromTo(titleRef.current, {...}, {...});
  tl.fromTo(taglineRef.current, {...}, {...}, '-=0.4');
}, { scope: containerRef });
```

### Services (ServicesRender.template-preset.tsx)
**Animations:**
- Cards: Staggered fade in + slide up (0.5s each, 0.1s stagger)
- Hover: Lift effect (y: -8px) on mouseenter

**Code Pattern:**
- Maps over cards with forEach to attach individual hover listeners
- Uses Map to track and properly clean up event listeners

### About (AboutRender.template-preset.tsx)
**Animations:**
- Label: Fade in (0.6s)
- Heading: Fade in + slide up (0.7s, -0.3s offset)
- Tagline: Fade in + slide up (0.6s, -0.4s offset)
- Bio text: Fade in + slide up (0.6s, -0.3s offset)

**Code Pattern:**
- Sequential timeline building with calculated offsets
- All animations staggered for visual flow

### Photo Gallery (PhotoGalleryRender.template-preset.tsx)
**Animations:**
- Images: Staggered scale + fade in (0.6s each, 0.08s stagger)
- Start state: opacity 0, scale 0.95
- Easing: `back.out` for elastic growth

### Social Links (SocialLinksRender.template-preset.tsx)
**Animations:**
- Links: Staggered fade in + slide from left (0.4s each, 0.06s stagger)
- Hover: Shift right (x: 4px) on mouseenter, smooth return on mouseleave

### Contact (ContactRender.template-preset.tsx)
**Animations:**
- CTAs: Staggered scale + fade in (0.5s each, 0.1s stagger)
- Form: Fade in + slide up (0.6s)

### Featured Track (FeaturedTrackRender.template-preset.tsx)
**Animations:**
- Label: Fade in (0.6s)
- Heading: Fade in + slide up (0.7s)
- Embed: Scale + fade in (0.8s)

### Instagram Feed (InstagramFeedRender.template-preset.tsx)
**Animations:**
- Posts: Staggered fade in + slide up (0.5s each, 0.1s stagger)

### Press Kit Link (PressKitLinkRender.template-preset.tsx)
**Animations:**
- Label: Fade in (0.6s)
- Heading: Fade in + slide up (0.7s)
- CTA: Scale + fade in (0.6s)
- Badge: Fade in (0.5s)

## Best Practices Implemented

✅ **useGSAP Hook**: All animations use the `@gsap/react` hook instead of useEffect for cleaner code and automatic cleanup

✅ **Proper Scoping**: All animations use `scope: containerRef` to ensure selectors only target elements within that component

✅ **Memory Management**: Event listeners are properly tracked and removed in cleanup functions using Map data structure

✅ **Null Safety**: All DOM references are null-checked before animation targeting

✅ **Timeline Composition**: Complex animations use GSAP timelines with offsets for synchronized, cascading effects

✅ **Responsive**: Animations work seamlessly across all breakpoints thanks to Tailwind's responsive classes

## Performance Considerations

- Animations use hardware-accelerated properties (opacity, transform)
- Stagger delays are kept moderate (0.06-0.1s) to maintain fast feel
- Duration ranges are optimized: 0.3-0.8s for perceived smoothness without lag
- All animations have appropriate easing curves for natural motion

## Customization Guide

### Adjusting Timing
```tsx
// All timings are in seconds
duration: 0.5,  // Animation length
stagger: 0.1,   // Delay between items
'-=0.3'         // Timeline offset
```

### Changing Easing
```tsx
ease: 'power3.out'      // Current (smooth deceleration)
ease: 'power2.out'      // Faster deceleration
ease: 'back.out'        // Elastic/bouncy effect
ease: 'circ.out'        // Circular easing
```

### Modifying Animation Properties
```tsx
fromTo(element, 
  { opacity: 0, y: 30 },        // Starting state
  { opacity: 1, y: 0, ... }     // Ending state
)
```

## Testing the Animations

1. Start the dev server: `pnpm dev`
2. Navigate to any profile page
3. Watch animations play on initial page load
4. Hover over interactive elements (cards, links, buttons) to see hover effects
5. Test on different devices/breakpoints for responsive behavior

## Troubleshooting

**Animations not playing?**
- Check browser console for errors
- Verify `gsap.registerPlugin(useGSAP)` is called
- Ensure `scope: containerRef` is set in useGSAP options

**Event listeners causing memory leaks?**
- Always return cleanup function from useGSAP
- Use Map to track handlers for removal

**Animations janky or stuttering?**
- Check for other simultaneous animations
- Verify hardware acceleration is enabled
- Reduce stagger delay or animation duration

## GSAP Documentation

For more advanced animation techniques, refer to:
- [GSAP React Documentation](https://gsap.com/resources/React)
- [GSAP Timeline API](https://gsap.com/docs/v3/API/Timeline)
- [GSAP Easing](https://gsap.com/docs/v3/Eases)
