'use client';

import { useEffect, useState } from 'react';

const CARS = [
  '/images/cars/2018-bmw-3-series-bmw-x5-car-bmw-1-series-bmw-removebg-preview.png',
  '/images/cars/2018-mercedes-benz-cla-class-2016-mercedes-benz-cla-class-car-mercedes-benz-c-class-benz-removebg-preview.png',
  '/images/cars/5bbc2c372e28b-removebg-preview.png',
  '/images/cars/Peugeot-Background-PNG-Image-removebg-preview.png',
];

function getNextCarIndex(currentIndex: number): number {
  const nextIndex = currentIndex + 1;

  if (nextIndex >= CARS.length) {
    return 0;
  }

  return nextIndex;
}

export const AICarScanner = () => {
  const [currentCarIndex, setCurrentCarIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarIndex((prev) => getNextCarIndex(prev));
    }, 7000); // Change car every 7 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="relative w-full h-full flex items-center justify-center">
        {CARS.map((carUrl, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              opacity: index === currentCarIndex ? 1 : 0,
              pointerEvents: index === currentCarIndex ? 'auto' : 'none',
            }}
          >
            <img
              src={carUrl}
              alt={`Car ${index + 1}`}
              className="w-full h-full object-contain"
              style={{
                animation:
                  index === currentCarIndex
                    ? 'carZoomIn 7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
                    : 'none',
                transformOrigin: 'center center',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {CARS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentCarIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentCarIndex
                ? 'w-8 bg-cyan-400'
                : 'w-2 bg-cyan-400/40 hover:bg-cyan-400/60'
            }`}
            aria-label={`Car ${index + 1}`}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes carZoomIn {
          0% {
            transform: scale(0.98) translate3d(0, 6px, 0);
            opacity: 0;
            filter: blur(4px);
          }
          15% {
            opacity: 1;
            filter: blur(0px);
          }
          85% {
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: scale(1.06) translate3d(0, -4px, 0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
