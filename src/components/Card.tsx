import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Card as CardType } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  card?: CardType;
  index: number;
  hidden?: boolean;
  className?: string;
  isRubbing?: boolean;
  onRub?: (progress: number) => void;
}

export const Card = ({ card, index, hidden = false, className, isRubbing = false, onRub }: CardProps) => {
  const isRed = card && ['♥', '♦'].includes(card.suit);
  const controls = useAnimation();
  const [isFlipped, setIsFlipped] = useState(!hidden);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-100, 100], [-10, 10]);

  // Touch threshold logic
  const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);

  useEffect(() => {
    setIsFlipped(!hidden);
  }, [hidden]);

  useEffect(() => {
    if (isFlipped) {
      controls.start({ rotateY: 0 });
    } else {
      controls.start({ rotateY: 180 });
    }
  }, [isFlipped, controls]);

  const handleDragStart = (e: any, info: any) => {
    if (isRubbing && onRub) {
      touchStartRef.current = { x: info.point.x, y: info.point.y, time: Date.now() };
    }
  };

  const handleDrag = (e: any, info: any) => {
    if (isRubbing && onRub && touchStartRef.current) {
      const dx = info.point.x - touchStartRef.current.x;
      const dy = info.point.y - touchStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const timeElapsed = Date.now() - touchStartRef.current.time;

      // Anti-mistouch threshold: distance > 30px AND time > 200ms
      if (distance > 30 && timeElapsed > 200) {
        const progress = Math.min(1, Math.max(0, distance / 100));
        onRub(progress);
        
        if (progress > 0.5) {
          setIsFlipped(true);
        }
      }
    }
  };

  const handleDragEnd = () => {
    if (isRubbing) {
      x.set(0);
      y.set(0);
      touchStartRef.current = null;
    }
  };

  return (
    <motion.div
      drag={isRubbing}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate }}
      animate={controls}
      initial={{ rotateY: hidden ? 180 : 0, y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.1 
      }}
      className={cn(
        "relative w-16 h-24 sm:w-24 sm:h-36 rounded-xl sm:rounded-2xl shadow-2xl transform-gpu [transform-style:preserve-3d]",
        "border-2 border-white/10 touch-none",
        className
      )}
    >
      {/* Front */}
      <div 
        className={cn(
          "absolute inset-0 backface-hidden rounded-xl sm:rounded-2xl bg-white flex flex-col justify-between p-1.5 sm:p-2 overflow-hidden",
          !isFlipped && "opacity-0"
        )}
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
      >
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        
        {card && (
          <>
            <div className={cn("text-lg sm:text-2xl font-black leading-none", isRed ? "text-red-600" : "text-black")}>
              {card.value}
            </div>
            <div className={cn("text-2xl sm:text-4xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20", isRed ? "text-red-600" : "text-black")}>
              {card.suit}
            </div>
            <div className={cn("text-2xl sm:text-4xl absolute bottom-1.5 right-1.5 leading-none", isRed ? "text-red-600" : "text-black")}>
              {card.suit}
            </div>
          </>
        )}
      </div>

      {/* Back */}
      <div 
        className={cn(
          "absolute inset-0 backface-hidden rounded-xl sm:rounded-2xl overflow-hidden border-4 border-white",
          "bg-gradient-to-br from-red-800 to-red-950",
          isFlipped && "opacity-0"
        )}
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/argyle.png')]" />
        <div className="absolute inset-2 border-2 border-yellow-500/50 rounded-lg sm:rounded-xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-full border border-yellow-500/50 flex items-center justify-center rotate-45">
            <div className="w-4 h-4 sm:w-6 sm:h-6 bg-yellow-500/40 rounded-sm rotate-45" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
