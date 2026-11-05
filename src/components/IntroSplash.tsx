import React, { useEffect, useRef, useState } from 'react';

interface IntroSplashProps {
  onComplete: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Ensure single playback without looping
      video.loop = false;
      video.play().catch(() => {
        // Fallback for browsers with strict autoplay policies
      });
    }

    // Safety timeout in case video stalls or fails to emit onEnded
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 5500);

    return () => clearTimeout(safetyTimer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white select-none transition-opacity duration-450 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Intro Video Player - Seamless blend with NO container box, NO outline, NO shadow */}
      <div className="relative max-w-xl w-full px-4 flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          src="/assets/aistudio/cura-logo-animation_3cbb4276.mp4"
          autoPlay
          muted
          playsInline
          loop={false}
          onEnded={handleFinish}
          className="w-full h-auto max-h-[70vh] object-contain border-0 outline-none shadow-none mix-blend-multiply"
        />

        {/* Brand Caption */}
        <div className="mt-3 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#007FFF] animate-pulse">
            Negros Oriental State University • Mabinay Campus Clinic
          </p>
        </div>
      </div>
    </div>
  );
};
