import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Question } from '../types';

interface CardProps {
  question: Question;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  index: number;
  triggerAction: 'left' | 'right' | 'up' | 'down' | null;
  totalCards: number;
}

export const Card: React.FC<CardProps> = ({ question, onSwipe, index, triggerAction, totalCards }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Entrance Animation
  useEffect(() => {
    // Small delay to trigger entrance transition
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, [question.id]);

  // Handle external triggers (buttons)
  useEffect(() => {
    // Only apply trigger to the top card
    if (triggerAction && index === 0) {
      let targetX = 0;
      let targetY = 0;
      const distance = 800; // Fly off screen distance

      switch (triggerAction) {
        case 'left': targetX = -distance; break;
        case 'right': targetX = distance; break;
        case 'up': 
          // For 'up' (Answer), we don't fly the card away immediately.
          // The modal opens ON TOP. The card stays put until the modal closes (Next Question).
          // We reset position to center to ensure it looks grounded under the modal.
          setPosition({ x: 0, y: 0 });
          onSwipe('up');
          return; 
        case 'down': targetY = distance; break;
      }

      setPosition({ x: targetX, y: targetY });
      
      // Wait for animation to finish before calling handler (exit transition)
      const timeout = setTimeout(() => {
        onSwipe(triggerAction);
      }, 300); // Match CSS transition duration

      return () => clearTimeout(timeout);
    }
  }, [triggerAction, index, onSwipe]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (index !== 0) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setPosition({ x: dx, y: dy });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);

    const threshold = 80; // Reduced threshold for easier swipes
    const distance = 800;

    // Check if threshold exceeded, then animate out, THEN call onSwipe
    if (position.x > threshold) {
      // Swipe Right -> DESCARTAR
      setPosition({ x: distance, y: 0 });
      setTimeout(() => onSwipe('right'), 300);
    } else if (position.x < -threshold) {
      // Swipe Left -> PASAR
      setPosition({ x: -distance, y: 0 });
      setTimeout(() => onSwipe('left'), 300);
    } else if (position.y < -threshold) {
      // Swipe Up -> RESPONDER
      // Reset position so it stays centered under modal
      setPosition({ x: 0, y: 0 }); 
      onSwipe('up'); 
    } else if (position.y > threshold) {
      // Swipe Down -> GUARDAR
      setPosition({ x: 0, y: distance });
      setTimeout(() => onSwipe('down'), 300);
    } else {
      // Reset
      setPosition({ x: 0, y: 0 });
    }
  };

  // Rotation based on X movement
  const rotation = position.x * 0.05; 
  
  // Opacity for hints
  const rightOpacity = Math.min(position.x / 100, 1);
  const leftOpacity = Math.min(-position.x / 100, 1);
  const upOpacity = Math.min(-position.y / 100, 1);
  const downOpacity = Math.min(position.y / 100, 1);

  // Dynamic Styles
  const isTopCard = index === 0;
  const isSecondCard = index === 1;
  
  // Use a spring-like transition for dragging reset, linear for dragging
  const transitionClass = isDragging ? '' : 'transition-transform duration-300 ease-out';
  
  const entranceScale = isMounted ? 1 : 0.8;
  const entranceOpacity = isMounted ? 1 : 0;
  
  // Stack effect refinement
  // If top card, normal scale.
  // If second card, slightly smaller and lower.
  // Others hidden or very small.
  const stackScale = isTopCard ? 1 : Math.max(0.9, 1 - (index * 0.05)); 
  const stackTranslateY = isTopCard ? 0 : 12 + (index * 6);
  const stackRotation = isTopCard ? 0 : (index % 2 === 0 ? 2 : -2); // Subtle tilt for stack

  // Dynamic Font Size Logic
  const getFontSizeClass = (text: string) => {
    const length = text.length;
    if (length < 30) return 'text-4xl';
    if (length < 60) return 'text-3xl';
    if (length < 100) return 'text-2xl';
    return 'text-xl';
  };

  // Difficulty Color Logic
  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case 'Fácil': return 'bg-[#81B29A] text-[#1F2937]';
      case 'Medio': return 'bg-[#F2CC8F] text-[#1F2937]';
      case 'Difícil': return 'bg-[#E07A5F] text-[#FFFBF0]';
      default: return 'bg-[#98C1D9] text-[#1F2937]';
    }
  };

  // Only render top 2 cards for performance and visual clarity
  if (index > 2) return null;

  return (
    <div
      ref={cardRef}
      className={`w-full max-w-xs aspect-[3/4.2] bg-[#FFFBF0] rounded-[24px] cursor-grab active:cursor-grabbing touch-none select-none overflow-hidden border-2-charcoal ${transitionClass} col-start-1 row-start-1 absolute top-0 left-0 right-0 mx-auto origin-bottom`}
      style={{
        transform: `translate(${position.x}px, ${position.y + stackTranslateY}px) rotate(${rotation + stackRotation}deg) scale(${isTopCard ? entranceScale : stackScale})`,
        zIndex: 100 - index,
        boxShadow: isTopCard ? '6px 6px 0px 0px rgba(31, 41, 55, 0.2)' : 'none', 
        opacity: isTopCard ? entranceOpacity : 1 - (index * 0.3), // Fade out lower cards
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Decorative inner border */}
      <div className="absolute inset-1.5 border border-[#1F2937]/10 rounded-[18px] pointer-events-none"></div>

      {/* Visual Hints Overlays - Only for Top Card */}
      {isTopCard && (
        <>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 transition-opacity" style={{ opacity: rightOpacity }}>
                <div className="bg-[#E07A5F] text-[#FFFBF0] px-4 py-2 rounded-full transform -rotate-6 border-2-charcoal font-bold text-sm shadow-retro-sm flex items-center gap-2 tracking-wide">
                    <ArrowRight strokeWidth={2} size={18} /> DESCARTAR
                </div>
            </div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 transition-opacity" style={{ opacity: leftOpacity }}>
                <div className="bg-[#81B29A] text-[#1F2937] px-4 py-2 rounded-full transform rotate-6 border-2-charcoal font-bold text-sm shadow-retro-sm flex items-center gap-2 tracking-wide">
                    <ArrowLeft strokeWidth={2} size={18} /> PASAR
                </div>
            </div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 transition-opacity" style={{ opacity: upOpacity }}>
                <div className="bg-[#98C1D9] text-[#1F2937] px-4 py-2 rounded-full border-2-charcoal font-bold text-sm shadow-retro-sm flex items-center gap-2 tracking-wide">
                    <ArrowUp strokeWidth={2} size={18} /> RESPONDER
                </div>
            </div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 transition-opacity" style={{ opacity: downOpacity }}>
                <div className="bg-[#F2CC8F] text-[#1F2937] px-4 py-2 rounded-full border-2-charcoal font-bold text-sm shadow-retro-sm flex items-center gap-2 tracking-wide">
                    <ArrowDown strokeWidth={2} size={18} /> GUARDAR
                </div>
            </div>
        </>
      )}

      {/* Card Content */}
      <div className="h-full flex flex-col items-center p-8 text-center pointer-events-none relative z-10">
        
        <div className="mt-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#1F2937]/10 ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty || 'Normal'}
            </span>
        </div>
        
        <div className="flex-1"></div>
        
        <p className={`${getFontSizeClass(question.questionText)} font-bold tracking-tight text-[#1F2937] leading-tight drop-shadow-sm px-2 transition-all`}>
          {question.questionText}
        </p>
        
        <div className="flex-1"></div>

        <div className="text-[#3D405B] text-[10px] font-bold uppercase tracking-widest opacity-50">
            {isTopCard ? 'Desliza para jugar' : 'Siguiente pregunta'}
        </div>
        
        <div className="h-2"></div>
      </div>
    </div>
  );
};