import { createSeededRandom, pickOne, randomIntBetween } from '@/api/random'
import type { Offering, Order, OrderItem, OrderStatus, Temple } from '@/api/types'

export type MockDatabase = {
  temples: Temple[]
  offerings: Offering[]
  orders: Order[]
  nextOrderNumber: number
}

const SEED = 20260216
const SEED_ORDER_COUNT = 52
const FIRST_ORDER_NUMBER = 10001
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

type OfferingSeed = {
  name: string
  description: string
  price: number
  active?: boolean
}

type TempleSeed = {
  temple: Omit<Temple, 'id'>
  offerings: OfferingSeed[]
}

const TEMPLE_SEEDS: TempleSeed[] = [
  {
    temple: {
      name: 'Arulmigu Kapaleeshwarar Temple',
      city: 'Mylapore, Chennai',
      deity: 'Kapaleeshwarar',
      opensAt: '05:30',
      closesAt: '21:30',
    },
    offerings: [
      { name: 'Archanai', description: 'Name and star recited before the sanctum.', price: 50 },
      { name: 'Sahasranama Archanai', description: 'Recitation of the thousand names.', price: 250 },
      { name: 'Deepa Aradhanai', description: 'Lamp offering at the evening service.', price: 120 },
      { name: 'Abhishekam', description: 'Ritual bathing of the deity with milk and honey.', price: 1500 },
      { name: 'Vastra Samarpanam', description: 'Offering of silk garments to the deity.', price: 2500 },
      { name: 'Pushpa Alangaram', description: 'Floral decoration of the sanctum.', price: 800 },
      { name: 'Annadhanam Sponsorship', description: 'Free meal served to fifty devotees.', price: 3000 },
      { name: 'Laddu Prasadam', description: 'Box of six temple-made laddus.', price: 180 },
      { name: 'Special Darshan Pass', description: 'Queue-free entry for one devotee.', price: 100 },
      { name: 'Pradosham Pooja', description: 'Fortnightly evening service in your name.', price: 900, active: false },
    ],
  },
  {
    temple: {
      name: 'Sri Meenakshi Amman Temple',
      city: 'Madurai',
      deity: 'Meenakshi',
      opensAt: '05:00',
      closesAt: '22:00',
    },
    offerings: [
      { name: 'Archanai', description: 'Name and star recited before the sanctum.', price: 60 },
      { name: 'Kumkum Archanai', description: 'Archanai with kumkum returned as prasadam.', price: 150 },
      { name: 'Thirumanjanam', description: 'Elaborate anointing of the goddess.', price: 2200 },
      { name: 'Chandana Kappu', description: 'Sandalwood paste adorning the deity overnight.', price: 1800 },
      { name: 'Pattu Pudavai Samarpanam', description: 'Offering of a Madurai silk saree.', price: 4500 },
      { name: 'Malai Samarpanam', description: 'Garland of jasmine and rose for the goddess.', price: 650 },
      { name: 'Annadhanam Sponsorship', description: 'Free meal served to one hundred devotees.', price: 5500 },
      { name: 'Panchamirtham Prasadam', description: 'Sealed jar of temple panchamirtham.', price: 220 },
      { name: 'Unjal Seva', description: 'Swing service for the divine couple.', price: 1200 },
    ],
  },
  {
    temple: {
      name: 'Sri Ranganathaswamy Temple',
      city: 'Srirangam, Tiruchirappalli',
      deity: 'Ranganatha',
      opensAt: '06:00',
      closesAt: '21:00',
    },
    offerings: [
      { name: 'Archanai', description: 'Name and star recited before the sanctum.', price: 50 },
      { name: 'Thiruppavai Parayanam', description: 'Verses recited on your behalf.', price: 400 },
      { name: 'Thirumanjanam', description: 'Ceremonial bathing of the reclining deity.', price: 2800 },
      { name: 'Tulasi Malai Samarpanam', description: 'Sacred basil garland offering.', price: 350 },
      { name: 'Sattrumurai Seva', description: 'Concluding service of the daily recitation.', price: 1100 },
      { name: 'Dosai Prasadam', description: 'Temple kitchen dosai offered and packed.', price: 140 },
      { name: 'Annadhanam Sponsorship', description: 'Free meal served to seventy-five devotees.', price: 4200 },
      { name: 'Garuda Seva Sponsorship', description: 'Procession of the deity on the Garuda mount.', price: 9000 },
      { name: 'Vaikunta Ekadasi Pass', description: 'Entry through the Paramapada Vasal.', price: 500 },
      { name: 'Ratha Alangaram', description: 'Decoration of the temple chariot.', price: 6500, active: false },
    ],
  },
]

const DEVOTEE_FIRST_NAMES = [
  'Lakshmi',
  'Ramesh',
  'Priya',
  'Karthik',
  'Anitha',
  'Venkatesh',
  'Divya',
  'Suresh',
  'Meena',
  'Arjun',
  'Kavitha',
  'Balaji',
  'Revathi',
  'Ganesh',
  'Shanthi',
  'Mohan',
]

const DEVOTEE_LAST_NAMES = [
  'Iyer',
  'Subramanian',
  'Natarajan',
  'Krishnan',
  'Raghavan',
  'Pillai',
  'Venkataraman',
  'Sundaram',
  'Chandrasekar',
  'Murugan',
]

function buildTemplesAndOfferings(): { temples: Temple[]; offerings: Offering[] } {
  const temples: Temple[] = []
  const offerings: Offering[] = []

  TEMPLE_SEEDS.forEach((seed, templeIndex) => {
    const templeId = `temple-${templeIndex + 1}`
    temples.push({ id: templeId, ...seed.temple })

    seed.offerings.forEach((offering, offeringIndex) => {
      offerings.push({
        id: `${templeId}-offering-${offeringIndex + 1}`,
        templeId,
        name: offering.name,
        description: offering.description,
        price: offering.price,
        active: offering.active ?? true,
      })
    })
  })

  return { temples, offerings }
}

function pickStatus(ageInDays: number, roll: number): OrderStatus {
  if (roll < 0.12) {
    return 'cancelled'
  }
  if (ageInDays > 14) {
    return 'completed'
  }
  if (ageInDays > 3) {
    return 'confirmed'
  }
  return 'pending'
}

function buildOrders(temples: Temple[], offerings: Offering[], now: number): Order[] {
  const random = createSeededRandom(SEED)
  const orders: Order[] = []

  for (let index = 0; index < SEED_ORDER_COUNT; index += 1) {
    const temple = pickOne(random, temples)
    const available = offerings.filter((offering) => offering.templeId === temple.id && offering.active)
    const lineCount = randomIntBetween(random, 1, 3)
    const items: OrderItem[] = []

    for (let line = 0; line < lineCount; line += 1) {
      const offering = pickOne(random, available)
      if (items.some((item) => item.offeringId === offering.id)) {
        continue
      }
      const quantity = randomIntBetween(random, 1, 3)
      items.push({
        offeringId: offering.id,
        name: offering.name,
        unitPrice: offering.price,
        quantity,
        subtotal: offering.price * quantity,
      })
    }

    const ageInDays = randomIntBetween(random, 0, 59)
    const placedAt = now - ageInDays * DAY_MS - randomIntBetween(random, 0, 23) * HOUR_MS
    const status = pickStatus(ageInDays, random())
    const settledAt = status === 'pending' ? placedAt : placedAt + randomIntBetween(random, 1, 48) * HOUR_MS

    orders.push({
      id: `TDB-${FIRST_ORDER_NUMBER + index}`,
      templeId: temple.id,
      templeName: temple.name,
      devoteeName: `${pickOne(random, DEVOTEE_FIRST_NAMES)} ${pickOne(random, DEVOTEE_LAST_NAMES)}`,
      devoteePhone: `+91 9${randomIntBetween(random, 10000000, 99999999)}`,
      items,
      total: items.reduce((sum, item) => sum + item.subtotal, 0),
      status,
      placedAt: new Date(placedAt).toISOString(),
      updatedAt: new Date(Math.min(settledAt, now)).toISOString(),
    })
  }

  return orders
}

export function buildSeedData(now = Date.now()): MockDatabase {
  const { temples, offerings } = buildTemplesAndOfferings()

  return {
    temples,
    offerings,
    orders: buildOrders(temples, offerings, now),
    nextOrderNumber: FIRST_ORDER_NUMBER + SEED_ORDER_COUNT,
  }
}
