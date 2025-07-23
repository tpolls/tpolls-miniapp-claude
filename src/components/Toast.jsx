import React, { useState, useEffect } from 'react';
import './Toast.css';

function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start animation after mount
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);

    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Match CSS transition duration
  };

  if (!isVisible) return null;

  return (
    <div className={`toast toast--${type} ${isAnimating ? 'toast--show' : ''}`}>
      <div className="toast__content">
        <div className="toast__icon">
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'info' && 'ℹ️'}
          {type === 'warning' && '⚠️'}
        </div>
        <div className="toast__message">{message}</div>
        <button className="toast__close" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
}

export default Toast;