/**
 * Apple-style Design System
 * Minimal black & white components
 */

export const AppleButton = ({ 
  children, 
  variant = 'primary',
  onClick,
  type = 'button',
  className = '',
  disabled = false
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-black border-2 border-black hover:bg-gray-50',
    ghost: 'text-gray-700 hover:text-black hover:bg-gray-50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const AppleCard = ({ 
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl p-8 ${className}`}>
      {children}
    </div>
  );
};

export const AppleInput = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  ...props
}: {
  label: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  [key: string]: any;
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-black">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export const AppleSelect = ({
  label,
  value,
  onChange,
  options,
  error
}: {
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  error?: string;
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-black">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black appearance-none cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
