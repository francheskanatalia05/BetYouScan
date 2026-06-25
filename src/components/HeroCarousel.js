import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HeroCarousel({ events }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (events.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [events.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + events.length) % events.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (events.length === 0) {
    return null;
  }

  const currentEvent = events[currentIndex];

  // Placeholder images if no image URL
  const getImageUrl = (event) => {
    if (event.imageUrl) return event.imageUrl;
    
    // Category-based placeholder
    const placeholders = {
      Concert: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=500&fit=crop",
      Sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=500&fit=crop",
      Academic: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=500&fit=crop",
      Cultural: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=500&fit=crop"
    };
    return placeholders[event.category] || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=500&fit=crop";
  };

  return (
    <div className="hero-carousel">
      <div className="carousel-container">
        {/* Main Slide */}
        <div className="carousel-slide">
          <img 
            src={getImageUrl(currentEvent)} 
            alt={currentEvent.name}
            className="carousel-image"
          />
          
          {/* Dark Overlay for text readability */}
          <div className="carousel-overlay"></div>
          
          {/* Event Info Overlay */}
          <div className="carousel-content">
            <div className="carousel-badge">{currentEvent.category}</div>
            <h1 className="carousel-title">{currentEvent.name}</h1>
            <p className="carousel-description">{currentEvent.description?.substring(0, 120)}...</p>
            
            <div className="carousel-details">
              <div className="carousel-detail">
                <span className="carousel-detail-icon">📅</span>
                <span>{currentEvent.date}</span>
              </div>
              <div className="carousel-detail">
                <span className="carousel-detail-icon">⏰</span>
                <span>{currentEvent.time} | DOORS OPEN 6PM | SHOW STARTS {currentEvent.time}</span>
              </div>
              <div className="carousel-detail">
                <span className="carousel-detail-icon">📍</span>
                <span>{currentEvent.venue}</span>
              </div>
              <div className="carousel-detail">
                <span className="carousel-detail-icon">🎟️</span>
                <span>{currentEvent.availableTickets} tickets available</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate("/events")}
              className="carousel-btn"
            >
              BUY TICKETS →
            </button>
          </div>
        </div>
        
        {/* Navigation Arrows */}
        <button className="carousel-arrow carousel-arrow-left" onClick={goToPrevious}>
          ❮
        </button>
        <button className="carousel-arrow carousel-arrow-right" onClick={goToNext}>
          ❯
        </button>
        
        {/* Dots Indicator */}
        <div className="carousel-dots">
          {events.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}