'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign } from 'lucide-react'

interface AmountInputProps {
  value: number
  onChange: (value: number) => void
}

export function AmountInput({ value, onChange }: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '')
    const numValue = parseFloat(rawValue) || 0
    onChange(numValue)
  }

  return (
    <motion.div
      className="relative"
      animate={{
        scale: isFocused ? 1.02 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-1 rounded-2xl bg-emerald-500/30 blur-xl"
        animate={{
          opacity: isFocused ? 1 : 0.3,
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Input container */}
      <div
        className={`
          relative rounded-2xl border-2 transition-all duration-300
          bg-black/60 backdrop-blur-xl
          ${isFocused 
            ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
            : 'border-white/10 hover:border-white/20'
          }
        `}
      >
        <div className="flex items-center gap-3 px-5 py-3">
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-lg
            transition-all duration-300
            ${isFocused ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/60'}
          `}>
            <DollarSign className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-white/50 text-xl">HK$</span>
              <input
                type="text"
                inputMode="decimal"
                value={value === 0 ? '' : value.toLocaleString()}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="0"
                className="
                  flex-1 bg-transparent text-3xl font-bold text-white
                  outline-none placeholder:text-white/20
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
