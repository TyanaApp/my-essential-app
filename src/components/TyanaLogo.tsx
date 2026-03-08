import tyanaLogoText from '@/assets/tyana-logo-text.png';

interface TyanaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'gradient' | 'white';
  className?: string;
}

const sizeMap = {
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-7',
  xl: 'h-9',
};

const TyanaLogo = ({ size = 'md', variant = 'gradient', className = '' }: TyanaLogoProps) => {
  if (variant === 'white') {
    return (
      <div className={`${sizeMap[size]} ${className}`} style={{ display: 'inline-block' }}>
        <img
          src={tyanaLogoText}
          alt="TYANA"
          className={`${sizeMap[size]} w-auto object-contain`}
          style={{
            filter: 'brightness(0) invert(1)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeMap[size]} ${className}`}
      style={{
        display: 'inline-block',
        background: 'linear-gradient(135deg, #2E1065 0%, #7C3AED 50%, #C4B5FD 100%)',
        WebkitMaskImage: `url(${tyanaLogoText})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: `url(${tyanaLogoText})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    >
      <img
        src={tyanaLogoText}
        alt="TYANA"
        className={`${sizeMap[size]} w-auto object-contain`}
        style={{ visibility: 'hidden' }}
      />
    </div>
  );
};

export default TyanaLogo;
