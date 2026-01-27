import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ExpansionAreaProps {
  isVisible: boolean;
  children: ReactNode;
  onClose: () => void;
}

export function ExpansionArea({ isVisible, children, onClose }: ExpansionAreaProps) {
  if (!isVisible) return null;

  return (
    <div className="flex justify-center w-full">
      <div
        className={`
          mt-3 w-[340px] max-h-[400px] overflow-auto
          bg-[rgba(30,27,75,0.9)] backdrop-blur-2xl
          rounded-2xl border border-indigo-300/15
          shadow-[0_8px_32px_rgba(99,102,241,0.2)]
          animate-in slide-in-from-top-2 fade-in duration-300
        `}
      >
        {/* Close button */}
        <div className="sticky top-0 z-10 flex justify-end p-2 bg-gradient-to-b from-[rgba(30,27,75,0.95)] to-transparent">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-indigo-300/10 hover:bg-indigo-300/20 
                       border border-indigo-300/15 transition-all duration-200
                       text-indigo-200 hover:text-indigo-100"
            aria-label="Close expansion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 -mt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
