import { clsx } from 'clsx';
import { useTheme } from '../../contexts/ThemeContext';

export function Button({ className, variant = 'default', size = 'md', children, ...props }) {
  const { c, isDark } = useTheme();

  const themeTeal = isDark ? '#1ABC9C' : c.teal;
  const themeTealHover = isDark ? '#17A589' : c.tealHover;
  const themeTealGlow = isDark ? 'rgba(26,188,156,0.4)' : c.tealGlow;

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5': variant === 'default',
          'text-[#0A2318] hover:bg-gray-100': variant === 'white',
          'border hover:text-white': variant === 'outline',
          'hover:text-white': variant === 'ghost',
        },
        {
          'text-sm px-4 py-2': size === 'sm',
          'text-base px-6 py-3': size === 'md',
          'text-lg px-8 py-4': size === 'lg',
        },
        className,
      )}
      style={{
        backgroundColor: variant === 'default' ? themeTeal : variant === 'outline' && c.tagBg,
        backgroundImage: variant === 'outline' ? 'none' : variant === 'ghost' ? 'none' : undefined,
        borderColor: variant === 'outline' ? c.teal : variant === 'white' ? c.border : undefined,
        color: variant === 'default' ? '#FFFFFF' : variant === 'outline' ? c.teal : variant === 'ghost' ? c.teal : undefined,
        boxShadow: variant === 'default' ? `0 4px 16px ${themeTealGlow}` : variant === 'outline' || variant === 'ghost' ? 'none' : undefined,
      }}
      onMouseEnter={e => {
        if (variant === 'outline' || variant === 'ghost') {
          e.currentTarget.style.backgroundColor = c.teal;
          e.currentTarget.style.color = '#FFFFFF';
          if (variant === 'outline') e.currentTarget.style.borderColor = c.teal;
        }
        if (variant === 'default') {
          e.currentTarget.style.boxShadow = `0 6px 20px ${themeTealGlow}`;
        }
      }}
      onMouseLeave={e => {
        if (variant === 'outline' || variant === 'ghost') {
          e.currentTarget.style.backgroundColor = variant === 'outline' ? c.tagBg : 'transparent';
          e.currentTarget.style.color = c.teal;
          if (variant === 'outline') e.currentTarget.style.borderColor = c.teal;
        }
        if (variant === 'default') {
          e.currentTarget.style.boxShadow = `0 4px 16px ${themeTealGlow}`;
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}
