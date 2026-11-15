import { EducationLevel, JobDefinition, JobPositionLevel } from '../types/game';

export const JOBS: JobDefinition[] = [
  {
    id: 'newspaper_delivery',
    title: 'Newspaper Delivery',
    category: 'Logistics',
    baseWeeklyIncomeUSD: 100,
    energyCost: 20,
    maxShiftsPerWeek: 2,
    requiredEducation: 'High School',
    minConnections: 0,
    description: 'Early-morning route on foot or bicycle. Light energy drain and easy to pair with other work.',
  },
  {
    id: 'freelance_work',
    title: 'Freelance Micro-Tasks',
    category: 'Remote',
    baseWeeklyIncomeUSD: 150,
    energyCost: 20,
    maxShiftsPerWeek: 3,
    requiredEducation: 'High School',
    minConnections: 0,
    description: 'Flexible online gigs, data tagging, and basic editing from your laptop.',
  },
  {
    id: 'cafe_employee',
    title: 'Cafe Employee',
    category: 'Service',
    baseWeeklyIncomeUSD: 180,
    energyCost: 30,
    maxShiftsPerWeek: 2,
    requiredEducation: 'High School',
    minConnections: 0,
    description: 'Brewing espresso and running the counter. Great way to meet local regulars.',
  },
  {
    id: 'retail_assistant',
    title: 'Retail Assistant',
    category: 'Service',
    baseWeeklyIncomeUSD: 180,
    energyCost: 30,
    maxShiftsPerWeek: 2,
    requiredEducation: 'High School',
    minConnections: 0,
    description: 'Stocking shelves and assisting shoppers in electronics and apparel stores.',
  },
  {
    id: 'restaurant_worker',
    title: 'Restaurant Worker',
    category: 'Service',
    baseWeeklyIncomeUSD: 190,
    energyCost: 30,
    maxShiftsPerWeek: 2,
    requiredEducation: 'High School',
    minConnections: 0,
    description: 'Fast-paced evening shifts with steady tips and strong customer-facing resilience.',
  },
  {
    id: 'delivery_rider',
    title: 'Delivery Rider',
    category: 'Logistics',
    baseWeeklyIncomeUSD: 200,
    energyCost: 30,
    maxShiftsPerWeek: 2,
    requiredEducation: 'High School',
    minConnections: 0,
    description: 'Courier runs across city districts. Physically demanding but reliable weekly payout.',
  },
  {
    id: 'warehouse_worker',
    title: 'Warehouse Worker',
    category: 'Logistics',
    baseWeeklyIncomeUSD: 220,
    energyCost: 35,
    maxShiftsPerWeek: 2,
    requiredEducation: 'High School',
    minConnections: 0,
    description: 'Sorting freight and packing pallets. Solid pay for disciplined workers.',
  },
  {
    id: 'office_assistant',
    title: 'Office Assistant',
    category: 'Office',
    baseWeeklyIncomeUSD: 230,
    energyCost: 35,
    maxShiftsPerWeek: 2,
    requiredEducation: 'Vocational Certificate',
    minConnections: 5,
    description: 'Scheduling, spreadsheets, and admin support that builds real business habits.',
  },
  {
    id: 'call_centre',
    title: 'Call Centre Operator',
    category: 'Office',
    baseWeeklyIncomeUSD: 250,
    energyCost: 35,
    maxShiftsPerWeek: 2,
    requiredEducation: 'High School',
    minConnections: 2,
    description: 'High-volume inbound support. Draining shifts, but among the highest entry wages.',
  },
  {
    id: 'customer_support',
    title: 'Customer Support Agent',
    category: 'Remote',
    baseWeeklyIncomeUSD: 250,
    energyCost: 35,
    maxShiftsPerWeek: 2,
    requiredEducation: 'Vocational Certificate',
    minConnections: 6,
    description: 'Tech ticket resolution and account troubleshooting with strong promotion upside.',
  },
];

export const JOB_LEVEL_LABELS: Record<JobPositionLevel, string> = {
  1: 'Entry-level Employee',
  2: 'Experienced Employee',
  3: 'Senior Employee',
  4: 'Supervisor',
  5: 'Manager',
};

export const JOB_LEVEL_MULTIPLIER: Record<JobPositionLevel, number> = {
  1: 1.0,
  2: 1.25,
  3: 1.55,
  4: 1.95,
  5: 2.5,
};

export const EDUCATION_ORDER: EducationLevel[] = [
  'High School',
  'Vocational Certificate',
  'Associate Degree',
  'Bachelor of Business',
  'MBA',
];

export interface EducationProgram {
  level: EducationLevel;
  tuitionUSD: number;
  energyCost: number;
  minWeeksWorkExp: number;
  skillBonusDesc: string;
}

export const EDUCATION_PROGRAMS: EducationProgram[] = [
  {
    level: 'Vocational Certificate',
    tuitionUSD: 650,
    energyCost: 25,
    minWeeksWorkExp: 2,
    skillBonusDesc: '+8 Business Acumen · Unlocks Office & Tech Support roles',
  },
  {
    level: 'Associate Degree',
    tuitionUSD: 1800,
    energyCost: 30,
    minWeeksWorkExp: 6,
    skillBonusDesc: '+10 Business Acumen · +6 Negotiation · Faster Promotions',
  },
  {
    level: 'Bachelor of Business',
    tuitionUSD: 4500,
    energyCost: 35,
    minWeeksWorkExp: 12,
    skillBonusDesc: '+12 Leadership · +10 Marketing · Boosts Org Valuation',
  },
  {
    level: 'MBA',
    tuitionUSD: 9500,
    energyCost: 40,
    minWeeksWorkExp: 20,
    skillBonusDesc: '+15 Business Acumen · +12 Leadership · Elite Sponsor Trust',
  },
];
