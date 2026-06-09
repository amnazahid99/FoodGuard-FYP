import { clsx } from 'clsx';

export function Button({ className, variant = 'default', size = 'md', children, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-[#1ABC9C] text-white hover:bg-[#17A589] shadow-lg hover:shadow-teal-500/30': variant === 'default',
          'bg-white text-[#0A2318] hover:bg-gray-100':                                    variant === 'white',
          'border border-[#1ABC9C] text-[#1ABC9C] hover:bg-[#1ABC9C]/10':                  variant === 'outline',
          'text-[#1ABC9C] hover:bg-[#1ABC9C]/10':                                          variant === 'ghost',
        },
        {
          'text-sm px-3 py-1.5':  size === 'sm',
          'text-base px-5 py-2.5': size === 'md',
          'text-lg px-7 py-3':    size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
