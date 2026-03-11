import React, { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number;
  total: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({ 
  value, 
  total, 
  color, 
  size = 75, 
  strokeWidth = 8 
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = total > 0 ? (animatedValue / total) * 100 : 0;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Animate the progress value on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#d5d8dcff"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0px 2px 4px ${color}40)`
          }}
        />
      </svg>
      {/* Center number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[32px] font-bold text-white leading-none font-roboto text-shadow">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
