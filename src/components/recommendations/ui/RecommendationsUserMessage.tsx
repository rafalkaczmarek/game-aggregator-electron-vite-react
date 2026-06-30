import { MAX_USER_MESSAGE_LENGTH } from '@shared/types/recommendations'

interface RecommendationsUserMessageProps {
  value: string
  disabled: boolean
  onChange: (value: string) => void
}

export default function RecommendationsUserMessage({
  value,
  disabled,
  onChange,
}: RecommendationsUserMessageProps) {
  return (
    <div className='mt-5 space-y-2'>
      <label htmlFor='recommendations-user-message' className='block text-sm font-medium text-slate-700'>
        Dodatkowe wskazówki (opcjonalnie)
      </label>
      <textarea
        id='recommendations-user-message'
        data-testid='recommendations-user-message'
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, MAX_USER_MESSAGE_LENGTH))}
        disabled={disabled}
        rows={3}
        placeholder='Np. szukam gier indie, RPG z otwartym światem albo krótkich tytułów na wieczór…'
        className='w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100 disabled:opacity-60'
      />
      <p className='text-xs leading-5 text-slate-500'>
        Krótka wiadomość trafi do promptu AI — możesz podać gatunek, nastrój lub inne preferencje.
      </p>
    </div>
  )
}
