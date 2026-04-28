export type Category = 'online' | 'dining' | 'supermarket' | 'overseas' | 'general'

export type RewardType = 'cashback' | 'miles'

export interface CardRewardRule {
  category: Category | Category[]
  rate: number // percentage for cashback, or equivalent % for miles
  milesRate?: number // e.g. 4 means $4 = 1 mile
  monthlyCap?: number // monthly spending cap for this rate (in HKD)
  monthlyRewardCap?: number // monthly reward cap in HKD
  minSpend?: number // minimum monthly spend to activate this rate
  description: string
}

// Registration-based bonus offers that require user to register in bank app
export interface RegistrationBonus {
  name: string // name of the offer
  category: Category | Category[]
  rate?: number // percentage for cashback
  milesRate?: number // e.g. 1.68 means $1.68 = 1 mile
  minSpend?: number // minimum monthly spend to qualify
  monthlyCap?: number // spending cap
  monthlyRewardCap?: number // reward cap
  validUntil?: string // expiry date
  registrationUrl?: string // where to register
  description: string
  requirements: string[] // list of requirements
  specialMerchants?: string[] // list of specific merchants for this bonus
}

export interface CreditCard {
  id: string
  name: string
  bank: string
  color: string // gradient colors
  rewardType: RewardType
  rules: CardRewardRule[]
  defaultRate: number
  defaultMilesRate?: number // e.g. 25 means $25 = 1 mile
  affiliateUrl?: string
  // Card analysis info
  bestFor: Category[] // categories this card is best for
  strategy: string // how to play this card
  tips: string[] // additional tips
  // Registration-based bonus offers
  registrationBonuses?: RegistrationBonus[]
}

export interface Transaction {
  id: string
  cardId: string
  amount: number
  category: Category
  reward: number
  rate: number
  miles?: number // for miles cards
  timestamp: number // Unix timestamp
}

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'online', label: '網購', icon: 'ShoppingCart' },
  { id: 'dining', label: '食肆', icon: 'UtensilsCrossed' },
  { id: 'supermarket', label: '超市', icon: 'Store' },
  { id: 'overseas', label: '海外', icon: 'Plane' },
  { id: 'general', label: '一般', icon: 'CreditCard' },
]

export const CARDS_CONFIG: CreditCard[] = [
  {
    id: 'hsbc-red',
    name: 'Red Card',
    bank: 'HSBC',
    color: 'from-red-600 to-red-800',
    rewardType: 'cashback',
    rules: [
      {
        category: 'online',
        rate: 4,
        monthlyCap: 10000,
        description: '網購 4% (每月首 $10,000，包括網上超市)',
      },
    ],
    defaultRate: 0.4,
    bestFor: ['online'],
    strategy: '主攻網購，每月 $10,000 Cap 內盡用。實體超市只計一般簽賬 0.4%，但網上超市如 HKTVmall 計 4%。',
    tips: [
      '網購 4% 每月上限 $10,000 簽賬額',
      '網上超市 (如 HKTVmall) 計入網購 4%',
      '實體超市簽賬只有 0.4%',
      '一般簽賬只有 0.4%，唔好亂用',
    ],
    registrationBonuses: [
      {
        name: '指定商戶額外回贈',
        category: ['dining', 'online'],
        rate: 8,
        monthlyCap: 5000,
        validUntil: '2026年6月30日',
        description: '指定食肆及商戶消費可享高達 8% 回贈',
        requirements: [
          '需於 HSBC Reward+ App 登記及查看指定商戶名單',
          '包括指定餐廳、零售品牌',
          '每月指定商戶簽賬上限 $5,000',
        ],
        specialMerchants: [
          '麥當勞',
          'KFC',
          'Pizza Hut',
          'PHD',
          'Starbucks',
          'Pacific Coffee',
          'AEON',
          'IKEA',
          'UNIQLO',
        ],
      },
    ],
  },
  {
    id: 'citic-motion',
    name: 'Motion 信用卡',
    bank: '信銀國際',
    color: 'from-purple-600 to-indigo-800',
    rewardType: 'cashback',
    rules: [
      {
        category: ['dining', 'online'],
        rate: 6,
        minSpend: 3800,
        monthlyCap: 3333,
        monthlyRewardCap: 200,
        description: '食肆/網購 6% (需簽滿 $3,800，回贈上限 $200)',
      },
    ],
    defaultRate: 0.4,
    bestFor: ['dining', 'online'],
    strategy: '每月先簽滿 $3,800 達標，之後食肆/網購享 6%。回贈上限 $200，即約 $3,333 有效額度。',
    tips: [
      '每月需簽滿 $3,800 先啟動 6%',
      '6% 回贈上限 $200/月',
      '達標前只有 0.4%，要小心計劃',
      '可配合其他一般消費用作達標',
    ],
    registrationBonuses: [
      {
        name: '海外簽賬優惠',
        category: 'overseas',
        rate: 4,
        monthlyCap: 5000,
        description: '海外簽賬可享額外 4% 回贈',
        requirements: [
          '需於 inMotion App 登記',
          '每月海外簽賬上限 $5,000',
          '與基本回贈分開計算',
        ],
      },
    ],
  },
  {
    id: 'sc-cathay',
    name: '國泰 Mastercard',
    bank: '渣打',
    color: 'from-emerald-600 to-teal-800',
    rewardType: 'miles',
    rules: [
      {
        category: ['dining', 'online', 'overseas'],
        rate: 2.5,
        milesRate: 4,
        description: '食肆/網購/海外 $4=1里 (~2.5%)',
      },
    ],
    defaultRate: 1.6,
    defaultMilesRate: 6,
    bestFor: ['dining', 'online', 'overseas'],
    strategy: '儲 Asia Miles 神卡，食肆/網購/海外 $4=1里。一般簽賬 $6=1里，都算抵。',
    tips: [
      '食肆/網購/海外 $4=1里',
      '一般簽賬 $6=1里',
      '無簽賬上限，長期主力卡',
      '可配合渣打 Smart 卡享額外優惠',
    ],
    registrationBonuses: [
      {
        name: '360° 全面賞',
        category: ['dining', 'online', 'overseas'],
        milesRate: 2,
        monthlyCap: 25000,
        description: '登記後指定類別可享 $2=1里',
        requirements: [
          '需於 SC Mobile App 登記 360° 全面賞',
          '每月達指定簽賬額可享額外里數',
          '可選擇不同獎賞計劃',
        ],
      },
    ],
  },
  {
    id: 'hsbc-visa-signature',
    name: 'Visa Signature',
    bank: 'HSBC',
    color: 'from-slate-700 to-slate-900',
    rewardType: 'miles',
    rules: [
      {
        category: ['dining', 'online', 'overseas'],
        rate: 3.6,
        milesRate: 2.78,
        monthlyCap: 8333,
        description: '自選類別 3.6% (每年首 $100k)',
      },
    ],
    defaultRate: 1.6,
    defaultMilesRate: 6.25,
    bestFor: ['dining', 'online', 'overseas'],
    strategy: '自選最紅自主獎賞 6X 類別，最高 $2.78=1里。每年首 $100,000 有效。',
    tips: [
      '最紅自主獎賞可自選 6X 類別',
      '每年首 $100,000 簽賬有效',
      '超過後跌至 $25=1里',
      '建議配合 Red Card 使用',
    ],
    registrationBonuses: [
      {
        name: '最紅自主獎賞',
        category: ['dining', 'online', 'overseas'],
        rate: 3.6,
        milesRate: 2.78,
        monthlyCap: 8333,
        validUntil: '長期有效',
        description: '需登記自選 6X 獎賞類別',
        requirements: [
          '需於 HSBC Reward+ App 登記自選類別',
          '可選擇：賞滋味、賞家居、賞品味、賞中華、賞世界、賞娛樂',
          '每年首 $100,000 簽賬有效',
          '建議集中 6X 於一個類別',
        ],
      },
    ],
  },
  {
    id: 'bea-world',
    name: 'World Mastercard',
    bank: '東亞',
    color: 'from-blue-600 to-blue-900',
    rewardType: 'cashback',
    rules: [
      {
        category: ['dining', 'supermarket'],
        rate: 4,
        minSpend: 4000,
        monthlyCap: 7500,
        monthlyRewardCap: 300,
        description: '食肆/超市 4% (需簽滿 $4,000，回贈上限 $300)',
      },
    ],
    defaultRate: 0.4,
    bestFor: ['dining', 'supermarket'],
    strategy: '每月簽滿 $4,000 達標，食肆/超市享 4%。配合 i-Titanium 網購使用。',
    tips: [
      '每月需簽滿 $4,000 啟動 4%',
      '食肆/超市 4% 回贈上限 $300/月',
      '即約 $7,500 有效額度',
      '一般簽賬 0.4%，唔抵用',
    ],
  },
  {
    id: 'bea-i-titanium',
    name: 'i-Titanium',
    bank: '東亞',
    color: 'from-cyan-500 to-blue-700',
    rewardType: 'cashback',
    rules: [
      {
        category: 'online',
        rate: 4,
        minSpend: 2000,
        monthlyCap: 5000,
        description: '網購 4% (需簽滿 $2,000)',
      },
    ],
    defaultRate: 0.4,
    bestFor: ['online'],
    strategy: '每月簽滿 $2,000 達標，網購享 4%。門檻較低，適合小額網購用戶。',
    tips: [
      '每月需簽滿 $2,000 啟動 4%',
      '網購 4% Cap $5,000/月',
      '門檻比 HSBC Red 低',
      '可配合 BEA World 食肆使用',
    ],
  },
  {
    id: 'ae-explorer',
    name: 'Explorer',
    bank: 'American Express',
    color: 'from-sky-500 to-blue-700',
    rewardType: 'miles',
    rules: [
      {
        category: 'overseas',
        rate: 3.2,
        milesRate: 3,
        description: '海外 $3=1里 (~3.2%)',
      },
    ],
    defaultRate: 1.6,
    defaultMilesRate: 6,
    bestFor: ['overseas'],
    strategy: '海外簽賬神卡，$3=1里。Travel Together 每年送免費機票。',
    tips: [
      '海外簽賬 $3=1里',
      'Travel Together 每年送免費機票',
      '本地簽賬 $6=1里',
      'Lounge 使用權',
    ],
    registrationBonuses: [
      {
        name: '海外簽賬登記優惠',
        category: 'overseas',
        milesRate: 1.68,
        validUntil: '2025年6月30日',
        description: '登記後海外簽賬可享 $1.68=1里 (10.75x 積分)',
        requirements: [
          '需於 AE App 或網站登記',
          '只適用於外幣簽賬',
          '每階段設有簽賬上限',
        ],
      },
    ],
  },
  {
    id: 'citi-cashback',
    name: 'Cash Back',
    bank: 'Citi',
    color: 'from-blue-500 to-cyan-600',
    rewardType: 'cashback',
    rules: [
      {
        category: ['dining', 'overseas'],
        rate: 2,
        description: '食肆/酒店/海外 2%',
      },
    ],
    defaultRate: 1,
    bestFor: ['dining', 'overseas'],
    strategy: '簡單直接，食肆/酒店/海外 2%，無上限無門檻。適合唔想計數嘅人。',
    tips: [
      '食肆/酒店/海外 2% 無上限',
      '一般簽賬 1%',
      '無簽賬門檻',
      '回贈自動存入，唔使換領',
    ],
  },
  {
    id: 'hsbc-everymile',
    name: 'EveryMile',
    bank: 'HSBC',
    color: 'from-amber-500 to-orange-600',
    rewardType: 'miles',
    rules: [
      {
        category: 'online',
        rate: 3.2,
        milesRate: 3,
        description: '指定交通/Apps $2=1里 (~3.2%)',
      },
    ],
    defaultRate: 1.27,
    defaultMilesRate: 8,
    bestFor: ['online'],
    strategy: '交通/Apps 簽賬神卡，$2=1里。適合經常搭車、叫外賣嘅人。',
    tips: [
      '指定交通/Apps $2=1里',
      '包括 Uber、Deliveroo、HKTVmall 等',
      '一般簽賬 $5=1里',
      '每月簽 $6,000 有額外迎新',
    ],
    registrationBonuses: [
      {
        name: '海外簽賬登記優惠',
        category: 'overseas',
        milesRate: 2,
        minSpend: 12000,
        monthlyCap: 15000,
        monthlyRewardCap: 3750, // 15000 / 2 * 0.5 extra miles value
        description: '登記後海外簽賬可享 $2=1里',
        requirements: [
          '需於 HSBC Reward+ App 登記',
          '每月需累積簽滿 $12,000 方可啟動',
          '每月額外里數上限約 7,500 里',
          '只計算外幣簽賬',
        ],
      },
    ],
  },
]

export type SpendingStatus = 'threshold' | 'earning' | 'maxed'

export interface RewardCalculation {
  reward: number
  rate: number
  miles?: number
  milesRate?: number
  status: SpendingStatus
  currentSpent: number
  remainingCap: number
  thresholdRemaining: number
  capTotal: number
  thresholdTotal: number
  activatedRate: number
  defaultRate: number
  description: string
  rewardType: RewardType
}

export function calculateReward(
  card: CreditCard,
  amount: number,
  category: Category,
  currentSpending: number = 0,
  totalMonthlySpend: number = 0
): RewardCalculation {
  // Find matching rule
  const matchingRule = card.rules.find((rule) => {
    if (Array.isArray(rule.category)) {
      return rule.category.includes(category)
    }
    return rule.category === category
  })

  const baseResult: RewardCalculation = {
    reward: amount * (card.defaultRate / 100),
    rate: card.defaultRate,
    miles: card.rewardType === 'miles' && card.defaultMilesRate ? amount / card.defaultMilesRate : undefined,
    milesRate: card.defaultMilesRate,
    status: 'earning',
    currentSpent: currentSpending,
    remainingCap: 0,
    thresholdRemaining: 0,
    capTotal: 0,
    thresholdTotal: 0,
    activatedRate: card.defaultRate,
    defaultRate: card.defaultRate,
    description: `一般簽賬 ${card.defaultRate}%`,
    rewardType: card.rewardType,
  }

  if (!matchingRule) {
    return baseResult
  }

  const rule = matchingRule
  let effectiveRate = rule.rate
  let reward = 0
  let miles: number | undefined
  let status: SpendingStatus = 'earning'
  let remainingCap = 0
  let thresholdRemaining = 0
  const capTotal = rule.monthlyCap || 0
  const thresholdTotal = rule.minSpend || 0

  // Check threshold first
  if (rule.minSpend && totalMonthlySpend < rule.minSpend) {
    thresholdRemaining = rule.minSpend - totalMonthlySpend
    status = 'threshold'
    effectiveRate = card.defaultRate
    reward = amount * (card.defaultRate / 100)
    miles = card.rewardType === 'miles' && card.defaultMilesRate ? amount / card.defaultMilesRate : undefined
    remainingCap = rule.monthlyCap || 0

    return {
      reward,
      rate: effectiveRate,
      miles,
      milesRate: card.defaultMilesRate,
      status,
      currentSpent: currentSpending,
      remainingCap,
      thresholdRemaining,
      capTotal,
      thresholdTotal,
      activatedRate: rule.rate,
      defaultRate: card.defaultRate,
      description: rule.description,
      rewardType: card.rewardType,
    }
  }

  // Threshold reached, now check cap
  if (rule.monthlyCap) {
    remainingCap = Math.max(0, rule.monthlyCap - currentSpending)

    if (remainingCap <= 0) {
      status = 'maxed'
      effectiveRate = card.defaultRate
      reward = amount * (card.defaultRate / 100)
      miles = card.rewardType === 'miles' && card.defaultMilesRate ? amount / card.defaultMilesRate : undefined
    } else if (amount <= remainingCap) {
      status = 'earning'
      reward = amount * (rule.rate / 100)
      miles = card.rewardType === 'miles' && rule.milesRate ? amount / rule.milesRate : undefined
    } else {
      const withinCap = remainingCap
      const overCap = amount - remainingCap
      reward = withinCap * (rule.rate / 100) + overCap * (card.defaultRate / 100)
      effectiveRate = (reward / amount) * 100
      if (card.rewardType === 'miles') {
        const withinMiles = rule.milesRate ? withinCap / rule.milesRate : 0
        const overMiles = card.defaultMilesRate ? overCap / card.defaultMilesRate : 0
        miles = withinMiles + overMiles
      }
      status = 'maxed'
      remainingCap = 0
    }
  } else if (rule.monthlyRewardCap) {
    const currentReward = currentSpending * (rule.rate / 100)
    const remainingRewardCap = Math.max(0, rule.monthlyRewardCap - currentReward)
    remainingCap = remainingRewardCap / (rule.rate / 100)

    if (remainingRewardCap <= 0) {
      status = 'maxed'
      effectiveRate = card.defaultRate
      reward = amount * (card.defaultRate / 100)
      miles = card.rewardType === 'miles' && card.defaultMilesRate ? amount / card.defaultMilesRate : undefined
    } else {
      const potentialReward = amount * (rule.rate / 100)
      if (potentialReward <= remainingRewardCap) {
        status = 'earning'
        reward = potentialReward
        miles = card.rewardType === 'miles' && rule.milesRate ? amount / rule.milesRate : undefined
      } else {
        reward = remainingRewardCap
        effectiveRate = (reward / amount) * 100
        if (card.rewardType === 'miles' && rule.milesRate) {
          miles = reward / (rule.rate / 100) / rule.milesRate
        }
        status = 'maxed'
        remainingCap = 0
      }
    }
  } else {
    status = 'earning'
    reward = amount * (rule.rate / 100)
    miles = card.rewardType === 'miles' && rule.milesRate ? amount / rule.milesRate : undefined
  }

  return {
    reward,
    rate: effectiveRate,
    miles,
    milesRate: rule.milesRate,
    status,
    currentSpent: currentSpending,
    remainingCap: Math.round(remainingCap),
    thresholdRemaining: Math.round(thresholdRemaining),
    capTotal,
    thresholdTotal,
    activatedRate: rule.rate,
    defaultRate: card.defaultRate,
    description: rule.description,
    rewardType: card.rewardType,
  }
}

export function getCardDescription(card: CreditCard, category: Category): string {
  const matchingRule = card.rules.find((rule) => {
    if (Array.isArray(rule.category)) {
      return rule.category.includes(category)
    }
    return rule.category === category
  })

  if (matchingRule) {
    return matchingRule.description
  }

  return `一般簽賬 ${card.defaultRate}%`
}

export function getCardRule(card: CreditCard, category: Category) {
  return card.rules.find((rule) => {
    if (Array.isArray(rule.category)) {
      return rule.category.includes(category)
    }
    return rule.category === category
  })
}

export function getCategoryLabel(categoryId: Category): string {
  const cat = CATEGORIES.find(c => c.id === categoryId)
  return cat?.label || categoryId
}

export function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
