'use client'

import { motion } from 'framer-motion'
import { Calculator, ClipboardList, Settings } from 'lucide-react'

export type TabId = 'calculator' | 'records' | 'settings'

interface BottomTabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const TABS = [
  { id: 'calculator' as TabId, label: '計算機', icon: Calculator },
  { id: 'records' as TabId, label: '我的紀錄', icon: ClipboardList },
  { id: 'settings' as TabId, label: '卡包設置', icon: Settings },
]

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/10">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center flex-1 h-full"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-x-4 top-0 h-0.5 bg-emerald-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 mb-1 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-white/40'
                  }`}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-white/40'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-black/90" />
    </nav>
  )
}
