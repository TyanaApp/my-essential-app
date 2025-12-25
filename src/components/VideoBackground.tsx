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
          filter: 'hue-rotate(260deg) saturate(1.5) brightness(0.4)',
        }}
      >
        <source src="/videos/dna-background.mp4" type="video/mp4" />
      </video>
      
      {/* Neon purple overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.2) 50%, rgba(192, 38, 211, 0.25) 100%)',
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Additional glow effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        }}
      />
      
      {/* Dark vignette for readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />
    </div>
  );
};

export default VideoBackground;