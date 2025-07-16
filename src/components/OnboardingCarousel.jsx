import React, { useState, useEffect } from 'react';
import './OnboardingCarousel.css';
import slide1CharImage from '../assets/slide1_char.png';
import slide2CharImage from '../assets/slide2_char.png';
import slide3CharImage from '../assets/slide3_char.png';

function OnboardingCarousel({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [webApp, setWebApp] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
  }, []);

  const slides = [
    {
      title: "Welcome to tPolls",
      subtitle: "Own Your Voice, Earn with Every Vote",
      description: "Join a new era of decentralized polling where your opinion is rewarded. No sign-ups, no spam — just your wallet and your vote.",
      illustration: (
        <div className="slide-illustration slide1">
          <img 
            src={slide1CharImage} 
            alt="Character with poll interface" 
            className="slide1-character-image"
          />
        </div>
      )
    },
    {
      title: "Participate in Decentralized Polls",
      subtitle: "Choose options on public polls and submit your vote securely on the blockchain.",
      description: "",
      illustration: (
        <div className="slide-illustration slide2">
          <img 
            src={slide2CharImage} 
            alt="Character with blockchain and poll interface" 
            className="slide2-character-image"
          />
        </div>
      )
    },
    {
      title: "Earn Tokens for Participating",
      subtitle: "Poll creators fund polls with crypto. Respondents get rewarded per vote. Real utility, real ownership, real incentives.",
      description: "",
      illustration: (
        <div className="slide-illustration slide3">
          <img 
            src={slide3CharImage} 
            alt="Wallet with tokens and phone showing responses" 
            className="slide3-character-image"
          />
        </div>
      )
    }
  ];

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    const isTap = Math.abs(distance) < 10;

    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }

    if (isTap) {
      // Handle tap to advance
      if (currentSlide < slides.length - 1) {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentSlide(currentSlide + 1);
          setIsAnimating(false);
        }, 150);
      } else {
        onComplete && onComplete();
      }
    } else if (isLeftSwipe && currentSlide < slides.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsAnimating(false);
      }, 150);
    } else if (isLeftSwipe && currentSlide === slides.length - 1) {
      onComplete && onComplete();
    } else if (isRightSwipe && currentSlide > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const goToSlide = (index) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 150);
  };

  const handleGetStarted = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }
    onComplete && onComplete();
  };

  const handleSkip = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    onComplete && onComplete();
  };

  return (
    <div 
      className="onboarding-carousel"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={(e) => {
        // Handle click/tap for desktop and mobile
        if (e.target.closest('.indicator') || e.target.closest('.get-started-btn') || e.target.closest('.skip-btn')) {
          return; // Don't handle tap if clicking indicators, buttons, or skip
        }
        
        if (webApp) {
          webApp.HapticFeedback.impactOccurred('light');
        }
        
        if (currentSlide < slides.length - 1) {
          setIsAnimating(true);
          setTimeout(() => {
            setCurrentSlide(currentSlide + 1);
            setIsAnimating(false);
          }, 150);
        } else {
          onComplete && onComplete();
        }
      }}
    >
      <div className="carousel-container">
        <div className={`carousel-content ${isAnimating ? 'animating' : ''}`}>
          <div className="slide-content">
            <h1 className="slide-title">{slides[currentSlide].title}</h1>
            {slides[currentSlide].subtitle && (
              <h2 className="slide-subtitle">{slides[currentSlide].subtitle}</h2>
            )}
            {slides[currentSlide].description && (
              <p className="slide-description">{slides[currentSlide].description}</p>
            )}
          </div>
          
          {slides[currentSlide].illustration}
        </div>

        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>

        {currentSlide < slides.length - 1 ? (
          <div className="skip-section">
            <button className="skip-btn" onClick={handleSkip}>
              Skip
            </button>
          </div>
        ) : (
          <div className="get-started-section">
            <button className="get-started-btn" onClick={handleGetStarted}>
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingCarousel;