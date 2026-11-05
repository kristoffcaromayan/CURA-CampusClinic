import React from 'react';

interface CuraLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const CuraLogo: React.FC<CuraLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  // Height classes per size
  const heightClass = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/assets/aistudio/f3b4c440-4209-4f52-9a36-16db061327f9-removebg-preview_dc9e948a.png"
        alt="CURA Logo"
        className={`${heightClass} w-auto object-contain shrink-0`}
      />
      {showSubtitle && (
        <div className="flex flex-col justify-center text-left">
          <span className="text-[11px] font-bold text-slate-800 leading-tight">NORSU Mabinay</span>
          <span className="text-[10px] text-slate-500 font-medium">Campus Clinic</span>
        </div>
      )}
    </div>
  );
};
