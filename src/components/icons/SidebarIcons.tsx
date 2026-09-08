import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Custom uploaded workflow icon:
 * 5-node network graph (cross topology)
 */
export const WorkflowIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="6.8" y1="6.8" x2="10.2" y2="10.2" />
    <line x1="17.2" y1="6.8" x2="13.8" y2="10.2" />
    <line x1="6.8" y1="17.2" x2="10.2" y2="13.8" />
    <line x1="17.2" y1="17.2" x2="13.8" y2="13.8" />
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="5" cy="5" r="2.5" />
    <circle cx="19" cy="5" r="2.5" />
    <circle cx="5" cy="19" r="2.5" />
    <circle cx="19" cy="19" r="2.5" />
  </svg>
);

/**
 * Custom uploaded daily tasks icon:
 * Clipboard with top clip and checklist items
 */
export const DailyTasksIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
    <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
    <path d="m8 11 1.5 1.5 3-3" />
    <line x1="14" y1="11" x2="17" y2="11" />
    <path d="m8 16 1.5 1.5 3-3" />
    <line x1="14" y1="16" x2="17" y2="16" />
  </svg>
);

/**
 * Custom uploaded ticket system icon:
 * Vertical perforated ticket voucher
 */
export const TicketSystemIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M5 2h14v3.5a1.5 1.5 0 0 0 0 3V10a1.5 1.5 0 0 0 0 3v1.5a1.5 1.5 0 0 0 0 3V22H5v-4.5a1.5 1.5 0 0 0 0-3V13a1.5 1.5 0 0 0 0-3V8.5a1.5 1.5 0 0 0 0-3V2z" />
    <line x1="12" y1="3" x2="12" y2="21" strokeDasharray="2 2" />
  </svg>
);

/**
 * Custom uploaded bulk tasks icon:
 * 3 stacked isometric layers/plates
 */
export const BulkTasksIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 2L21 7L12 12L3 7Z" />
    <path d="M3 12L12 17L21 12" />
    <path d="M3 17L12 22L21 17" />
  </svg>
);

/**
 * Custom uploaded timeline icon:
 * Horizontal track with alternating milestone pins
 */
export const TimelineIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="6" y1="12" x2="6" y2="7" />
    <circle cx="6" cy="5" r="2" />
    <line x1="12" y1="12" x2="12" y2="17" />
    <circle cx="12" cy="19" r="2" />
    <line x1="18" y1="12" x2="18" y2="7" />
    <circle cx="18" cy="5" r="2" />
  </svg>
);

/**
 * Custom uploaded graph icon:
 * Coordinate axes with multi-point rising trend line
 */
export const GraphIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3 3v18h18" />
    <path d="M4 17l6-6 4 4 6-10" />
    <circle cx="4" cy="17" r="1.5" fill="currentColor" />
    <circle cx="10" cy="11" r="1.5" fill="currentColor" />
    <circle cx="14" cy="15" r="1.5" fill="currentColor" />
    <circle cx="20" cy="5" r="1.5" fill="currentColor" />
  </svg>
);

/**
 * Custom uploaded chat icon:
 * Rounded chat bubble with 3 dots
 */
export const ChatIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M20 4H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3v4l4.5-4H20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <circle cx="8" cy="10.5" r="1" fill="currentColor" />
    <circle cx="12" cy="10.5" r="1" fill="currentColor" />
    <circle cx="16" cy="10.5" r="1" fill="currentColor" />
  </svg>
);

/**
 * Custom uploaded meetings icon:
 * Two users side-by-side
 */
export const MeetingsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="9" cy="7" r="3.5" />
    <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="17" cy="8" r="2.5" />
    <path d="M15 13.5c.6-.3 1.3-.5 2-.5 2.5 0 4.5 1.8 4.5 4.5v1.5" />
  </svg>
);

/**
 * Custom uploaded rewards icon:
 * Winner trophy cup
 */
export const RewardsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M6 3h12v6a6 6 0 0 1-12 0V3z" />
    <path d="M6 5H3.5a1.5 1.5 0 0 0-1.5 1.5v1A3.5 3.5 0 0 0 5.5 11H6" />
    <path d="M18 5h2.5a1.5 1.5 0 0 1 1.5 1.5v1A3.5 3.5 0 0 1 18.5 11H18" />
    <line x1="12" y1="15" x2="12" y2="19" />
    <path d="M8 21h8" />
  </svg>
);

/**
 * Custom uploaded dashboard icon:
 * Gauge / speedometer with needle
 */
export const DashboardIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M4 16a8.5 8.5 0 1 1 16 0" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    <line x1="12" y1="16" x2="16.5" y2="10" />
  </svg>
);

/**
 * Custom Forms builder / survey icon:
 * Structured form sheet with checkboxes and fields
 */
export const FormsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m9 15 2 2 4-4" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </svg>
);

