/**
 * Utility functions for managing animation mode preferences
 */

const ANIMATION_MODE_KEY = 'tpolls-animation-mode';

/**
 * Get the current animation mode preference
 * @returns {string} 'static' or 'animated'
 */
export const getAnimationMode = () => {
  try {
    return localStorage.getItem(ANIMATION_MODE_KEY) || 'static';
  } catch (error) {
    console.warn('Failed to get animation mode from localStorage:', error);
    return 'static';
  }
};

/**
 * Set the animation mode preference
 * @param {string} mode - 'static' or 'animated'
 */
export const setAnimationMode = (mode) => {
  try {
    if (mode !== 'static' && mode !== 'animated') {
      throw new Error('Invalid animation mode. Must be "static" or "animated"');
    }
    localStorage.setItem(ANIMATION_MODE_KEY, mode);
  } catch (error) {
    console.warn('Failed to set animation mode in localStorage:', error);
  }
};

/**
 * Check if animations are enabled
 * @returns {boolean} true if animated mode is enabled
 */
export const isAnimationEnabled = () => {
  return getAnimationMode() === 'animated';
};

/**
 * Get CSS classes based on animation mode
 * @param {string} baseClass - Base CSS class
 * @param {string} animatedClass - Additional class for animated mode
 * @returns {string} Combined CSS classes
 */
export const getAnimationClasses = (baseClass, animatedClass = 'animated') => {
  const classes = [baseClass];
  if (isAnimationEnabled()) {
    classes.push(animatedClass);
  }
  return classes.join(' ');
};

/**
 * Animation configuration object
 */
export const ANIMATION_CONFIG = {
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5
  },
  easing: {
    default: 'ease',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};