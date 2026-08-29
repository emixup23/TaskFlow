import React from 'react';
import { getTagStyle } from '../utils/tagColors';
import { X } from 'lucide-react';

interface TagBadgeProps {
  tag: string;
  size?: 'xs' | 'sm' | 'md';
  showDot?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  tag,
  size = 'xs',
  showDot = true,
  onRemove,
  onClick,
  className = ''
}) => {
  const style = getTagStyle(tag);

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 font-semibold',
    sm: 'text-xs px-2.5 py-0.5 font-semibold',
    md: 'text-xs px-3 py-1 font-semibold'
  }[size];

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded transition-all select-none ${style.badgeClass} ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:brightness-125' : ''
      } ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      )}
      <span className="truncate">{tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 p-0.2 rounded hover:bg-black/20 text-current transition-opacity cursor-pointer ml-0.5"
          title={`Remove ${tag}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
