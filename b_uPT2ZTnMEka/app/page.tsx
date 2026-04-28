'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, RotateCcw, Trash2 } from 'lucide-react'
import { AmountInput } from '@/components/amount-input'
import { CategorySelector } from '@/components/category-selector'
import { RewardCard } from '@/components/reward-card'
import { BottomTabBar, TabId } from '@/components/bottom-tab-bar'
import { RecordsView } from '@/components/records-view'
import { SettingsView } from '@/components/settings-view'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { 
  CARDS_CONFIG, 
  Category, 
  calculateReward, 
  Transaction, 
  generateTransactionId 
} from '@/lib/cards-config'

export default function HomePage() {
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState<Category>('online')
  const [activeTab, setActiveTab] = useState<TabId>('calculator')
  const [ownedCards, setOwnedCards] = useLocalStorage<string[]>('owned-cards', [])
  const [cardSpending, setCardSpending] = useLocalStorage<Record<string, Record<Category, number>>>(
    'card-spending',
    {}
  )
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', [])
  // Track which registration bonuses have been activated (cardId:bonusIndex)
  const [registeredBonuses, setRegisteredBonuses] = useLocalStorage<string[]>('registered-bonuses', [])
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleToggleOwn = (cardId: string) => {
    setOwnedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    )
  }

  const handleUpdateSpending = (cardId: string, cat: Category, spendAmount: number) => {
    setCardSpending((prev) => ({
      ...prev,
      [cardId]: {
        ...(prev[cardId] || {}),
        [cat]: spendAmount,
      },
    }))
  }

  // Get total monthly spend for a card (all categories)
  const getTotalMonthlySpend = useCallback((cardId: string) => {
    const spending = cardSpending[cardId]
    if (!spending) return 0
    return Object.values(spending).reduce((sum, val) => sum + val, 0)
  }, [cardSpending])

  // Handle card selection (record transaction)
  const handleSelectCard = useCallback((cardId: string) => {
    if (amount <= 0) return

    const card = CARDS_CONFIG.find(c => c.id === cardId)
    if (!card) return

    const currentSpending = cardSpending[cardId]?.[category] || 0
    const totalMonthlySpend = getTotalMonthlySpend(cardId)
    const calculation = calculateReward(card, amount, category, currentSpending, totalMonthlySpend)

    // Create transaction
    const transaction: Transaction = {
      id: generateTransactionId(),
      cardId,
      amount,
      category,
      reward: calculation.reward,
      rate: calculation.rate,
      timestamp: Date.now(),
    }

    // Update transactions
    setTransactions(prev => [...prev, transaction])

    // Update card spending
    setCardSpending(prev => ({
      ...prev,
      [cardId]: {
        ...(prev[cardId] || {}),
        [category]: (prev[cardId]?.[category] || 0) + amount,
      },
    }))

    // Save last transaction for undo
    setLastTransaction(transaction)

    // Reset amount
    setAmount(0)
  }, [amount, category, cardSpending, getTotalMonthlySpend, setTransactions, setCardSpending])

  // Undo last transaction
  const handleUndoLast = useCallback(() => {
    if (!lastTransaction) return

    // Remove transaction
    setTransactions(prev => prev.filter(t => t.id !== lastTransaction.id))

    // Revert spending
    setCardSpending(prev => ({
      ...prev,
      [lastTransaction.cardId]: {
        ...(prev[lastTransaction.cardId] || {}),
        [lastTransaction.category]: Math.max(
          0,
          (prev[lastTransaction.cardId]?.[lastTransaction.category] || 0) - lastTransaction.amount
        ),
      },
    }))

    setLastTransaction(null)
  }, [lastTransaction, setTransactions, setCardSpending])

  // Reset all data
  const handleResetAll = useCallback(() => {
    setCardSpending({})
    setTransactions([])
    setLastTransaction(null)
    setAmount(0)
    setShowResetConfirm(false)
  }, [setCardSpending, setTransactions])

  // Delete individual transaction
  const handleDeleteTransaction = useCallback((transactionId: string) => {
    const txn = transactions.find(t => t.id === transactionId)
    if (!txn) return

    // Remove transaction
    setTransactions(prev => prev.filter(t => t.id !== transactionId))

    // Revert spending
    setCardSpending(prev => ({
      ...prev,
      [txn.cardId]: {
        ...(prev[txn.cardId] || {}),
        [txn.category]: Math.max(
          0,
          (prev[txn.cardId]?.[txn.category] || 0) - txn.amount
        ),
      },
    }))
  }, [transactions, setTransactions, setCardSpending])

  // Only show owned cards in calculator, sorted by reward
  const sortedCards = useMemo(() => {
    const ownedCardsData = CARDS_CONFIG.filter(card => ownedCards.includes(card.id))
    
    const cardsWithCalc = ownedCardsData.map((card) => {
      const currentSpending = cardSpending[card.id]?.[category] || 0
      const totalMonthlySpend = getTotalMonthlySpend(card.id)
      const calculation = calculateReward(card, amount, category, currentSpending, totalMonthlySpend)
      
      // Check if this card is close to threshold activation
      const isCloseToThreshold = calculation.status === 'threshold' && 
        calculation.thresholdRemaining > 0 &&
        calculation.thresholdRemaining <= amount * 1.5 // Within 1.5x of current transaction

      return {
        card,
        reward: calculation.reward,
        calculation,
        currentSpending,
        totalMonthlySpend,
        isCloseToThreshold,
      }
    })

    // Sort by reward descending, then by status
    return cardsWithCalc.sort((a, b) => {
      // 1. First priority: Cards close to threshold
      if (a.isCloseToThreshold && !b.isCloseToThreshold) return -1
      if (!a.isCloseToThreshold && b.isCloseToThreshold) return 1

      // 2. Sort by reward descending
      if (b.reward !== a.reward) return b.reward - a.reward

      // 3. Cards with remaining cap come before maxed cards
      if (a.calculation.status !== b.calculation.status) {
        if (a.calculation.status === 'earning') return -1
        if (b.calculation.status === 'earning') return 1
      }

      return 0
    })
  }, [amount, category, ownedCards, cardSpending, getTotalMonthlySpend])

  // Find cards close to threshold for priority recommendation
  const thresholdPriorityCards = useMemo(() => {
    return sortedCards
      .filter((c) => c.isCloseToThreshold)
      .map((c) => c.card.id)
  }, [sortedCards])

  return (
    <main className="min-h-screen bg-black pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">信用卡回贈神助手</h1>
                <p className="text-xs text-white/50">2026 年最新數據</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Reset buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleUndoLast}
                  disabled={!lastTransaction}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                    text-sm font-medium transition-all
                    ${lastTransaction
                      ? 'bg-white/10 text-white hover:bg-white/15 active:scale-[0.98]'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }
                  `}
                >
                  <RotateCcw className="w-4 h-4" />
                  撤銷上一單
                </button>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 active:scale-[0.98] transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  重設所有
                </button>
              </div>

              {/* Amount input */}
              <section>
                <AmountInput value={amount} onChange={setAmount} />
              </section>

              {/* Category selector */}
              <section>
                <h2 className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">
                  簽賬類別
                </h2>
                <CategorySelector selected={category} onChange={setCategory} />
              </section>

              {/* Threshold priority alert */}
              <AnimatePresence>
                {amount > 0 && thresholdPriorityCards.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
                  >
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                      <Zap className="w-4 h-4" />
                      建議優先用此卡達標，啟動整月高回贈
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card recommendations */}
              <section>
                <h2 className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">
                  選擇信用卡 {amount > 0 && <span className="text-emerald-400">(點選即記錄)</span>}
                </h2>
                
                {ownedCards.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-white/50 text-sm mb-2">未添加任何信用卡</p>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="text-emerald-400 text-sm font-medium hover:underline"
                    >
                      前往卡包設置添加
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {sortedCards.map((item, index) => (
                        <RewardCard
                          key={item.card.id}
                          card={item.card}
                          amount={amount}
                          category={category}
                          currentSpending={item.currentSpending}
                          totalMonthlySpend={item.totalMonthlySpend}
                          rank={index}
                          isThresholdPriority={thresholdPriorityCards.includes(item.card.id)}
                          onSelectCard={handleSelectCard}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {activeTab === 'records' && (
            <motion.div
              key="records"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <RecordsView
                ownedCards={ownedCards}
                cardSpending={cardSpending}
                transactions={transactions}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <SettingsView
                ownedCards={ownedCards}
                cardSpending={cardSpending}
                onToggleOwn={handleToggleOwn}
                onUpdateSpending={handleUpdateSpending}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset confirmation modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-2">確認重設所有數據？</h3>
              <p className="text-sm text-white/60 mb-6">
                此操作會清除所有交易紀錄同簽賬金額，無法復原。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleResetAll}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-400 transition-colors"
                >
                  確認重設
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  )
}
