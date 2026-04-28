'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './use-local-storage'

interface RegisteredBonus {
  cardId: string
  bonusIndex: number
}

export function useRegisteredBonuses() {
  const [registeredBonuses, setRegisteredBonuses] = useLocalStorage<Record<string, number[]>>('registered-bonuses', {})

  const isRegistered = useCallback((cardId: string, bonusIndex: number): boolean => {
    return (registeredBonuses[cardId] || []).includes(bonusIndex)
  }, [registeredBonuses])

  const toggleBonus = useCallback((cardId: string, bonusIndex: number) => {
    setRegisteredBonuses((prev) => {
      const cardBonuses = prev[cardId] || []
      if (cardBonuses.includes(bonusIndex)) {
        return {
          ...prev,
          [cardId]: cardBonuses.filter((b) => b !== bonusIndex),
        }
      } else {
        return {
          ...prev,
          [cardId]: [...cardBonuses, bonusIndex],
        }
      }
    })
  }, [setRegisteredBonuses])

  return {
    registeredBonuses,
    isRegistered,
    toggleBonus,
  }
}
