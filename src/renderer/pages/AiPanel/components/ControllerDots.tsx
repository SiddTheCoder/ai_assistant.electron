import type { ControllerDotsProps } from '../types';

export function ControllerDots({ total, activeIndex, onSelect }: ControllerDotsProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 pb-3.5">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className="p-1 bg-transparent border-none cursor-pointer outline-none group"
          aria-label={`Switch to panel ${index + 1}`}
        >
          <div
            className={`
              rounded-full transition-all duration-300 ease-out
              ${activeIndex === index 
                ? 'w-5 h-1.5 bg-indigo-100' 
                : 'w-1.5 h-1.5 bg-indigo-300/30 group-hover:bg-indigo-300/50'
              }
            `}
          />
        </button>
      ))}
    </div>
  );
}
