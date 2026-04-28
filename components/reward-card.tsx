'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Zap, Lock, Check, Plane } from 'lucide-react'
import { useState } from 'react'
import { CreditCard, Category, calculateReward, getCardDescription } from '@/lib/cards-config'

interface RewardCardProps {
  card: CreditCard
  amount: number
  category: Category
  currentSpending: number
  totalMonthlySpend: number
  rank: number
  isThresholdPriority?: boolean
  onSelectCard: (cardId: string) => void
}

export function RewardCard({
  card,
  amount,
  category,
  currentSpending,
  totalMonthlySpend,
  rank,
  isThresholdPriority,
  onSelectCard,
}: RewardCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  
  const calculation = calculateReward(
    card,
    amount,
    category,
    currentSpending,
    totalMonthlySpend
  )

  const { reward, rate, status, remainingCap, thresholdRemaining, capTotal, activatedRate, miles, rewardType } = calculation

  const isTopCard = rank === 0
  const isDisabled = amount <= 0
  const isMilesCard = rewardType === 'miles'

  // Status display helpers
  const getStatusIcon = () => {
    switch (status) {
      case 'threshold':
        return <Lock className="w-3 h-3 text-amber-400" />
      case 'maxed':
        return <AlertTriangle className="w-3 h-3 text-red-400" />
      default:
        return <Zap className="w-3 h-3 text-emerald-400" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'threshold':
        return `差$${thresholdRemaining.toLocaleString()}啟動${activatedRate}%`
      case 'maxed':
        return `已爆Cap`
      default:
        return remainingCap > 0 ? `餘$${remainingCap.toLocaleString()}` : ''
    }
  }

  // Progress calculation
  const getProgressWidth = () => {
    if (status === 'threshold') return 0
    if (capTotal > 0) return Math.min(100, (currentSpending / capTotal) * 100)
    return 0
  }

  const getProgressColor = () => {
    if (status === 'threshold') return 'bg-white/20'
    if (status === 'maxed') return 'bg-red-500'
    const progress = getProgressWidth()
    if (progress >= 80) return 'bg-orange-500'
    return 'bg-emerald-500'
  }

  const handleClick = () => {
    if (isDisabled) return
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    onSelectCard(card.id)
    setShowConfirm(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: rank * 0.03 }}
      className={`
        relative overflow-hidden rounded-xl
        backdrop-blur-xl border transition-all duration-200
        ${isDisabled 
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer active:scale-[0.98]'
        }
        ${isTopCard
          ? 'border-emerald-500/50 bg-emerald-500/10'
          : isThresholdPriority
            ? 'border-amber-500/50 bg-amber-500/10'
            : 'border-white/10 bg-white/5 hover:bg-white/8'
        }
      `}
      onClick={handleClick}
    >
      {/* Compact main row */}
      <div className="flex items-center gap-3 p-3">
        {/* Rank badge */}
        <div className={`
          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
          ${isTopCard 
            ? 'bg-emerald-500 text-black' 
            : 'bg-white/10 text-white/60'
          }
        `}>
          {rank + 1}
        </div>

        {/* Card color bar */}
        <div className={`w-1 h-10 rounded-full bg-gradient-to-b ${card.color} shrink-0`} />

        {/* Card info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{card.name}</span>
            {isMilesCard && (
              <Plane className="w-3 h-3 text-amber-400 shrink-0" />
            )}
            {isTopCard && amount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[10px] font-bold shrink-0">
                TOP
              </span>
            )}
            {isThresholdPriority && !isTopCard && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold shrink-0">
                優先
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>{card.bank}</span>
            {getStatusText() && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  {getStatusIcon()}
                  {getStatusText()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Reward amount */}
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-emerald-400">
            ${reward.toFixed(1)}
          </div>
          {isMilesCard && miles !== undefined && miles > 0 && (
            <div className="flex items-center justify-end gap-1 text-xs text-amber-400">
              <Plane className="w-3 h-3" />
              <span>{Math.round(miles)} 里</span>
            </div>
          )}
          {!isMilesCard && (
            <div className="text-xs text-white/40">{rate.toFixed(1)}%</div>
          )}
        </div>
      </div>

      {/* Progress bar (always visible if has cap) */}
      {(capTotal > 0 || status === 'threshold') && (
        <div className="px-3 pb-2">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            {status === 'threshold' ? (
              <motion.div
                className="h-full bg-white/20 rounded-full"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: '100%' }}
              />
            ) : (
              <motion.div
                className={`h-full rounded-full ${getProgressColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${getProgressWidth()}%` }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
        </div>
      )}

      {/* Category description */}
      <div className="px-3 pb-2">
        <div className="text-[10px] text-white/40">
          {getCardDescription(card, category)}
        </div>
      </div>

      {/* Confirmation overlay - compact for iPhone */}
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-zinc-900 border-t border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-3">
            {/* Header + details in one line */}
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-white text-xs">
                確認用 <span className="font-semibold text-emerald-400">{card.name}</span>
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/60">${amount.toLocaleString()}</span>
                <span className="text-white/30">→</span>
                <span className="text-emerald-400 font-semibold">${reward.toFixed(2)}</span>
                {isMilesCard && miles !== undefined && miles > 0 && (
                  <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                    <Plane className="w-3 h-3" />
                    {Math.round(miles)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Buttons - compact height */}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowConfirm(false)
                }}
                className="flex-1 h-10 rounded-lg bg-white/10 text-white text-sm font-medium active:bg-white/20 transition-colors"
              >
                取消
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleConfirm()
                }}
                className="flex-1 h-10 rounded-lg bg-emerald-500 text-black text-sm font-bold active:bg-emerald-400 transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                確認
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
