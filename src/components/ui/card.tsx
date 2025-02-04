import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className = '', children }) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export default Card;
