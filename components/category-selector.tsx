'use client'

import { motion } from 'framer-motion'
import { ShoppingCart, UtensilsCrossed, Store, Plane, CreditCard } from 'lucide-react'
import { Category, CATEGORIES } from '@/lib/cards-config'

const ICONS = {
  ShoppingCart,
  UtensilsCrossed,
  Store,
  Plane,
  CreditCard,
}

interface CategorySelectorProps {
  selected: Category
  onChange: (category: Category) => void
}

export function CategorySelector({ selected, onChange }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {CATEGORIES.map((category) => {
        const Icon = ICONS[category.icon as keyof typeof ICONS]
        const isSelected = selected === category.id

        return (
          <motion.button
            key={category.id}
            onClick={() => onChange(category.id)}
            className={`
              relative aspect-square flex flex-col items-center justify-center gap-1 rounded-xl
              transition-all duration-300
              ${isSelected
                ? 'bg-emerald-500 text-black font-semibold'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }
            `}
            whileTap={{ scale: 0.95 }}
            layout
          >
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-emerald-500"
                layoutId="categoryHighlight"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex flex-col items-center gap-1">
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{category.label}</span>
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
