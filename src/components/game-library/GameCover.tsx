import { useState } from 'react'
import type { Game } from '@shared/types/game'

interface GameCoverProps {
  game: Game
  className?: string
}

export default function GameCover({ game, className = '' }: GameCoverProps) {
  const [failed, setFailed] = useState(false)

  if (!game.coverUrl || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 ${className}`}
        aria-hidden
      >
        <svg className='h-8 w-8 opacity-60' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M6.75 7.5h10.5M6.75 12h10.5m-10.5 4.5h10.5M4.5 5.25h15a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z'
          />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={game.coverUrl}
      alt=''
      loading='lazy'
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}
