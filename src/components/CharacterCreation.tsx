import React, { useState } from 'react';
import {
  ArrowRight,
  FlaskConical,
  Globe2,
  MapPin,
  Play,
  RotateCcw,
  Settings,
  Trash2,
  User,
} from 'lucide-react';
import { COUNTRIES, getCountryById } from '../data/countries';
import { ESPORTS_TITLES } from '../data/esportsTitles';
import { PlayerCareerSetup } from '../engine/career/playerCareerEngine';
import { ORG_STRATEGIES, ORG_TYPES } from '../engine/devAndSandbox';
import { formatCurrency } from '../engine/economy';
import { SaveSlotSummary } from '../engine/storage';
import tournamentArenaImg from '../assets/images/tournament_world_arena_1794780500054.jpg';
import { CareerType, PlayerStartingBackground } from '../types/career';
import {
  CharacterProfile,
  FamilyBackground,
  Gender,
  OrgStrategy,
  OrgType,
  PersonalityType,
} from '../types/game';

interface CharacterCreationProps {
  existingSaves: SaveSlotSummary[];
  sandboxSummary: SaveSlotSummary | null;
  onStartNewGame: (character: CharacterProfile, slotId: string) => void;
  onStartPlayerCareer: (
    character: CharacterProfile,
    setup: PlayerCareerSetup,
    slotId: string
  ) => void;
  onLoadSave: (slotId: string) => void;
  onDeleteSave: (slotId: string) => void;
  onStartSandbox: (
    character: CharacterProfile,
    orgType: OrgType,
    orgStrategy: OrgStrategy
  ) => void;
  onResumeSandbox: () => void;
  onDeleteSandbox: () => void;
  onOpenSettings: () => void;
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

const PLAYER_BACKGROUNDS: { bg: PlayerStartingBackground; note: string }[] = [
  { bg: 'Ranked Prodigy', note: '52 Skill · High solo-queue clout (+14 Popularity)' },
  { bg: 'LAN Grinder', note: 'Stage composure (+54 Pressure, +24 Experience)' },
  { bg: 'College Captain', note: '62 Teamwork · +16 Reputation · Reliable comms' },
  { bg: 'Academy Hopeful', note: '86 Potential ceiling · Coachable talent' },
];

const PRO_ROLES = ['IGL / Captain', 'Entry / Carry', 'Flex / Support', 'Sniper / Mid'];

export const CharacterCreation: React.FC<CharacterCreationProps> = ({
  existingSaves,
  sandboxSummary,
  onStartNewGame,
  onStartPlayerCareer,
  onLoadSave,
  onDeleteSave,
  onStartSandbox,
  onResumeSandbox,
  onDeleteSandbox,
  onOpenSettings,
}) => {
  const [careerType, setCareerType] = useState<CareerType>('OWNER');
  const [firstName, setFirstName] = useState('Alex');
  const [lastName, setLastName] = useState('Mercer');
  const [ign, setIgn] = useState('MercerGG');
  const [primaryGameId, setPrimaryGameId] = useState(ESPORTS_TITLES[0].id);
  const [preferredRole, setPreferredRole] = useState(PRO_ROLES[1]);
  const [playerBackground, setPlayerBackground] =
    useState<PlayerStartingBackground>('Ranked Prodigy');
  const [gender, setGender] = useState<Gender>('Male');
  const [countryId, setCountryId] = useState('usa');
  const [city, setCity] = useState('Los Angeles');
  const [personality, setPersonality] = useState<PersonalityType>('Analytical');
  const [familyBackground, setFamilyBackground] = useState<FamilyBackground>('Working Class');
  const [selectedSlot, setSelectedSlot] = useState('slot_1');
  const [sandboxOrgType, setSandboxOrgType] = useState<OrgType>('Global Franchise');
  const [sandboxOrgStrategy, setSandboxOrgStrategy] = useState<OrgStrategy>('International Expansion');
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

    if (careerType === 'PLAYER') {
      onStartPlayerCareer(
        character,
        {
          ign: ign.trim() || `${character.firstName}GG`,
          nationality: selectedCountry.name,
          primaryGameId,
          preferredRole,
          startingBackground: playerBackground,
        },
        selectedSlot
      );
      return;
    }

    onStartNewGame(character, selectedSlot);
  };

  return (
    <div className="min-h-screen bg-[#F3F5F9] dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch bg-white dark:bg-gradient-to-br dark:from-[#121826] dark:to-[#0E131D] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/15">
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <span>Career RPG</span>
                  <span aria-hidden="true">·</span>
                  <span>Club Management</span>
                  <span aria-hidden="true">·</span>
                  <span>Esports Tycoon</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  aria-label="Open Settings"
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Settings size={14} />
                  Settings
                </button>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance">
                Life Empire: Esports
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Begin at 18 with {formatCurrency(100, countryId)} in your pocket and zero industry backing.
                Grind local shifts, manage weekly energy, incorporate your own esports club, sign elite rosters,
                and battle rival giants on the World Championship stage.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Starting Cash</div>
                <div className="font-mono text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {formatCurrency(100, countryId)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Weekly Energy</div>
                <div className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  100 / 100
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Global Circuits</div>
                <div className="font-mono text-lg font-bold tabular-nums text-purple-600 dark:text-purple-400">
                  11 Titles
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[240px] lg:min-h-full bg-[#0E131D]">
            {!imageFailed ? (
              <img
                src={tournamentArenaImg}
                alt="Packed international esports championship arena stage"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-slate-300">
                <Globe2 size={36} className="mb-2 opacity-70" />
                <span className="font-display font-semibold text-base">From Nothing to a Global Esports Empire</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/85 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Existing Save Slots */}
        {existingSaves.length > 0 && (
          <section className="fm-panel p-6">
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
                  className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C]"
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
                    <div className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums pt-1">
                      {formatCurrency(save.cashUSD, save.countryId)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => onLoadSave(save.slotId)}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      <Play size={15} />
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSave(save.slotId)}
                      aria-label={`Delete save ${save.characterName}`}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-500/40 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sandbox Mode Isolated Launcher */}
        <section className="fm-panel p-6 border-purple-500/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="text-xs font-semibold text-purple-500 flex items-center gap-1.5">
                <FlaskConical size={14} />
                Sandbox Mode · Isolated Save Slot
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Open Sandbox &amp; Strategy Testing Lab
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Start immediately with unlimited capital, all 9 facilities, Paper Teams, full player recruitment, international expansion, and every tournament tier unlocked. Normal career slots are never affected.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <select
                aria-label="Sandbox Organization Type"
                value={sandboxOrgType}
                onChange={(e) => setSandboxOrgType(e.target.value as OrgType)}
                className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-medium"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id}
                  </option>
                ))}
              </select>
              <select
                aria-label="Sandbox Organization Strategy"
                value={sandboxOrgStrategy}
                onChange={(e) => setSandboxOrgStrategy(e.target.value as OrgStrategy)}
                className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-medium"
              >
                {ORG_STRATEGIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}
                  </option>
                ))}
              </select>

              {sandboxSummary && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onResumeSandbox}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold whitespace-nowrap"
                  >
                    Resume Sandbox (Wk {sandboxSummary.week})
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteSandbox}
                    aria-label="Delete Sandbox Save"
                    className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  onStartSandbox(
                    {
                      firstName: firstName.trim() || 'Alex',
                      lastName: lastName.trim() || 'Mercer',
                      age: 18,
                      gender,
                      countryId,
                      city,
                      education: 'MBA',
                      personality,
                      familyBackground,
                      skills: {
                        workEthic: 90,
                        businessAcumen: 92,
                        esportsKnowledge: 95,
                        negotiation: 90,
                        leadership: 92,
                        marketing: 90,
                      },
                      reputation: 85,
                      connections: 60,
                      health: 100,
                      stress: 10,
                    },
                    sandboxOrgType,
                    sandboxOrgStrategy
                  )
                }
                className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold whitespace-nowrap"
              >
                {sandboxSummary ? 'New Sandbox' : 'Launch Sandbox Mode'}
              </button>
            </div>
          </div>
        </section>

        {/* New Career Character Creator */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 fm-panel p-6 sm:p-8"
        >
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User size={20} className="text-blue-500" />
                Start Your Journey
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose between building an esports organisation from scratch or grinding to glory as an active pro player.
              </p>
            </div>

            {/* Dual Career Path Choice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCareerType('OWNER')}
                className={`min-h-[82px] text-left p-4 rounded-xl border transition-all ${
                  careerType === 'OWNER'
                    ? 'border-blue-500 bg-blue-600/15 shadow-sm shadow-blue-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Organisation Owner
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Work local shifts, save seed capital, found your club, sign players, and conquer global leagues.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCareerType('PLAYER')}
                className={`min-h-[82px] text-left p-4 rounded-xl border transition-all ${
                  careerType === 'PLAYER'
                    ? 'border-purple-500 bg-purple-600/15 shadow-sm shadow-purple-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Professional Esports Player
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Rise from Amateur to Legend, attend tryouts, sign team contracts, build fans, and retire into ownership.
                </p>
              </button>
            </div>

            {careerType === 'PLAYER' && (
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-600/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Player IGN / Handle
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={ign}
                      onChange={(e) => setIgn(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Main Esports Title
                    </span>
                    <select
                      value={primaryGameId}
                      onChange={(e) => setPrimaryGameId(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      {ESPORTS_TITLES.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Preferred Role
                    </span>
                    <select
                      value={preferredRole}
                      onChange={(e) => setPreferredRole(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      {PRO_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Competitive Origin
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PLAYER_BACKGROUNDS.map((pb) => (
                      <button
                        key={pb.bg}
                        type="button"
                        onClick={() => setPlayerBackground(pb.bg)}
                        className={`min-h-[48px] text-left p-3 rounded-xl border transition-colors ${
                          playerBackground === pb.bg
                            ? 'border-purple-500 bg-purple-600/15 text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="text-sm font-semibold">{pb.bg}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{pb.note}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">First Name</span>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Starting Age</span>
                <div className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0E14] text-sm font-mono flex items-center text-slate-600 dark:text-slate-300">
                  18 years old
                </div>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Gender</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </label>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Education</span>
                <div className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0E14] text-sm flex items-center text-slate-600 dark:text-slate-300">
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
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                        ? 'border-blue-500 bg-blue-600/10 text-slate-900 dark:text-white'
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
                        ? 'border-purple-500 bg-purple-600/10 text-slate-900 dark:text-white'
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
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:border-l lg:border-slate-200 lg:dark:border-slate-800 lg:pl-6">
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-500">
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

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-blue-500">Regional Advantage: </span>
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
                          ? 'border-blue-500 bg-blue-600 text-white'
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
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-display font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-lg shadow-blue-600/20"
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
