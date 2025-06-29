import React from 'react';
import { getRatingClass } from '@/lib/rating';

interface UsernameDisplayProps {
  username: string;
  rating: number;
  className?: string;
}

export default function UsernameDisplay({ 
  username, 
  rating, 
  className = '' 
}: UsernameDisplayProps) {
  const ratingClass = getRatingClass(rating);
  
  if (rating >= 3000) {
    // Username với chữ cái đầu màu đỏ nhạt, phần còn lại màu đỏ như grandmaster (#e00)
    const firstChar = username.charAt(0);
    const restChars = username.slice(1);
    
    return (
      <span className={`${className}`}>
        <span style={{ color: '#ff6b6b' }}>{firstChar}</span>
        <span style={{ color: '#e00' }}>{restChars}</span>
      </span>
    );
  }
  
  return (
    <span className={`${ratingClass} ${className}`}>
      {username}
    </span>
  );
}
