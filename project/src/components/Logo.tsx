import Image from 'next/image';

interface LogoProps {
  imageUrl: string;
  text?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ imageUrl, text, width = 40, height = 40, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-shrink-0 relative" style={{ width: `${width}px`, height: `${height}px` }}>
        <Image 
          src={imageUrl} 
          alt="شعار" 
          width={width}
          height={height}
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'contain' // هذا يحافظ على نسبة الأبعاد
          }}
          priority 
        />
      </div>
      {text && (
        <span className="text-xl sm:text-2xl font-bold text-primary whitespace-nowrap">
          {text}
        </span>
      )}
    </div>
  );
}