import type { ReactNode } from 'react'

export const settingsInputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-100'

const clearButtonClassName =
  'inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-60'

interface SecretFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  hint: ReactNode
  configured?: boolean
  clearLabel: string
  configuredLabel: string
  onClear: () => void
  disabled?: boolean
}

export function SecretField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  configured,
  clearLabel,
  configuredLabel,
  onClear,
  disabled,
}: SecretFieldProps) {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <label htmlFor={id} className='block text-sm font-medium text-slate-700'>
          {label}
        </label>
        <input
          id={id}
          type='password'
          autoComplete='off'
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={settingsInputClassName}
        />
        <p className='text-xs leading-5 text-slate-500'>{hint}</p>
      </div>

      {configured && (
        <div className='flex flex-wrap items-center gap-3'>
          <button
            type='button'
            onClick={onClear}
            disabled={disabled}
            className={clearButtonClassName}
          >
            {clearLabel}
          </button>
          <span className='text-sm text-emerald-700'>{configuredLabel}</span>
        </div>
      )}
    </div>
  )
}
