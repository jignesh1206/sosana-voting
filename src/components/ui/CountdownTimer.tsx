'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string | Date;
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
  mode?: 'starts' | 'ends' | 'auto';
  size?: 'sm' | 'md' | 'lg';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ 
  targetDate, 
  className = '',
  showLabels = true,
  compact = false,
  mode = 'auto',
  size = 'md'
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
        setIsStarted(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        setIsStarted(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const getPrefix = () => {
    if (mode === 'starts') return 'Starts in:';
    if (mode === 'ends') return 'Ends in:';
    return isStarted ? 'Started' : 'Starts in:';
  };

  if (isExpired && mode === 'ends') {
    return (
      <span className={`text-red-500 font-medium ${getSizeClasses()} ${className}`}>
        {compact ? 'Expired' : 'Time Expired'}
      </span>
    );
  }

  if (isStarted && mode === 'starts') {
    return (
      <span className={`text-green-500 font-medium ${getSizeClasses()} ${className}`}>
        {compact ? 'Started' : 'Already Started'}
      </span>
    );
  }

  if (compact) {
    return (
      <span className={`font-mono text-accent ${getSizeClasses()} ${className}`}>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {timeLeft.hours > 0 && `${timeLeft.hours}h `}
        {timeLeft.minutes > 0 && `${timeLeft.minutes}m `}
        {timeLeft.seconds}s
      </span>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={`text-foreground/60 ${getSizeClasses()}`}>{getPrefix()}</span>
      {timeLeft.days > 0 && (
        <div className="flex items-center space-x-1">
          <span className={`font-mono font-bold text-accent ${getSizeClasses()}`}>{timeLeft.days}</span>
          {showLabels && <span className={`text-foreground/60 ${getSizeClasses()}`}>days</span>}
        </div>
      )}
      {timeLeft.hours > 0 && (
        <div className="flex items-center space-x-1">
          <span className={`font-mono font-bold text-accent ${getSizeClasses()}`}>{timeLeft.hours}</span>
          {showLabels && <span className={`text-foreground/60 ${getSizeClasses()}`}>hours</span>}
        </div>
      )}
      <div className="flex items-center space-x-1">
        <span className={`font-mono font-bold text-accent ${getSizeClasses()}`}>{timeLeft.minutes}</span>
        {showLabels && <span className={`text-foreground/60 ${getSizeClasses()}`}>min</span>}
      </div>
      <div className="flex items-center space-x-1">
        <span className={`font-mono font-bold text-accent ${getSizeClasses()}`}>{timeLeft.seconds}</span>
        {showLabels && <span className={`text-foreground/60 ${getSizeClasses()}`}>sec</span>}
      </div>
    </div>
  );
} 