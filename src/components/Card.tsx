import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  card?: CardType;
  hidden?: boolean;
  className?: string;
  index?: number;
  isRubbing?: boolean;
  onRub?: (progress: number) => void;
}

export const Card: React.FC<CardProps> = ({ card, hidden, className, index = 0, isRubbing = false, onRub = (_p: number) => {} }) => {
  const [localProgress, setLocalProgress] = React.useState(0);
  const isRed = card?.suit === '♥' || card?.suit === '♦';

  const handleMove = (clientY: number, currentTarget: HTMLElement) => {
    if (!isRubbing) return;
    const rect = currentTarget.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setLocalProgress(progress);
    onRub(progress);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY, e.currentTarget);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) { // Left button pressed
      handleMove(e.clientY, e.currentTarget);
    }
  };

  if (hidden || !card) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0, rotateY: 180 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 20 }}
        className={cn(
          "w-12 h-16 sm:w-16 sm:h-24 bg-gradient-to-br from-blue-800 to-blue-950 rounded-lg border-2 border-blue-400/30 shadow-lg flex items-center justify-center relative overflow-hidden group",
          className
        )}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="w-full h-full border-4 border-blue-700/50 rounded-lg flex items-center justify-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-400/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
             <div className="w-2 h-2 bg-blue-400/40 rounded-full" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 20 }}
      onTouchMove={handleTouchMove}
      onMouseMove={handleMouseMove}
      className={cn(
        "w-12 h-16 sm:w-16 sm:h-24 bg-white rounded-lg shadow-xl flex flex-col p-1 sm:p-2 relative border border-slate-200 overflow-hidden select-none",
        className
      )}
    >
      <div className={cn("text-[10px] sm:text-xs font-bold leading-none", isRed ? "text-red-600" : "text-slate-900")}>
        {card.value}
      </div>
      <div className={cn("text-[8px] sm:text-[10px] leading-none", isRed ? "text-red-600" : "text-slate-900")}>
        {card.suit}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <span className={cn("text-lg sm:text-2xl", isRed ? "text-red-600" : "text-slate-900")}>
          {card.suit}
        </span>
      </div>
      <div className={cn("text-[10px] sm:text-xs font-bold leading-none self-end rotate-180", isRed ? "text-red-600" : "text-slate-900")}>
        {card.value}
      </div>

      {isRubbing && localProgress < 0.95 && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-950 z-10 transition-transform duration-75 origin-top-left shadow-2xl"
          style={{ 
            transform: `translateY(${localProgress * 100}%) rotate(${-localProgress * 15}deg)`,
            boxShadow: `0 -10px 20px rgba(0,0,0,0.5)`
          }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {/* Peeling Edge */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-yellow-500 to-transparent opacity-80" />
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/50" />
        </div>
      )}
    </motion.div>
  );
};
