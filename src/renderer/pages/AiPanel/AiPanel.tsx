import { useState, useEffect, useCallback, useRef } from 'react';
import { getControllers } from './controllers';
import { PanelHeader } from './components/PanelHeader';
import { SwipeContainer } from './components/SwipeContainer';
import { ControllerDots } from './components/ControllerDots';
import { ExpansionArea } from './components/ExpansionArea';
import type { SwipeDirection, ControllerPlugin } from './types';

// Panel size constants
const COLLAPSED_SIZE = { width: 220, height: 70 };
const EXPANDED_SIZE = { width: 360, height: 180 };
const EXPANSION_HEIGHT = 450; // Extra height for expansion area

// Try to resize the window (only works in secondary window context)
function resizeWindow(width: number, height: number) {
  try {
    window.electronApi?.resizeSecondaryWindow?.(width, height);
  } catch {
    // Silently fail if not in Electron context or not secondary window
  }
}

export default function AiPanel() {
  const [isHovered, setIsHovered] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expansionVisible, setExpansionVisible] = useState(false);
  const [expansionData, setExpansionData] = useState<unknown>(null);
  
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const controllers = getControllers();

  // Simulate audio level
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Listen for click-outside events
  useEffect(() => {
    const cleanup = window.electronApi?.onCloseAiPanelExpansion?.(() => {
      setExpansionVisible(false);
      setExpansionData(null);
    });
    return cleanup;
  }, []);

  // Resize window based on state
  useEffect(() => {
    if (expansionVisible) {
      resizeWindow(EXPANDED_SIZE.width, EXPANDED_SIZE.height + EXPANSION_HEIGHT);
    } else if (isHovered) {
      resizeWindow(EXPANDED_SIZE.width, EXPANDED_SIZE.height);
    } else {
      resizeWindow(COLLAPSED_SIZE.width, COLLAPSED_SIZE.height);
    }
  }, [isHovered, expansionVisible]);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  // Handle swipe navigation
  const handleSwipe = useCallback((direction: SwipeDirection) => {
    setActiveIndex((prev) => {
      if (direction === 'left') {
        return Math.min(prev + 1, controllers.length - 1);
      }
      return Math.max(prev - 1, 0);
    });
    // Reset expansion when switching controllers
    setExpansionVisible(false);
    setExpansionData(null);
  }, [controllers.length]);

  // Handle dot click
  const handleDotSelect = useCallback((index: number) => {
    setActiveIndex(index);
    setExpansionVisible(false);
    setExpansionData(null);
  }, []);

  // Close expansion
  const handleCloseExpansion = useCallback(() => {
    setExpansionVisible(false);
    setExpansionData(null);
  }, []);

  // Get active controller
  const activeController = controllers[activeIndex];

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-1000 flex flex-col items-center">
      {/* Main Panel */}
      <div
        className={`
          relative backdrop-blur-2xl
          rounded-2xl border border-indigo-300/15
          shadow-[0_8px_32px_rgba(99,102,241,0.15),0_2px_8px_rgba(0,0,0,0.1)]
          transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] select-none overflow-hidden
          ${isHovered ? 'w-[340px] bg-[rgba(15,10,40,0.95)]' : 'w-[200px] bg-[rgba(30,27,75,0.85)]'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Drag Handle (Invisible Top Strip) */}
        <div
          className="absolute top-0 left-0 w-full h-4 z-[1100] cursor-move"
          style={{ WebkitAppRegion: 'drag' } as any}
        />

        {/* Header (Interactive) */}
        <div className="relative z-10">
          <PanelHeader audioLevel={audioLevel} />
        </div>

        {/* Controls Area - always render but animate height */}
        <div
          className={`
            overflow-hidden transition-all duration-500 ease-out
            ${isHovered ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          {/* Swipeable Controllers */}
          <div className="h-[72px]">
            <SwipeContainer
              activeIndex={activeIndex}
              totalItems={controllers.length}
              onSwipe={handleSwipe}
              className="h-full"
            >
              {controllers.map((controller: ControllerPlugin) => (
                <div
                  key={controller.id}
                  className="flex-shrink-0 w-[340px] flex items-center justify-center"
                >
                  <controller.component
                    isActive={controller.id === activeController?.id}
                    setExpansionVisible={setExpansionVisible}
                    setExpansionData={setExpansionData}
                  />
                </div>
              ))}
            </SwipeContainer>
          </div>

          {/* Dots */}
          <ControllerDots
            total={controllers.length}
            activeIndex={activeIndex}
            onSelect={handleDotSelect}
          />
        </div>
      </div>

      {/* Expansion Area - centered below panel */}
      {activeController?.expansionComponent && (
        <ExpansionArea isVisible={expansionVisible} onClose={handleCloseExpansion}>
          <activeController.expansionComponent
            isExpanded={expansionVisible}
            data={expansionData}
            onClose={handleCloseExpansion}
          />
        </ExpansionArea>
      )}
    </div>
  );
}
