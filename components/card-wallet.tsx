'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ChevronRight, CircleCheck as CheckCircle2, X, TriangleAlert as AlertTriangle, Zap, Lock } from 'lucide-react'
import { CARDS_CONFIG, CreditCard, Category, CATEGORIES, calculateReward, getCardRule } from '@/lib/cards-config'

interface CardWalletProps {
  ownedCards: string[]
  cardSpending: Record<string, Record<Category, number>>
  onToggleOwn: (cardId: string) => void
  onUpdateSpending: (cardId: string, category: Category, amount: number) => void
}

export function CardWallet({
  ownedCards,
  cardSpending,
  onToggleOwn,
  onUpdateSpending,
}: CardWalletProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<string | null>(null)

  const ownedCardDetails = CARDS_CONFIG.filter((card) => ownedCards.includes(card.id))

  const getTotalSpending = (cardId: string) => {
    const spending = cardSpending[cardId]
    if (!spending) return 0
    return Object.values(spending).reduce((sum, val) => sum + val, 0)
  }

  const getCardStatus = (card: CreditCard) => {
    const spending = cardSpending[card.id]
    const totalSpend = getTotalSpending(card.id)

    // Find the primary rule with cap/threshold
    const primaryRule = card.rules.find((r) => r.monthlyCap || r.monthlyRewardCap || r.minSpend)
    if (!primaryRule) {
      return { status: 'earning' as const, remaining: 0, cap: 0, threshold: 0, thresholdRemaining: 0 }
    }

    // Check threshold first
    if (primaryRule.minSpend && totalSpend < primaryRule.minSpend) {
      return {
        status: 'threshold' as const,
        remaining: primaryRule.monthlyCap || 0,
        cap: primaryRule.monthlyCap || 0,
        threshold: primaryRule.minSpend,
        thresholdRemaining: primaryRule.minSpend - totalSpend,
      }
    }

    // Calculate relevant spending for cap
    const relevantCategories = Array.isArray(primaryRule.category)
      ? primaryRule.category
      : [primaryRule.category]
    
    const totalRelevantSpending = relevantCategories.reduce(
      (sum, cat) => sum + (spending?.[cat] || 0),
      0
    )

    if (primaryRule.monthlyCap) {
      const remaining = Math.max(0, primaryRule.monthlyCap - totalRelevantSpending)
      return {
        status: remaining <= 0 ? 'maxed' as const : 'earning' as const,
        remaining,
        cap: primaryRule.monthlyCap,
        threshold: primaryRule.minSpend || 0,
        thresholdRemaining: 0,
      }
    }

    if (primaryRule.monthlyRewardCap) {
      const currentReward = totalRelevantSpending * (primaryRule.rate / 100)
      const remainingReward = Math.max(0, primaryRule.monthlyRewardCap - currentReward)
      const remaining = remainingReward / (primaryRule.rate / 100)
      return {
        status: remainingReward <= 0 ? 'maxed' as const : 'earning' as const,
        remaining: Math.round(remaining),
        cap: Math.round(primaryRule.monthlyRewardCap / (primaryRule.rate / 100)),
        threshold: primaryRule.minSpend || 0,
        thresholdRemaining: 0,
      }
    }

    return { status: 'earning' as const, remaining: 0, cap: 0, threshold: 0, thresholdRemaining: 0 }
  }

  const getStatusColor = (status: 'threshold' | 'earning' | 'maxed') => {
    switch (status) {
      case 'threshold': return 'bg-white/20'
      case 'maxed': return 'bg-red-500'
      default: return 'bg-emerald-500'
    }
  }

  const getStatusTextColor = (status: 'threshold' | 'earning' | 'maxed') => {
    switch (status) {
      case 'threshold': return 'text-amber-400'
      case 'maxed': return 'text-red-400'
      default: return 'text-emerald-400'
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="
          fixed bottom-6 right-6 z-40
          flex items-center gap-3 px-5 py-4 rounded-2xl
          bg-gradient-to-r from-emerald-500 to-teal-500
          text-black font-bold shadow-lg shadow-emerald-500/30
          hover:shadow-xl hover:shadow-emerald-500/40
          transition-all duration-300
        "
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Wallet className="w-5 h-5" />
        <span>我的卡包</span>
        {ownedCards.length > 0 && (
          <span className="
            flex items-center justify-center w-6 h-6 rounded-full
            bg-black/20 text-sm
          ">
            {ownedCards.length}
          </span>
        )}
      </motion.button>

      {/* Modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="
                fixed inset-x-0 bottom-0 z-50
                max-h-[85vh] overflow-hidden
                rounded-t-3xl bg-black/95 backdrop-blur-xl
                border-t border-white/10
              "
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between p-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">我的卡包</h2>
                    <p className="text-sm text-white/50">
                      管理你持有嘅信用卡同本月簽賬
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Card list */}
              <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-5 space-y-4">
                {/* Owned cards section */}
                {ownedCardDetails.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wider">
                      已持有 ({ownedCardDetails.length})
                    </h3>
                    {ownedCardDetails.map((card) => {
                      const cardStatus = getCardStatus(card)
                      const totalSpending = getTotalSpending(card.id)
                      const isEditing = editingCard === card.id
                      const progressPercent = cardStatus.cap > 0 
                        ? Math.min(100, ((cardStatus.cap - cardStatus.remaining) / cardStatus.cap) * 100)
                        : 0

                      return (
                        <motion.div
                          key={card.id}
                          layout
                          className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                        >
                          <div
                            className="flex items-center gap-4 p-4 cursor-pointer"
                            onClick={() => setEditingCard(isEditing ? null : card.id)}
                          >
                            {/* Card color indicator */}
                            <div className={`w-12 h-8 rounded-md bg-gradient-to-r ${card.color}`} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white truncate">
                                  {card.bank} {card.name}
                                </span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              </div>
                              <div className="text-sm text-white/50">
                                本月累積: ${totalSpending.toLocaleString()}
                              </div>
                            </div>

                            {/* Status indicator */}
                            <div className="text-right min-w-[100px]">
                              <div className={`text-sm font-medium flex items-center justify-end gap-1 ${getStatusTextColor(cardStatus.status)}`}>
                                {cardStatus.status === 'threshold' && (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>差 ${cardStatus.thresholdRemaining.toLocaleString()}</span>
                                  </>
                                )}
                                {cardStatus.status === 'earning' && cardStatus.cap > 0 && (
                                  <>
                                    <Zap className="w-3 h-3" />
                                    <span>剩 ${cardStatus.remaining.toLocaleString()}</span>
                                  </>
                                )}
                                {cardStatus.status === 'earning' && cardStatus.cap === 0 && (
                                  <span className="text-white/50">無上限</span>
                                )}
                                {cardStatus.status === 'maxed' && (
                                  <>
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>已簽爆</span>
                                  </>
                                )}
                              </div>
                              {cardStatus.cap > 0 && (
                                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1 ml-auto">
                                  {cardStatus.status === 'threshold' ? (
                                    <motion.div
                                      className="h-full bg-white/20 rounded-full"
                                      initial={{ opacity: 0.3 }}
                                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                      style={{ width: '100%' }}
                                    />
                                  ) : (
                                    <div
                                      className={`h-full rounded-full ${getStatusColor(cardStatus.status)}`}
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            <ChevronRight
                              className={`w-5 h-5 text-white/30 transition-transform ${isEditing ? 'rotate-90' : ''}`}
                            />
                          </div>

                          {/* Spending editor */}
                          <AnimatePresence>
                            {isEditing && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-white/10"
                              >
                                <div className="p-4 space-y-3">
                                  <p className="text-xs text-white/50">
                                    輸入本月各類別已簽賬金額，系統會自動計算剩餘優惠額度
                                  </p>
                                  <div className="grid grid-cols-2 gap-3">
                                    {CATEGORIES.map((cat) => (
                                      <div key={cat.id}>
                                        <label className="text-xs text-white/50 mb-1 block">
                                          {cat.label}
                                        </label>
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                                            $
                                          </span>
                                          <input
                                            type="number"
                                            inputMode="decimal"
                                            value={cardSpending[card.id]?.[cat.id] || ''}
                                            onChange={(e) =>
                                              onUpdateSpending(
                                                card.id,
                                                cat.id,
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                            placeholder="0"
                                            className="
                                              w-full pl-7 pr-3 py-2 rounded-lg
                                              bg-white/5 border border-white/10
                                              text-white text-sm
                                              focus:outline-none focus:border-emerald-500
                                              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                                            "
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => onToggleOwn(card.id)}
                                    className="
                                      w-full py-2 rounded-lg
                                      border border-red-500/30 text-red-400 text-sm
                                      hover:bg-red-500/10 transition-colors
                                    "
                                  >
                                    移除此卡
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {/* Unowned cards section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">
                    可添加
                  </h3>
                  {CARDS_CONFIG.filter((card) => !ownedCards.includes(card.id)).map((card) => (
                    <motion.button
                      key={card.id}
                      layout
                      onClick={() => onToggleOwn(card.id)}
                      className="
                        w-full flex items-center gap-4 p-4
                        rounded-xl bg-white/5 border border-white/10
                        hover:bg-white/10 transition-colors text-left
                      "
                    >
                      <div className={`w-12 h-8 rounded-md bg-gradient-to-r ${card.color}`} />
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {card.bank} {card.name}
                        </div>
                        <div className="text-sm text-white/50">
                          {card.rules[0]?.description || `基本回贈 ${card.defaultRate}%`}
                        </div>
                      </div>
                      <div className="text-emerald-400 text-sm font-medium">
                        + 添加
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
