import React from 'react';

const VideoBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Video element */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute w-full h-full object-cover"
        style={{
          filter: 'hue-rotate(320deg) saturate(2.5) brightness(1.1) contrast(1.3)',
        }}
      >
        <source src="/videos/dna-background.mp4" type="video/mp4" />
      </video>
      
      {/* Lavender-pink background overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(230, 200, 230, 0.85) 0%, rgba(245, 210, 235, 0.8) 50%, rgba(255, 200, 220, 0.75) 100%)',
          mixBlendMode: 'multiply',
        }}
      />
      
      {/* Raspberry tint for DNA */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(220, 20, 100, 0.15) 0%, transparent 60%)',
          mixBlendMode: 'color-dodge',
        }}
      />
      
      {/* Soft vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(180, 140, 180, 0.4) 100%)',
        }}
      />
    </div>
  );
};

export default VideoBackground;