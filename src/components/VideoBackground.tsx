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
          filter: 'hue-rotate(280deg) saturate(0.4) brightness(1.4) contrast(0.9)',
        }}
      >
        <source src="/videos/dna-background.mp4" type="video/mp4" />
      </video>
      
      {/* Soft lavender-powder overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(230, 210, 240, 0.7) 0%, rgba(245, 230, 245, 0.6) 50%, rgba(255, 230, 240, 0.5) 100%)',
          mixBlendMode: 'normal',
        }}
      />
      
      {/* Soft pink-lavender glow */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(220, 190, 230, 0.4) 0%, transparent 70%)',
        }}
      />
      
      {/* Light vignette for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(200, 180, 210, 0.3) 100%)',
        }}
      />
    </div>
  );
};

export default VideoBackground;