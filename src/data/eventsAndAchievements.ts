import { EventChoice } from '../types/game';

export interface AchievementDefinition {
  id: string;
  title: string;
  category: 'Personal' | 'Organization';
  description: string;
  rewardText: string;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Personal
  {
    id: 'earn_1k',
    title: 'First $1,000 Earned',
    category: 'Personal',
    description: 'Cross $1,000 in lifetime personal earnings through honest work.',
    rewardText: '+2 Reputation · Early hustle milestone',
  },
  {
    id: 'save_10k',
    title: 'First $10,000 Saved',
    category: 'Personal',
    description: 'Accumulate $10,000 in combined personal cash and bank savings.',
    rewardText: '+4 Connections · Banks take notice',
  },
  {
    id: 'first_luxury',
    title: 'First Luxury Purchase',
    category: 'Personal',
    description: 'Acquire your first personal vehicle, property, or luxury item.',
    rewardText: '+3 Reputation',
  },
  {
    id: 'first_investment',
    title: 'First Business Investment',
    category: 'Personal',
    description: 'Put personal capital to work in stocks, real estate, or private equity.',
    rewardText: '+3 Business Acumen',
  },
  {
    id: 'millionaire',
    title: 'Million-Dollar Net Worth',
    category: 'Personal',
    description: 'Reach $1,000,000 in personal net worth independent of org funds.',
    rewardText: '+10 Reputation · +8 Connections',
  },
  // Organizational
  {
    id: 'org_founded',
    title: 'Organization Founder',
    category: 'Organization',
    description: 'Complete registration, licensing, and launch your esports organization.',
    rewardText: 'Unlocks full Esports & Business management',
  },
  {
    id: 'first_pro_signed',
    title: 'First Player Signed',
    category: 'Organization',
    description: 'Sign your first contracted competitive player to an active roster.',
    rewardText: '+3 Organization Reputation',
  },
  {
    id: 'first_tournament_win',
    title: 'First Tournament Victory',
    category: 'Organization',
    description: 'Lift your first tournament trophy in any competitive division.',
    rewardText: '+8 Reputation · Sponsor interest rises',
  },
  {
    id: 'first_regional_champ',
    title: 'Regional Champion',
    category: 'Organization',
    description: 'Win a Regional or National Championship against established squads.',
    rewardText: '+12 Reputation · International qualifier access',
  },
  {
    id: 'first_intl_qual',
    title: 'International Stage',
    category: 'Organization',
    description: 'Compete in an International Qualifier or Major International tournament.',
    rewardText: '+10 Reputation · Global media coverage',
  },
  {
    id: 'first_major_trophy',
    title: 'Major International Trophy',
    category: 'Organization',
    description: 'Capture a Major International Championship title.',
    rewardText: '+18 Reputation · Tier-1 sponsors unlocked',
  },
  {
    id: 'first_world_champ',
    title: 'World Champion',
    category: 'Organization',
    description: 'Win the Annual World Championship and hoist the supreme trophy.',
    rewardText: '+30 Reputation · Legendary status',
  },
  {
    id: 'worlds_most_valuable',
    title: "World's Most Valuable Org",
    category: 'Organization',
    description: 'Surpass every rival organization globally in total organization valuation.',
    rewardText: 'Unlocks Global Dynasty endgame milestone',
  },
];

export interface StoryEventTemplate {
  id: string;
  title: string;
  category: 'Early Life' | 'Organization' | 'Competitive' | 'World';
  minWeek?: number;
  requiresOrg?: boolean;
  forbidsOrg?: boolean;
  description: string;
  choices: EventChoice[];
}

export const STORY_EVENT_TEMPLATES: StoryEventTemplate[] = [
  {
    id: 'family_medical_help',
    title: 'Family Needs Emergency Support',
    category: 'Early Life',
    minWeek: 2,
    forbidsOrg: true,
    description:
      'A close relative calls late at night—an unexpected utility and clinic bill has hit the household, and they are short on cash this week.',
    choices: [
      {
        id: 'send_help',
        label: 'Cover the bill',
        hint: 'Costs $180 personal cash',
        requiresCashUSD: 180,
        effectDescription: 'Lose $180 cash, gain +5 Reputation & +4 Leadership',
        apply: (state) => ({
          updated: {
            ...state,
            finances: { ...state.finances, cashUSD: state.finances.cashUSD - 180 },
            character: {
              ...state.character,
              reputation: state.character.reputation + 5,
              skills: {
                ...state.character.skills,
                leadership: Math.min(100, state.character.skills.leadership + 4),
              },
            },
          },
          outcomeText: 'You wired the funds immediately. Your family is deeply relieved, and word of your reliability spreads.',
        }),
      },
      {
        id: 'help_connect',
        label: 'Offer time and help negotiate a payment plan',
        hint: 'Costs 15 energy',
        effectDescription: 'Spend 15 energy, gain +3 Negotiation',
        apply: (state) => ({
          updated: {
            ...state,
            energy: Math.max(0, state.energy - 15),
            character: {
              ...state.character,
              skills: {
                ...state.character.skills,
                negotiation: Math.min(100, state.character.skills.negotiation + 3),
              },
            },
          },
          outcomeText: 'You spent an afternoon on the phone with billing clerks and secured a zero-interest installment plan.',
        }),
      },
      {
        id: 'decline_tight',
        label: 'Explain you are barely scraping by yourself',
        hint: 'No cost',
        effectDescription: 'Keep your savings, -2 Reputation',
        apply: (state) => ({
          updated: {
            ...state,
            character: {
              ...state.character,
              reputation: Math.max(0, state.character.reputation - 2),
            },
          },
          outcomeText: 'It was an uncomfortable conversation, but your fragile savings remain intact.',
        }),
      },
    ],
  },
  {
    id: 'local_esports_intro',
    title: 'LAN Cafe Tournament Volunteer',
    category: 'Early Life',
    minWeek: 3,
    forbidsOrg: true,
    description:
      'A friend asks if you can help run brackets and check in teams at a weekend basement LAN tournament. An experienced semi-pro team manager will be there.',
    choices: [
      {
        id: 'volunteer_full',
        label: 'Volunteer to manage the bracket desk',
        hint: 'Costs 20 energy',
        effectDescription: '+6 Connections · +6 Esports Knowledge · Small $60 stipend',
        apply: (state) => ({
          updated: {
            ...state,
            energy: Math.max(0, state.energy - 20),
            finances: {
              ...state.finances,
              cashUSD: state.finances.cashUSD + 60,
              lifetimeEarnedUSD: state.finances.lifetimeEarnedUSD + 60,
            },
            character: {
              ...state.character,
              connections: state.character.connections + 6,
              skills: {
                ...state.character.skills,
                esportsKnowledge: Math.min(100, state.character.skills.esportsKnowledge + 6),
              },
            },
          },
          outcomeText: 'Your smooth bracket scheduling impressed the tournament organizer, who introduced you to regional players.',
        }),
      },
      {
        id: 'attend_briefly',
        label: 'Drop by for an hour to network',
        hint: 'No energy cost',
        effectDescription: '+2 Connections · +2 Esports Knowledge',
        apply: (state) => ({
          updated: {
            ...state,
            character: {
              ...state.character,
              connections: state.character.connections + 2,
              skills: {
                ...state.character.skills,
                esportsKnowledge: Math.min(100, state.character.skills.esportsKnowledge + 2),
              },
            },
          },
          outcomeText: 'You exchanged messages with two amateur captains before heading back to rest.',
        }),
      },
    ],
  },
  {
    id: 'employer_promotion_pitch',
    title: 'Supervisor Takes Notice',
    category: 'Early Life',
    minWeek: 4,
    forbidsOrg: true,
    description:
      'Your manager pulls you aside after closing. Another shift lead just quit, and they are considering fast-tracking you or paying an overtime bonus.',
    choices: [
      {
        id: 'accept_extra_duty',
        label: 'Step up and handle the weekend roster',
        hint: 'Costs 20 energy',
        effectDescription: '+$220 bonus · +4 Work Ethic · Promotion progress',
        apply: (state) => ({
          updated: {
            ...state,
            energy: Math.max(0, state.energy - 20),
            finances: {
              ...state.finances,
              cashUSD: state.finances.cashUSD + 220,
              lifetimeEarnedUSD: state.finances.lifetimeEarnedUSD + 220,
            },
            employment: {
              ...state.employment,
              consistencyStreak: state.employment.consistencyStreak + 2,
            },
            character: {
              ...state.character,
              skills: {
                ...state.character.skills,
                workEthic: Math.min(100, state.character.skills.workEthic + 4),
              },
            },
          },
          outcomeText: 'You ran the weekend floor without a single incident and pocketed a solid bonus.',
        }),
      },
      {
        id: 'ask_reference',
        label: 'Ask for a formal business reference instead',
        hint: 'No cost',
        effectDescription: '+4 Connections · +3 Business Acumen',
        apply: (state) => ({
          updated: {
            ...state,
            character: {
              ...state.character,
              connections: state.character.connections + 4,
              skills: {
                ...state.character.skills,
                businessAcumen: Math.min(100, state.character.skills.businessAcumen + 3),
              },
            },
          },
          outcomeText: 'Your boss happily wrote a glowing recommendation letter for future business filings.',
        }),
      },
    ],
  },
  {
    id: 'sponsor_approach',
    title: 'Hardware Brand Sponsorship Inquiry',
    category: 'Organization',
    requiresOrg: true,
    description:
      'A peripheral manufacturer reached out after seeing your recent roster activity. They want jersey logo placement in exchange for gear and cash.',
    choices: [
      {
        id: 'sign_hardware_deal',
        label: 'Accept the standard sponsorship terms',
        hint: 'Immediate org cash injection',
        effectDescription: '+$3,500 to Org Bank · +1,500 Followers · +3 Org Reputation',
        apply: (state) => ({
          updated: {
            ...state,
            org: {
              ...state.org,
              bankBalanceUSD: state.org.bankBalanceUSD + 3500,
              followers: state.org.followers + 1500,
              reputation: Math.min(100, state.org.reputation + 3),
            },
          },
          outcomeText: 'Boxes of tournament headsets arrived at your facility along with an upfront promotional payment.',
        }),
      },
      {
        id: 'negotiate_harder',
        label: 'Counter-offer for a performance-linked bonus',
        hint: 'Better payout if Negotiation >= 20',
        effectDescription: 'Gain $5,500 if negotiation succeeds, or $1,500 baseline',
        apply: (state) => {
          const success = state.character.skills.negotiation >= 18 || Math.random() < 0.55;
          const payout = success ? 5500 : 1500;
          return {
            updated: {
              ...state,
              org: {
                ...state.org,
                bankBalanceUSD: state.org.bankBalanceUSD + payout,
                reputation: Math.min(100, state.org.reputation + (success ? 5 : 1)),
              },
              character: {
                ...state.character,
                skills: {
                  ...state.character.skills,
                  negotiation: Math.min(100, state.character.skills.negotiation + 3),
                },
              },
            },
            outcomeText: success
              ? 'Your sharp counter-offer won over their brand manager, locking in $5,500.'
              : 'They pushed back on the higher rate, settling on a smaller trial payment of $1,500.',
          };
        },
      },
    ],
  },
  {
    id: 'bootcamp_repairs',
    title: 'Facility Infrastructure Glitch',
    category: 'Organization',
    requiresOrg: true,
    description:
      'Power surges and cooling strain hit your main training room right before weekly scrims. Leaving it unaddressed will frustrate players.',
    choices: [
      {
        id: 'pay_pro_repair',
        label: 'Hire commercial electricians immediately',
        hint: 'Costs $1,800 from Org Bank',
        requiresOrgBalanceUSD: 1800,
        effectDescription: 'Spend $1,800 Org Bank · +6 Player Morale · +2 Org Reputation',
        apply: (state) => ({
          updated: {
            ...state,
            org: {
              ...state.org,
              bankBalanceUSD: state.org.bankBalanceUSD - 1800,
              reputation: Math.min(100, state.org.reputation + 2),
            },
            roster: state.roster.map((p) => ({
              ...p,
              morale: Math.min(100, p.morale + 6),
            })),
          },
          outcomeText: 'Dedicated surge protection and AC lines were installed overnight. Players praised your swift response.',
        }),
      },
      {
        id: 'patch_temporary',
        label: 'Reroute cables yourself for a temporary fix',
        hint: 'Costs 20 energy',
        effectDescription: 'Spend 20 energy · -3 Player Morale',
        apply: (state) => ({
          updated: {
            ...state,
            energy: Math.max(0, state.energy - 20),
            roster: state.roster.map((p) => ({
              ...p,
              morale: Math.max(20, p.morale - 3),
            })),
          },
          outcomeText: 'You saved company cash, though a warm room made scrims slightly tense this week.',
        }),
      },
    ],
  },
  {
    id: 'rival_poach_attempt',
    title: 'Rival Organization Approaches Your Roster',
    category: 'Competitive',
    requiresOrg: true,
    description:
      'Word leaks that a rival scout is DMing one of your key players with promises of a higher salary and flashier perks.',
    choices: [
      {
        id: 'offer_loyalty_bonus',
        label: 'Issue a retention bonus and public backing',
        hint: 'Costs $2,000 Org Bank',
        requiresOrgBalanceUSD: 2000,
        effectDescription: 'Spend $2,000 Org Bank · +10 Player Morale · +5 Division Chemistry',
        apply: (state) => ({
          updated: {
            ...state,
            org: {
              ...state.org,
              bankBalanceUSD: state.org.bankBalanceUSD - 2000,
              divisions: state.org.divisions.map((d) => ({
                ...d,
                chemistry: Math.min(100, d.chemistry + 5),
              })),
            },
            roster: state.roster.map((p) => ({
              ...p,
              morale: Math.min(100, p.morale + 10),
            })),
          },
          outcomeText: 'The squad rejected the rival backchannel and reaffirmed commitment to your banner.',
        }),
      },
      {
        id: 'enforce_contracts',
        label: 'Remind everyone of contract buyout clauses',
        hint: 'No cash cost',
        effectDescription: '+3 Negotiation · -5 Player Morale',
        apply: (state) => ({
          updated: {
            ...state,
            character: {
              ...state.character,
              skills: {
                ...state.character.skills,
                negotiation: Math.min(100, state.character.skills.negotiation + 3),
              },
            },
            roster: state.roster.map((p) => ({
              ...p,
              morale: Math.max(25, p.morale - 5),
            })),
          },
          outcomeText: 'The rival backed off after seeing your ironclad buyout terms, though locker room mood cooled slightly.',
        }),
      },
    ],
  },
  {
    id: 'breakout_viral_clip',
    title: 'Org Highlight Goes Viral',
    category: 'Competitive',
    requiresOrg: true,
    description:
      'A clutch 1v4 highlight and behind-the-scenes mic check from your team just crossed half a million views across social feeds.',
    choices: [
      {
        id: 'boost_media_campaign',
        label: 'Double down with rapid merch & clips',
        hint: 'Costs $1,000 Org Bank',
        requiresOrgBalanceUSD: 1000,
        effectDescription: '+8,500 Followers · +$3,200 Merch Surge · +4 Org Reputation',
        apply: (state) => ({
          updated: {
            ...state,
            org: {
              ...state.org,
              bankBalanceUSD: state.org.bankBalanceUSD + 2200,
              followers: state.org.followers + 8500,
              reputation: Math.min(100, state.org.reputation + 4),
            },
          },
          outcomeText: 'Limited-run hoodies sold out in six hours and new fans flooded your team socials.',
        }),
      },
      {
        id: 'ride_organic_wave',
        label: 'Share the clip organically and keep focus on scrims',
        hint: 'No cost',
        effectDescription: '+3,500 Followers · +2 Org Reputation',
        apply: (state) => ({
          updated: {
            ...state,
            org: {
              ...state.org,
              followers: state.org.followers + 3500,
              reputation: Math.min(100, state.org.reputation + 2),
            },
          },
          outcomeText: 'Your channel gained steady new subscribers while the roster stayed locked in on practice.',
        }),
      },
    ],
  },
];
