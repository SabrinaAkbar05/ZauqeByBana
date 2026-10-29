import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  tagline?: boolean;
  href?: string;
  theme?: 'dark' | 'light';
  className?: string;
  priority?: boolean;
}

const SIZES = {
  sm: { px: 36, wrapper: 'w-9 h-9' },
  md: { px: 46, wrapper: 'w-[46px] h-[46px]' },
  lg: { px: 68, wrapper: 'w-[68px] h-[68px]' },
  xl: { px: 110, wrapper: 'w-[110px] h-[110px]' },
};

export function BrandLogo({
  size = 'md',
  showText = true,
  tagline = true,
  href,
  theme = 'dark',
  className = '',
  priority = false,
}: BrandLogoProps) {
  const currentSize = SIZES[size];

  const content = (
    <div className={`brand-lockup brand-lockup-${theme} ${className}`}>
      <div className={`brand-emblem-wrap ${currentSize.wrapper}`}>
        <Image
          src="/zauqe-logo.png"
          alt="ZAUQÉ BY BANA Logo"
          width={currentSize.px}
          height={currentSize.px}
          priority={priority}
          className="brand-emblem-img"
          unoptimized
        />
      </div>

      {showText && (
        <div className="brand-text-block">
          <div className="brand-title">
            <span className="brand-primary-name">ZAUQÉ</span>
            <span className="brand-by-label">BY BANA</span>
          </div>
          {tagline && (
            <span className="brand-tagline">
              Events • Catering • Experiences
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="brand-link">
        {content}
      </Link>
    );
  }

  return content;
}
