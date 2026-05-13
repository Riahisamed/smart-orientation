import React, { forwardRef } from 'react'

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> & {
  value?: string | number | null
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      placeholder,
      value,
      onChange,
      className,
      id,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    // Only apply value prop when explicitly provided (not undefined)
    // This allows uncontrolled inputs to work normally
    const hasValue = value !== undefined
    const stringValue = value === null ? '' : String(value ?? '')
    return (
      <input
        ref={ref}
        id={id}
        type={type}
        placeholder={placeholder}
        {...(hasValue ? { value: stringValue } : {})}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-400 ${className || ''}`}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

