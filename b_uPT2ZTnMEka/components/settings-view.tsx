'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CircleCheck as CheckCircle2, Plus, Star, Lightbulb, Target, Plane, Banknote, Bell, Check, CircleAlert as AlertCircle } from 'lucide-react'
import { CARDS_CONFIG, CreditCard, Category, CATEGORIES, getCategoryLabel } from '@/lib/cards-config'
import { useRegisteredBonuses } from '@/hooks/use-registered-bonuses'

interface SettingsViewProps {
  ownedCards: string[]
  cardSpending: Record<string, Record<Category, number>>
  onToggleOwn: (cardId: string) => void
  onUpdateSpending: (cardId: string, category: Category, amount: number) => void
}

export function SettingsView({
  ownedCards,
  onToggleOwn,
}: SettingsViewProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const { isRegistered, toggleBonus } = useRegisteredBonuses()

  const ownedCardDetails = CARDS_CONFIG.filter((card) => ownedCards.includes(card.id))
  const unownedCards = CARDS_CONFIG.filter((card) => !ownedCards.includes(card.id))

  const renderCardAnalysis = (card: CreditCard, isOwned: boolean) => {
    const isExpanded = expandedCard === card.id

    return (
      <motion.div
        key={card.id}
        layout
        className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
      >
        {/* Card header */}
        <div
          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setExpandedCard(isExpanded ? null : card.id)}
        >
          <div className={`w-12 h-8 rounded-md bg-gradient-to-r ${card.color} shrink-0`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <div className="flex-1">
                <div className="text-xs text-white/50 font-normal">{card.bank}</div>
                <div className="font-semibold text-white break-words">{card.name}</div>
              </div>
              {isOwned && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-white/50">
                {card.rules[0]?.description || `基本回贈 ${card.defaultRate}%`}
              </span>
              {card.rewardType === 'miles' && (
                <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/20 text-amber-400 rounded shrink-0">
                  里數
                </span>
              )}
              {card.registrationBonuses && card.registrationBonuses.length > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-400 rounded border border-amber-500/30 shrink-0">
                  需登記
                </span>
              )}
            </div>
          </div>

          {/* Quick add button for unowned cards */}
          {!isOwned && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleOwn(card.id)
              }}
              className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 hover:bg-emerald-400 transition-colors active:scale-95"
              title="快速添加此卡"
            >
              <Plus className="w-4 h-4 text-black" />
            </button>
          )}

          <ChevronDown
            className={`w-5 h-5 text-white/30 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Expanded card analysis */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Reward type indicator */}
                <div className="flex items-center gap-2">
                  {card.rewardType === 'miles' ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-lg">
                      <Plane className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-amber-400">里數卡</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-emerald-400">現金回贈卡</span>
                    </div>
                  )}
                </div>

                {/* Best for categories */}
                <div>
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                    <Star className="w-3.5 h-3.5" />
                    最適合類別
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {card.bestFor.map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg"
                      >
                        {getCategoryLabel(cat)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Strategy */}
                <div>
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                    <Target className="w-3.5 h-3.5" />
                    玩法攻略
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {card.strategy}
                  </p>
                </div>

                {/* Tips */}
                <div>
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                    <Lightbulb className="w-3.5 h-3.5" />
                    重點提示
                  </div>
                  <ul className="space-y-1.5">
                    {card.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-white/70">
                        <span className="text-emerald-400 mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Registration bonuses section */}
                {card.registrationBonuses && card.registrationBonuses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-amber-400 mb-3">
                      <Bell className="w-3.5 h-3.5" />
                      需登記優惠
                    </div>
                    <div className="space-y-2">
                      {card.registrationBonuses.map((bonus, bonusIndex) => {
                        const registered = isRegistered(card.id, bonusIndex)
                        return (
                        <motion.div
                          key={bonusIndex}
                          onClick={() => toggleBonus(card.id, bonusIndex)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            registered
                              ? 'bg-amber-500/20 border border-amber-500/50'
                              : 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-amber-400 font-medium text-sm flex items-center gap-1.5">
                                {registered ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5" />
                                )}
                                {bonus.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {bonus.milesRate && (
                                <span className="text-amber-400 font-bold text-sm">
                                  ${bonus.milesRate}=1里
                                </span>
                              )}
                              {bonus.rate && !bonus.milesRate && (
                                <span className="text-amber-400 font-bold text-sm">
                                  {bonus.rate}%
                                </span>
                              )}
                              {registered && (
                                <div className="ml-2 flex items-center gap-1 px-2 py-1 bg-emerald-500 rounded">
                                  <Check className="w-3 h-3 text-white" />
                                  <span className="text-xs text-white font-medium">已登記</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-white/70 mb-2">
                            {bonus.description}
                          </p>
                          {bonus.validUntil && (
                            <div className="text-[10px] text-white/40 mb-2">
                              有效期至: {bonus.validUntil}
                            </div>
                          )}
                          <div className="space-y-1">
                            {bonus.requirements.map((req, reqIndex) => (
                              <div key={reqIndex} className="flex items-start gap-1.5 text-[11px] text-white/50">
                                <span className="text-amber-400 mt-0.5">•</span>
                                {req}
                              </div>
                            ))}
                          </div>
                          {bonus.minSpend && (
                            <div className="mt-2 px-2 py-1 bg-amber-500/20 rounded text-[10px] text-amber-400 inline-block">
                              最低簽賬: ${bonus.minSpend.toLocaleString()}
                            </div>
                          )}
                          {bonus.monthlyCap && (
                            <div className="mt-2 ml-1 px-2 py-1 bg-amber-500/20 rounded text-[10px] text-amber-400 inline-block">
                              每月上限: ${bonus.monthlyCap.toLocaleString()}
                            </div>
                          )}
                        </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Reward rules breakdown */}
                <div>
                  <div className="text-xs text-white/50 mb-2">回贈規則</div>
                  <div className="space-y-2">
                    {card.rules.map((rule, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/5 rounded-lg text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium">
                            {Array.isArray(rule.category)
                              ? rule.category.map(getCategoryLabel).join(' / ')
                              : getCategoryLabel(rule.category)}
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {card.rewardType === 'miles' && rule.milesRate
                              ? `$${rule.milesRate}=1里`
                              : `${rule.rate}%`}
                          </span>
                        </div>
                        <div className="text-xs text-white/50">
                          {rule.description}
                        </div>
                      </div>
                    ))}
                    <div className="p-3 bg-white/5 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/70">一般簽賬</span>
                        <span className="text-white/50">
                          {card.rewardType === 'miles' && card.defaultMilesRate
                            ? `$${card.defaultMilesRate}=1里`
                            : `${card.defaultRate}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                {isOwned ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleOwn(card.id)
                    }}
                    className="
                      w-full py-2.5 rounded-lg
                      border border-red-500/30 text-red-400 text-sm font-medium
                      hover:bg-red-500/10 transition-colors
                    "
                  >
                    移除此卡
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleOwn(card.id)
                      setExpandedCard(null)
                    }}
                    className="
                      w-full py-2.5 rounded-lg
                      bg-emerald-500 text-black text-sm font-bold
                      hover:bg-emerald-400 transition-colors
                    "
                  >
                    添加此卡
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Owned cards section */}
      {ownedCardDetails.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            已持有 ({ownedCardDetails.length})
          </h3>
          {ownedCardDetails.map((card) => renderCardAnalysis(card, true))}
        </div>
      )}

      {/* Unowned cards section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4" />
          可添加 ({unownedCards.length})
        </h3>
        {unownedCards.map((card) => renderCardAnalysis(card, false))}
      </div>
    </div>
  )
}
