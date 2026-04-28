'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TriangleAlert as AlertTriangle, Zap, Lock, Trash2, Clock, Calendar, ChevronRight, ChevronDown } from 'lucide-react'
import { CARDS_CONFIG, Category, CATEGORIES, getCardRule, Transaction, getCategoryLabel } from '@/lib/cards-config'
import { useState } from 'react'
import { RecordsDetailModal } from './records-detail-modal'

interface RecordsViewProps {
  ownedCards: string[]
  cardSpending: Record<string, Record<Category, number>>
  transactions: Transaction[]
  onDeleteTransaction: (transactionId: string) => void
}

export function RecordsView({ 
  ownedCards, 
  cardSpending, 
  transactions,
  onDeleteTransaction,
}: RecordsViewProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailModalType, setDetailModalType] = useState<'reward' | 'spending'>('reward')
  
  const ownedCardDetails = CARDS_CONFIG.filter((card) => ownedCards.includes(card.id))

  const getTotalSpending = (cardId: string) => {
    const spending = cardSpending[cardId]
    if (!spending) return 0
    return Object.values(spending).reduce((sum, val) => sum + val, 0)
  }

  // Get transactions for current month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.timestamp)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })

  // Group transactions by card
  const transactionsByCard = currentMonthTransactions.reduce((acc, t) => {
    if (!acc[t.cardId]) acc[t.cardId] = []
    acc[t.cardId].push(t)
    return acc
  }, {} as Record<string, Transaction[]>)

  const getCardStats = (cardId: string) => {
    const card = CARDS_CONFIG.find((c) => c.id === cardId)
    if (!card) return null

    const spending = cardSpending[cardId] || {}
    const totalSpend = getTotalSpending(cardId)
    
    // Find primary rule
    const primaryRule = card.rules.find((r) => r.monthlyCap || r.monthlyRewardCap || r.minSpend)
    if (!primaryRule) {
      // Calculate simple reward
      let totalReward = 0
      CATEGORIES.forEach((cat) => {
        const catSpend = spending[cat.id] || 0
        const rule = getCardRule(card, cat.id)
        if (rule) {
          totalReward += catSpend * (rule.rate / 100)
        } else {
          totalReward += catSpend * (card.defaultRate / 100)
        }
      })
      return {
        totalSpend,
        totalReward,
        status: 'earning' as const,
        remaining: 0,
        cap: 0,
        threshold: 0,
        thresholdRemaining: 0,
      }
    }

    // Check threshold
    if (primaryRule.minSpend && totalSpend < primaryRule.minSpend) {
      const baseReward = totalSpend * (card.defaultRate / 100)
      return {
        totalSpend,
        totalReward: baseReward,
        status: 'threshold' as const,
        remaining: primaryRule.monthlyCap || 0,
        cap: primaryRule.monthlyCap || 0,
        threshold: primaryRule.minSpend,
        thresholdRemaining: primaryRule.minSpend - totalSpend,
      }
    }

    // Calculate with cap
    const relevantCategories = Array.isArray(primaryRule.category)
      ? primaryRule.category
      : [primaryRule.category]
    
    const relevantSpending = relevantCategories.reduce(
      (sum, cat) => sum + (spending[cat] || 0),
      0
    )
    const otherSpending = totalSpend - relevantSpending

    let relevantReward = 0
    let remaining = 0
    let status: 'earning' | 'maxed' = 'earning'

    if (primaryRule.monthlyCap) {
      const withinCap = Math.min(relevantSpending, primaryRule.monthlyCap)
      const overCap = Math.max(0, relevantSpending - primaryRule.monthlyCap)
      relevantReward = withinCap * (primaryRule.rate / 100) + overCap * (card.defaultRate / 100)
      remaining = Math.max(0, primaryRule.monthlyCap - relevantSpending)
      status = remaining <= 0 ? 'maxed' : 'earning'
    } else if (primaryRule.monthlyRewardCap) {
      const potentialReward = relevantSpending * (primaryRule.rate / 100)
      relevantReward = Math.min(potentialReward, primaryRule.monthlyRewardCap)
      const remainingReward = Math.max(0, primaryRule.monthlyRewardCap - relevantReward)
      remaining = Math.round(remainingReward / (primaryRule.rate / 100))
      status = remainingReward <= 0 ? 'maxed' : 'earning'
    }

    const otherReward = otherSpending * (card.defaultRate / 100)
    const totalReward = relevantReward + otherReward

    return {
      totalSpend,
      totalReward,
      status,
      remaining,
      cap: primaryRule.monthlyCap || Math.round((primaryRule.monthlyRewardCap || 0) / (primaryRule.rate / 100)),
      threshold: primaryRule.minSpend || 0,
      thresholdRemaining: 0,
    }
  }

  const totalMonthlyReward = ownedCardDetails.reduce((sum, card) => {
    const stats = getCardStats(card.id)
    return sum + (stats?.totalReward || 0)
  }, 0)

  const totalMonthlySpend = ownedCardDetails.reduce((sum, card) => {
    return sum + getTotalSpending(card.id)
  }, 0)

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hours}:${minutes}`
  }

  if (ownedCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-white/30" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">未有紀錄</h3>
        <p className="text-sm text-white/50 max-w-[250px]">
          請先喺「卡包設置」添加你持有嘅信用卡
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary - Clickable bubbles */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setDetailModalType('reward')
            setDetailModalOpen(true)
          }}
          className="px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left hover:bg-emerald-500/15 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400">本月總回贈</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400/50 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            ${totalMonthlyReward.toFixed(2)}
          </div>
        </button>
        <button
          onClick={() => {
            setDetailModalType('spending')
            setDetailModalOpen(true)
          }}
          className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50">本月總簽賬</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
          </div>
          <div className="text-xl font-bold text-white">
            ${totalMonthlySpend.toLocaleString()}
          </div>
        </button>
      </div>

      {/* Transaction count */}
      <div className="flex items-center gap-2 text-xs text-white/40">
        <Calendar className="w-3.5 h-3.5" />
        <span>本月 {currentMonthTransactions.length} 筆交易</span>
      </div>

      {/* Card breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">
          各卡明細
        </h3>
        {ownedCardDetails.map((card) => {
          const stats = getCardStats(card.id)
          const cardTransactions = transactionsByCard[card.id] || []
          const isExpanded = expandedCard === card.id
          
          if (!stats) return null

          const progressPercent = stats.cap > 0
            ? Math.min(100, ((stats.cap - stats.remaining) / stats.cap) * 100)
            : 0

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
            >
              {/* Card header */}
              <div 
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedCard(isExpanded ? null : card.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-6 rounded-md bg-gradient-to-r ${card.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/50 font-normal">{card.bank}</div>
                    <div className="font-semibold text-white text-sm break-words">{card.name}</div>
                    {cardTransactions.length > 0 && (
                      <div className="text-[10px] text-white/40 mt-1">
                        {cardTransactions.length} 筆交易
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">
                      ${stats.totalReward.toFixed(2)}
                    </div>
                  </div>
                  {/* Dropdown arrow indicator */}
                  <ChevronDown
                    className={`w-5 h-5 text-white/30 transition-transform shrink-0 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Status and progress */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/50">
                    累積: ${stats.totalSpend.toLocaleString()}
                  </span>
                  {stats.status === 'threshold' && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Lock className="w-3 h-3" />
                      差 ${stats.thresholdRemaining.toLocaleString()} 啟動
                    </span>
                  )}
                  {stats.status === 'earning' && stats.cap > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Zap className="w-3 h-3" />
                      剩餘: ${stats.remaining.toLocaleString()}
                    </span>
                  )}
                  {stats.status === 'maxed' && (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      已簽爆
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {stats.cap > 0 && (
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    {stats.status === 'threshold' ? (
                      <motion.div
                        className="h-full bg-white/20 rounded-full"
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ width: '100%' }}
                      />
                    ) : (
                      <div
                        className={`h-full rounded-full ${
                          stats.status === 'maxed' ? 'bg-red-500' : 
                          progressPercent >= 80 ? 'bg-orange-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Expanded transactions list */}
              <AnimatePresence>
                {isExpanded && cardTransactions.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 overflow-hidden"
                  >
                    <div className="p-3 space-y-2">
                      {cardTransactions.sort((a, b) => b.timestamp - a.timestamp).map((txn) => (
                        <div 
                          key={txn.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-white/5 group"
                        >
                          <div className="flex items-center gap-2 text-xs text-white/40 shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(txn.timestamp)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-white/60 px-1.5 py-0.5 rounded bg-white/10">
                              {getCategoryLabel(txn.category)}
                            </span>
                          </div>
                          <div className="text-sm text-white font-medium shrink-0">
                            ${txn.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-emerald-400 shrink-0">
                            +${txn.reward.toFixed(1)}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteTransaction(txn.id)
                            }}
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No transactions message */}
              {isExpanded && cardTransactions.length === 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/10 p-4 text-center text-xs text-white/40"
                >
                  本月未有此卡交易紀錄
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Detail Modal */}
      <RecordsDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        type={detailModalType}
        transactions={transactions}
      />
    </div>
  )
}
