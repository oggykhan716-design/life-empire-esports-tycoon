import React, { useState } from 'react';
import { ArrowRight, Globe2, MapPin, Play, RotateCcw, Trash2, User } from 'lucide-react';
import { COUNTRIES, getCountryById } from '../data/countries';
import { formatCurrency } from '../engine/economy';
import { SaveSlotSummary } from '../engine/storage';
import {
  CharacterProfile,
  FamilyBackground,
  Gender,
  PersonalityType,
} from '../types/game';

interface CharacterCreationProps {
  existingSaves: SaveSlotSummary[];
  onStartNewGame: (character: CharacterProfile, slotId: string) => void;
  onLoadSave: (slotId: string) => void;
  onDeleteSave: (slotId: string) => void;
}

const PERSONALITIES: { type: PersonalityType; bonus: string }[] = [
  { type: 'Analytical', bonus: '+6 Business Acumen · +6 Esports Knowledge' },
  { type: 'Charismatic', bonus: '+6 Marketing · +4 Negotiation · +3 Connections' },
  { type: 'Relentless', bonus: '+8 Work Ethic · +4 Leadership' },
  { type: 'Pragmatic', bonus: '+6 Negotiation · +4 Business Acumen' },
  { type: 'Visionary', bonus: '+6 Leadership · +5 Esports Knowledge · +2 Reputation' },
];

const FAMILY_BACKGROUNDS: { bg: FamilyBackground; note: string }[] = [
  { bg: 'Working Class', note: 'Steady work habits (+4 Work Ethic)' },
  { bg: 'Single-Parent Household', note: 'Early independence (+4 Negotiation)' },
  { bg: 'Rural Laborers', note: 'High resilience (+5 Work Ethic, +2 Leadership)' },
  { bg: 'Immigrant Hustle', note: 'Adaptable mindset (+4 Business Acumen, +3 Connections)' },
];

export const CharacterCreation: React.FC<CharacterCreationProps> = ({
  existingSaves,
  onStartNewGame,
  onLoadSave,
  onDeleteSave,
}) => {
  const [firstName, setFirstName] = useState('Alex');
  const [lastName, setLastName] = useState('Mercer');
  const [gender, setGender] = useState<Gender>('Male');
  const [countryId, setCountryId] = useState('usa');
  const [city, setCity] = useState('Los Angeles');
  const [personality, setPersonality] = useState<PersonalityType>('Analytical');
  const [familyBackground, setFamilyBackground] = useState<FamilyBackground>('Working Class');
  const [selectedSlot, setSelectedSlot] = useState('slot_1');
  const [imageFailed, setImageFailed] = useState(false);

  const selectedCountry = getCountryById(countryId);

  const handleCountryChange = (newCountryId: string) => {
    setCountryId(newCountryId);
    const c = getCountryById(newCountryId);
    setCity(c.cities[0] ?? 'Capital City');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = {
      workEthic: 10,
      businessAcumen: 8,
      esportsKnowledge: 10,
      negotiation: 8,
      leadership: 8,
      marketing: 8,
    };
    let reputation = 0;
    let connections = 0;

    if (personality === 'Analytical') {
      skills.businessAcumen += 6;
      skills.esportsKnowledge += 6;
    } else if (personality === 'Charismatic') {
      skills.marketing += 6;
      skills.negotiation += 4;
      connections += 3;
    } else if (personality === 'Relentless') {
      skills.workEthic += 8;
      skills.leadership += 4;
    } else if (personality === 'Pragmatic') {
      skills.negotiation += 6;
      skills.businessAcumen += 4;
    } else if (personality === 'Visionary') {
      skills.leadership += 6;
      skills.esportsKnowledge += 5;
      reputation += 2;
    }

    if (familyBackground === 'Working Class') {
      skills.workEthic += 4;
    } else if (familyBackground === 'Single-Parent Household') {
      skills.negotiation += 4;
    } else if (familyBackground === 'Rural Laborers') {
      skills.workEthic += 5;
      skills.leadership += 2;
    } else if (familyBackground === 'Immigrant Hustle') {
      skills.businessAcumen += 4;
      connections += 3;
    }

    const character: CharacterProfile = {
      firstName: firstName.trim() || 'Alex',
      lastName: lastName.trim() || 'Mercer',
      age: 18,
      gender,
      countryId,
      city,
      education: 'High School',
      personality,
      familyBackground,
      skills,
      reputation,
      connections,
      health: 100,
      stress: 10,
    };

    onStartNewGame(character, selectedSlot);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Editorial Hero Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Text-Based Life Simulation</span>
                <span aria-hidden="true">·</span>
                <span>Career RPG</span>
                <span aria-hidden="true">·</span>
                <span>Esports Tycoon</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance">
                Life Empire: Esports
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Begin at 18 with {formatCurrency(100, countryId)}, no connections, and no organization.
                Work ordinary shifts, master weekly energy, save capital, register your club, sign players,
                and conquer the global esports circuit.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Starting Cash</div>
                <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(100, countryId)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Weekly Energy</div>
                <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                  100 / 100
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Esports Titles</div>
                <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                  11 Circuits
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[220px] lg:min-h-full bg-slate-900">
            {!imageFailed ? (
              <img
                src="/src/assets/images/title_esports_studio_1794777596198.jpg"
                alt="Sunlit apartment desk overlooking city skyline and distant esports arena"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-800 to-slate-950 text-slate-300">
                <Globe2 size={36} className="mb-2 opacity-70" />
                <span className="font-display font-semibold text-base">From Nothing to a Global Esports Empire</span>
              </div>
            )}
          </div>
        </div>

        {/* Existing Save Slots */}
        {existingSaves.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Continue Saved Career
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Resume an active playthrough stored locally in your browser.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {existingSaves.map((save) => (
                <div
                  key={save.slotId}
                  className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-semibold text-slate-900 dark:text-white">
                        {save.characterName}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        Yr {save.year} · Wk {save.week}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {save.orgName ? `CEO of ${save.orgName}` : 'Independent · Working Early Career'}
                    </div>
                    <div className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums pt-1">
                      {formatCurrency(save.cashUSD, save.countryId)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => onLoadSave(save.slotId)}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      <Play size={15} />
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSave(save.slotId)}
                      aria-label={`Delete save ${save.characterName}`}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-300 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* New Career Character Creator */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8"
        >
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Create Your Character
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Every playthrough adapts wages, living costs, currency, and licensing requirements to your chosen nation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">First Name</span>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Last Name</span>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Starting Age</span>
                <div className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-mono flex items-center text-slate-600 dark:text-slate-300">
                  18 years old
                </div>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Gender</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </label>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Education</span>
                <div className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm flex items-center text-slate-600 dark:text-slate-300">
                  High School
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Country</span>
                <select
                  value={countryId}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.currencyCode})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Starting City</span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {selectedCountry.cities.map((cName) => (
                    <option key={cName} value={cName}>
                      {cName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Personality</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => setPersonality(p.type)}
                    className={`min-h-[48px] text-left p-3 rounded-xl border transition-colors ${
                      personality === p.type
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-semibold">{p.type}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.bonus}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Family Background (Poor)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FAMILY_BACKGROUNDS.map((fb) => (
                  <button
                    key={fb.bg}
                    type="button"
                    onClick={() => setFamilyBackground(fb.bg)}
                    className={`min-h-[48px] text-left p-3 rounded-xl border transition-colors ${
                      familyBackground === fb.bg
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-semibold">{fb.bg}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{fb.note}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Country Economy Briefing & Launch */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-6">
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <MapPin size={14} />
                  <span>{selectedCountry.region}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {city}, {selectedCountry.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedCountry.description}
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800 text-sm">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Local Currency</span>
                  <span className="font-mono font-medium">{selectedCountry.currencyCode} ({selectedCountry.currencySymbol})</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Wage Index</span>
                  <span className="font-mono font-medium tabular-nums">{Math.round(selectedCountry.wageMultiplier * 100)}%</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Living Cost Index</span>
                  <span className="font-mono font-medium tabular-nums">{Math.round(selectedCountry.livingCostMultiplier * 100)}%</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Org Startup Est.</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatCurrency(Math.round(32500 * selectedCountry.licenseCostMultiplier), countryId)}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Esports Ecosystem</span>
                  <span className="font-mono font-medium tabular-nums">{selectedCountry.esportsEcosystem}/100</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Regional Advantage: </span>
                {selectedCountry.localBonus}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Save Slot</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['slot_1', 'slot_2', 'slot_3'] as const).map((slot, idx) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`min-h-[44px] rounded-lg border text-xs font-medium transition-colors ${
                        selectedSlot === slot
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Slot {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
              >
                Start Career
                <ArrowRight size={17} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFirstName('Alex');
                  setLastName('Mercer');
                  handleCountryChange('usa');
                  setPersonality('Analytical');
                  setFamilyBackground('Working Class');
                }}
                className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <RotateCcw size={13} />
                Reset Defaults
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
