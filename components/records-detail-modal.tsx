'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ChartPie as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Transaction, CARDS_CONFIG, CATEGORIES, getCategoryLabel, Category } from '@/lib/cards-config'

interface RecordsDetailModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'reward' | 'spending'
  transactions: Transaction[]
}

// Color palette for charts
const CARD_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
]

const CATEGORY_COLORS: Record<Category, string> = {
  online: '#3b82f6',
  dining: '#f59e0b',
  supermarket: '#10b981',
  overseas: '#8b5cf6',
  general: '#6b7280',
}

export function RecordsDetailModal({
  isOpen,
  onClose,
  type,
  transactions,
}: RecordsDetailModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return { month: now.getMonth(), year: now.getFullYear() }
  })
  const [viewMode, setViewMode] = useState<'card' | 'category'>('card')

  // Get available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    transactions.forEach((t) => {
      const date = new Date(t.timestamp)
      months.add(`${date.getFullYear()}-${date.getMonth()}`)
    })
    return Array.from(months)
      .map((m) => {
        const [year, month] = m.split('-').map(Number)
        return { year, month }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
  }, [transactions])

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.timestamp)
      return (
        date.getMonth() === selectedMonth.month &&
        date.getFullYear() === selectedMonth.year
      )
    })
  }, [transactions, selectedMonth])

  // Calculate data by card
  const dataByCard = useMemo(() => {
    const cardMap = new Map<string, { spending: number; reward: number }>()
    monthTransactions.forEach((t) => {
      const existing = cardMap.get(t.cardId) || { spending: 0, reward: 0 }
      cardMap.set(t.cardId, {
        spending: existing.spending + t.amount,
        reward: existing.reward + t.reward,
      })
    })
    return Array.from(cardMap.entries()).map(([cardId, data]) => {
      const card = CARDS_CONFIG.find((c) => c.id === cardId)
      return {
        name: card ? `${card.bank} ${card.name}` : cardId,
        value: type === 'reward' ? data.reward : data.spending,
        cardId,
      }
    })
  }, [monthTransactions, type])

  // Calculate data by category
  const dataByCategory = useMemo(() => {
    const categoryMap = new Map<Category, { spending: number; reward: number }>()
    monthTransactions.forEach((t) => {
      const existing = categoryMap.get(t.category) || { spending: 0, reward: 0 }
      categoryMap.set(t.category, {
        spending: existing.spending + t.amount,
        reward: existing.reward + t.reward,
      })
    })
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      name: getCategoryLabel(category),
      value: type === 'reward' ? data.reward : data.spending,
      category,
    }))
  }, [monthTransactions, type])

  const chartData = viewMode === 'card' ? dataByCard : dataByCategory
  const colors = viewMode === 'card' ? CARD_COLORS : Object.values(CATEGORY_COLORS)

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  const formatMonth = (month: number, year: number) => {
    return `${year}年${month + 1}月`
  }

  const goToPrevMonth = () => {
    const currentIndex = availableMonths.findIndex(
      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
    )
    if (currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1])
    }
  }

  const goToNextMonth = () => {
    const currentIndex = availableMonths.findIndex(
      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
    )
    if (currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1])
    }
  }

  const canGoPrev = useMemo(() => {
    const currentIndex = availableMonths.findIndex(
      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
    )
    return currentIndex < availableMonths.length - 1
  }, [availableMonths, selectedMonth])

  const canGoNext = useMemo(() => {
    const currentIndex = availableMonths.findIndex(
      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
    )
    return currentIndex > 0
  }, [availableMonths, selectedMonth])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0
      return (
        <div className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-white text-sm font-medium">{data.name}</p>
          <p className="text-emerald-400 text-sm">
            ${data.value.toFixed(type === 'reward' ? 2 : 0)} ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-zinc-900 rounded-t-3xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {type === 'reward' ? '回贈明細' : '簽賬明細'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={goToPrevMonth}
                disabled={!canGoPrev}
                className={`p-2 rounded-full transition-colors ${
                  canGoPrev
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white font-medium min-w-[120px] text-center">
                {formatMonth(selectedMonth.month, selectedMonth.year)}
              </span>
              <button
                onClick={goToNextMonth}
                disabled={!canGoNext}
                className={`p-2 rounded-full transition-colors ${
                  canGoNext
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* View mode toggle */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setViewMode('card')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'card'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                按信用卡
              </button>
              <button
                onClick={() => setViewMode('category')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'category'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                按消費類別
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {monthTransactions.length === 0 ? (
              <div className="text-center py-10">
                <PieChartIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">此月份未有交易紀錄</p>
              </div>
            ) : (
              <>
                {/* Total */}
                <div className="text-center mb-4">
                  <div className="text-white/50 text-sm mb-1">
                    {type === 'reward' ? '總回贈' : '總簽賬'}
                  </div>
                  <div className={`text-4xl font-bold ${type === 'reward' ? 'text-emerald-400' : 'text-white'}`}>
                    ${total.toFixed(type === 'reward' ? 2 : 0)}
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-2 gap-4 h-[280px]">
                  {/* Pie Chart */}
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {chartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={colors[index % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend / Breakdown */}
                  <div className="space-y-1.5 overflow-y-auto pr-2">
                    {chartData
                      .sort((a, b) => b.value - a.value)
                      .map((item, index) => {
                        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
                        return (
                          <div
                            key={item.name}
                            className="flex items-center gap-2 p-2 bg-white/5 rounded-lg"
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs font-medium truncate">
                                {item.name}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`text-xs font-bold ${type === 'reward' ? 'text-emerald-400' : 'text-white'}`}>
                                ${item.value.toFixed(type === 'reward' ? 2 : 0)}
                              </div>
                              <div className="text-[9px] text-white/40">{percentage}%</div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
