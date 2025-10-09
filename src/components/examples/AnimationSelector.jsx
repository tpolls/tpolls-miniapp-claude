import React, { useState } from 'react';
import DualModeNavigation from '../DualModeNavigation';
import './AnimationSelector.css';

/**
 * Animation Selector Component
 *
 * This component helps you test different animation styles for DualModeNavigation.
 * Click on an animation style to see it in action.
 */
function AnimationSelector() {
  const [currentPage, setCurrentPage] = useState('main');
  const [selectedAnimation, setSelectedAnimation] = useState('drawer');

  const animations = [
    {
      name: 'drawer',
      label: 'Drawer',
      description: 'Slides from off-screen like opening a drawer. Starts compressed and expands with bounce.'
    },
    {
      name: 'smooth',
      label: 'Smooth Fade & Slide',
      description: 'Gentle fade and slide animation. Simple and elegant.'
    },
    {
      name: 'scale',
      label: 'Scale & Fade',
      description: 'Grows from center with fade. Subtle and clean.'
    },
    {
      name: 'flip',
      label: 'Flip (3D)',
      description: '3D rotation flip effect. Modern and eye-catching.'
    },
    {
      name: 'bounce',
      label: 'Bounce',
      description: 'Bouncy spring animation with overshoot. Playful and energetic.'
    },
    {
      name: 'compress',
      label: 'Slide & Compress',
      description: 'Slides with horizontal compression. Smooth expansion effect.'
    },
    {
      name: 'elastic',
      label: 'Elastic',
      description: 'Rubber-band elastic effect with multiple bounces. Most dramatic.'
    }
  ];

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="animation-selector">
      <div className="selector-content">
        <h1 className="selector-title">Choose Your Animation</h1>
        <p className="selector-subtitle">
          Click on an animation style, then toggle between modes to see it in action
        </p>

        <div className="animation-grid">
          {animations.map((anim) => (
            <button
              key={anim.name}
              className={`animation-card ${selectedAnimation === anim.name ? 'selected' : ''}`}
              onClick={() => setSelectedAnimation(anim.name)}
            >
              <div className="animation-card-header">
                <h3 className="animation-label">{anim.label}</h3>
                {selectedAnimation === anim.name && (
                  <span className="selected-badge">✓ Active</span>
                )}
              </div>
              <p className="animation-description">{anim.description}</p>
            </button>
          ))}
        </div>

        <div className="current-selection">
          <div className="selection-indicator">
            Currently using: <strong>{animations.find(a => a.name === selectedAnimation)?.label}</strong>
          </div>
          <div className="selection-hint">
            👇 Toggle the mode button below to see the animation
          </div>
        </div>
      </div>

      {/* The Navigation Component */}
      <DualModeNavigation
        currentPage={currentPage}
        onNavigate={handleNavigation}
        initialMode="participant"
        animationStyle={selectedAnimation}
      />
    </div>
  );
}

export default AnimationSelector;
