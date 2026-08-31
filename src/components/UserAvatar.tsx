import React, { useState } from 'react';
import { getSvgAvatarDataUrl } from '../utils/avatarUtils';

export interface UserAvatarProps {
  user?: {
    id?: string;
    name?: string;
    avatar?: string;
    status?: 'active' | 'inactive' | 'suspended';
  } | null;
  name?: string;
  avatar?: string;
  id?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showStatusIndicator?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  title?: string;
  onClick?: () => void;
}

const SIZE_CLASSES = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
  '2xl': 'w-16 h-16 text-lg'
};

const STATUS_SIZES = {
  xs: 'w-1.5 h-1.5 ring-1',
  sm: 'w-2 h-2 ring-1',
  md: 'w-2.5 h-2.5 ring-2',
  lg: 'w-3 h-3 ring-2',
  xl: 'w-3.5 h-3.5 ring-2',
  '2xl': 'w-4 h-4 ring-2'
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name: nameProp,
  avatar: avatarProp,
  id: idProp,
  size = 'md',
  className = '',
  showStatusIndicator = false,
  status: statusProp,
  title,
  onClick
}) => {
  const [imgError, setImgError] = useState(false);

  const name = user?.name || nameProp || 'User';
  const id = user?.id || idProp || name;
  const avatar = user?.avatar || avatarProp;
  const status = statusProp || user?.status || 'active';

  // SVG deterministic fallback
  const svgFallbackUrl = getSvgAvatarDataUrl(name || id || 'User');
  const finalSrc = !imgError && avatar ? avatar : svgFallbackUrl;

  const isSvg = finalSrc.startsWith('data:image/svg+xml') || finalSrc.endsWith('.svg');

  return (
    <div
      onClick={onClick}
      title={title !== undefined ? title : name}
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <img
        src={finalSrc}
        alt={name}
        onError={() => setImgError(true)}
        className={`${SIZE_CLASSES[size]} rounded-full object-cover border border-[#2d2d2d] bg-[#181818] ring-1 ring-[#383838] transition-transform duration-150 ${className}`}
        loading="lazy"
      />

      {showStatusIndicator && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-[#0d0d0d] ${
            STATUS_SIZES[size]
          } ${
            status === 'active'
              ? 'bg-emerald-500'
              : status === 'suspended'
              ? 'bg-rose-500'
              : 'bg-neutral-500'
          }`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
