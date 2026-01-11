
import React from 'react';
import * as LucideIcons from 'lucide-react';

interface AppIconProps {
  name: keyof typeof LucideIcons | 'CloudCheck';
  size?: number;
  className?: string;
  strokeWidth?: number;
  onClick?: () => void;
}

const AppIcon: React.FC<AppIconProps> = ({ name, size = 20, className = '', strokeWidth, onClick }) => {
  let IconComponent;
  
  if (name === 'CloudCheck') {
    IconComponent = LucideIcons.CloudUpload;
  } else {
    IconComponent = (LucideIcons[name as keyof typeof LucideIcons] as React.ElementType) || LucideIcons.HelpCircle;
  }
  
  return <IconComponent size={size} className={className} strokeWidth={strokeWidth} onClick={onClick} />;
};

export default AppIcon;
