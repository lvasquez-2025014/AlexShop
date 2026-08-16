export interface ShopPackage {
  id: string
  diamonds: number
  bonus: number
  price: number
  popular?: boolean
  category: 'diamantes' | 'pases'
}

export const packages: ShopPackage[] = [
  { id: 'd110', diamonds: 110, bonus: 10, price: 18, category: 'diamantes' },
  { id: 'd341', diamonds: 341, bonus: 31, price: 51, category: 'diamantes' },
  { id: 'd572', diamonds: 572, bonus: 52, price: 69, category: 'diamantes' },
  { id: 'd1166', diamonds: 1166, bonus: 106, price: 105, popular: true, category: 'diamantes' },
  { id: 'd2398', diamonds: 2398, bonus: 218, price: 340, category: 'diamantes' },
  { id: 'd6160', diamonds: 6160, bonus: 560, price: 795, category: 'diamantes' },
]

export const passes: ShopPackage[] = [
  { id: 'p1', diamonds: 310, bonus: 0, price: 79, category: 'pases' },
  { id: 'p2', diamonds: 910, bonus: 0, price: 149, popular: true, category: 'pases' },
  { id: 'p3', diamonds: 1660, bonus: 0, price: 219, category: 'pases' },
  { id: 'p4', diamonds: 2100, bonus: 100, price: 269, category: 'pases' },
]