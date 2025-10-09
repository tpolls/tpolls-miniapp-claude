# DualModeNavigation Animation Guide

## Available Animation Styles

The `DualModeNavigation` component supports 7 different animation styles. You can test them using the `AnimationSelector` component or set them directly via the `animationStyle` prop.

### 1. **Drawer** (Default)
```jsx
<DualModeNavigation animationStyle="drawer" ... />
```
- Slides from completely off-screen like opening a drawer
- Starts compressed (30% width) and expands to 105% before settling
- Elastic bounce effect at the end
- **Best for:** Dramatic, playful transitions

### 2. **Smooth Fade & Slide**
```jsx
<DualModeNavigation animationStyle="smooth" ... />
```
- Gentle slide with fade
- Slides 30px from edge
- Simple and subtle
- **Best for:** Professional, minimal interfaces

### 3. **Scale & Fade**
```jsx
<DualModeNavigation animationStyle="scale" ... />
```
- Grows from 70% to 100% size
- Fades in from center
- Slight bounce effect
- **Best for:** Clean, modern look

### 4. **Flip (3D)**
```jsx
<DualModeNavigation animationStyle="flip" ... />
```
- 3D rotation flip (90 degrees)
- Perspective effect
- Flips from appropriate edge
- **Best for:** Eye-catching, modern design

### 5. **Bounce**
```jsx
<DualModeNavigation animationStyle="bounce" ... />
```
- Bouncy spring animation
- Multiple overshoot stages
- Very playful and energetic
- **Best for:** Fun, casual interfaces

### 6. **Slide & Compress**
```jsx
<DualModeNavigation animationStyle="compress" ... />
```
- Horizontal compression (60% → 108% → 100%)
- Smooth expansion effect
- Moderate bounce
- **Best for:** Balanced between playful and professional

### 7. **Elastic**
```jsx
<DualModeNavigation animationStyle="elastic" ... />
```
- Most dramatic animation
- Multiple rubber-band bounces
- Four-stage animation
- Longest duration (0.8s)
- **Best for:** Attention-grabbing, high-energy apps

## Testing Animations

### Method 1: Use the AnimationSelector Component

```jsx
import AnimationSelector from './components/examples/AnimationSelector';

// In your app:
<AnimationSelector />
```

This provides a visual interface to test all animations interactively.

### Method 2: Set Directly in App.jsx

```jsx
<DualModeNavigation
  currentPage={currentPage}
  onNavigate={handleBottomNavigation}
  initialMode="participant"
  animationStyle="smooth"  // Change this to test different animations
/>
```

## Animation Details

| Style | Duration | Easing | Complexity |
|-------|----------|--------|------------|
| Drawer | 0.5s | Elastic | High |
| Smooth | 0.4s | Ease-in-out | Low |
| Scale | 0.4s | Bounce | Medium |
| Flip | 0.5s | Ease-in-out | Medium |
| Bounce | 0.6s | Elastic | High |
| Compress | 0.5s | Bounce | Medium |
| Elastic | 0.8s | Elastic | Very High |

## Recommendation

- **For professional apps:** Use `smooth` or `scale`
- **For fun/casual apps:** Use `bounce` or `elastic`
- **For modern design:** Use `flip` or `drawer`
- **For balanced feel:** Use `compress`

## Current Setting

The default animation is set to `drawer` in `App.jsx`. You can change this to any of the above options.
