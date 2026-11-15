import React, { useState } from 'react';
import {
  Building,
  CheckCircle2,
  Coins,
  Megaphone,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { FACILITY_TIERS, STAFF_ROLES } from '../data/facilitiesAndStaff';
import { INVESTMENT_PRODUCTS, LIFESTYLE_ITEMS } from '../data/lifestyleAndInvestments';
import {
  calculatePersonalNetWorthUSD,
  calculateWeeklyPersonalExpensesUSD,
  formatCurrency,
} from '../engine/economy';
import { generateAvailableSponsors, getEnergyCosts } from '../engine/weeklyEngine';
import { ContentCreator, GameState, LifestyleTier, StaffRoleId } from '../types/game';

interface BusinessViewProps {
  state: GameState;
  onDepositToBank: (amountUSD: number) => void;
  onWithdrawFromBank: (amountUSD: number) => void;
  onPayDebt: (amountUSD: number) => void;
  onSetLifestyle: (tier: LifestyleTier) => void;
  onTransferPersonalToOrg: (amountUSD: number) => void;
  onUpgradeFacility: (targetLevel: number) => void;
  onHireStaff: (roleId: StaffRoleId) => void;
  onFireStaff: (staffId: string) => void;
  onSignSponsor: (sponsorId: string) => void;
  onLaunchMediaInitiative: (kind: 'youtube' | 'podcast' | 'merch') => void;
  onHireCreator: (specialty: ContentCreator['specialty']) => void;
  onBuyLifestyleAsset: (assetId: string) => void;
  onInvest: (productId: string, amountUSD: number) => void;
  onSellInvestment: (holdingId: string) => void;
}

type BizSubTab = 'personal' | 'org' | 'facilities' | 'staff_media' | 'lifestyle';

export const BusinessView: React.FC<BusinessViewProps> = ({
  state,
  onDepositToBank,
  onWithdrawFromBank,
  onPayDebt,
  onSetLifestyle,
  onTransferPersonalToOrg,
  onUpgradeFacility,
  onHireStaff,
  onFireStaff,
  onSignSponsor,
  onLaunchMediaInitiative,
  onHireCreator,
  onBuyLifestyleAsset,
  onInvest,
  onSellInvestment,
}) => {
  const [subTab, setSubTab] = useState<BizSubTab>('personal');
  const [transferAmt, setTransferAmt] = useState(500);
  const [orgTransferAmt, setOrgTransferAmt] = useState(2500);

  const { total: weeklyExpensesUSD, breakdown } = calculateWeeklyPersonalExpensesUSD(state);
  const netWorthUSD = calculatePersonalNetWorthUSD(state);
  const availableSponsors = generateAvailableSponsors(state);
  const energyCosts = getEnergyCosts(state);

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center gap-1.5 overflow-x-auto">
        {(
          [
            { id: 'personal', label: 'Personal Finance' },
            { id: 'org', label: 'Org Finances & Sponsors' },
            { id: 'facilities', label: 'Facilities' },
            { id: 'staff_media', label: 'Staff & Media' },
            { id: 'lifestyle', label: 'Lifestyle & Investments' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              subTab === t.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. PERSONAL FINANCE */}
      {subTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet size={19} className="text-blue-600" />
                Personal Ledger
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Personal money and organization capital are strictly separated. Bank savings earn weekly interest.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-500">Wallet Cash</div>
                <div className="font-mono text-base font-bold tabular-nums">
                  {formatCurrency(state.finances.cashUSD, state.character.countryId)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Bank Balance</div>
                <div className="font-mono text-base font-bold tabular-nums">
                  {formatCurrency(state.finances.bankBalanceUSD, state.character.countryId)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Debt</div>
                <div className="font-mono text-base font-bold tabular-nums text-red-600 dark:text-red-400">
                  {formatCurrency(state.finances.debtUSD, state.character.countryId)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Net Worth</div>
                <div className="font-mono text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(netWorthUSD, state.character.countryId, true)}
                </div>
              </div>
            </div>

            {/* Cash <-> Bank Transfer */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cash &amp; Banking Transfers
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[100, 500, 2000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTransferAmt(amt)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-mono ${
                      transferAmt === amt
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {formatCurrency(amt, state.character.countryId)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={state.finances.cashUSD < transferAmt}
                  onClick={() => onDepositToBank(transferAmt)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-40 text-xs font-semibold"
                >
                  Deposit to Bank
                </button>
                <button
                  type="button"
                  disabled={state.finances.bankBalanceUSD < transferAmt}
                  onClick={() => onWithdrawFromBank(transferAmt)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs font-semibold"
                >
                  Withdraw to Cash
                </button>
                {state.finances.debtUSD > 0 && (
                  <button
                    type="button"
                    disabled={state.finances.cashUSD + state.finances.bankBalanceUSD <= 0}
                    onClick={() =>
                      onPayDebt(
                        Math.min(
                          state.finances.debtUSD,
                          state.finances.cashUSD + state.finances.bankBalanceUSD
                        )
                      )
                    }
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-40 text-xs font-semibold"
                  >
                    Pay Off Debt
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Living Expenses & Lifestyle Toggle */}
          <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Weekly Living Costs
              </h3>
              <span className="font-mono text-base font-bold tabular-nums text-amber-700 dark:text-amber-400">
                {formatCurrency(weeklyExpensesUSD, state.character.countryId)}/wk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSetLifestyle('basic')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold ${
                  state.finances.lifestyle === 'basic'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                Basic Lifestyle
              </button>
              <button
                type="button"
                onClick={() => onSetLifestyle('expensive')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold ${
                  state.finances.lifestyle === 'expensive'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                Expensive Lifestyle
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {breakdown.map((row) => (
                <div key={row.label} className="py-2 flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatCurrency(row.amountUSD, state.character.countryId)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 2. ORG FINANCES & SPONSORS */}
      {subTab === 'org' && (
        <div className="space-y-6">
          {!state.org.founded ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Found your esports organization in the Esports tab to unlock corporate accounts and sponsorship agreements.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins size={18} className="text-blue-600" />
                  Organization Treasury
                </h3>
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs text-slate-500">Org Bank</div>
                    <div className="font-mono text-lg font-bold tabular-nums">
                      {formatCurrency(state.org.bankBalanceUSD, state.character.countryId)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Valuation</div>
                    <div className="font-mono text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(state.org.valuationUSD, state.character.countryId, true)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Last Week Rev</div>
                    <div className="font-mono text-sm font-semibold tabular-nums text-emerald-600">
                      +{formatCurrency(state.org.lastWeekRevenueUSD, state.character.countryId)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Last Week Burn</div>
                    <div className="font-mono text-sm font-semibold tabular-nums text-red-600">
                      -{formatCurrency(state.org.lastWeekExpensesUSD, state.character.countryId)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Capital Injection (Personal → Organization)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[2500, 10000, 25000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setOrgTransferAmt(amt)}
                        className={`min-h-[38px] px-3 py-1 rounded-lg border text-xs font-mono ${
                          orgTransferAmt === amt
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {formatCurrency(amt, state.character.countryId, true)}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={state.finances.cashUSD + state.finances.bankBalanceUSD < orgTransferAmt}
                    onClick={() => onTransferPersonalToOrg(orgTransferAmt)}
                    className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold"
                  >
                    Inject {formatCurrency(orgTransferAmt, state.character.countryId)} into Org Bank
                  </button>
                </div>
              </section>

              {/* Sponsors */}
              <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Sponsorship Agreements ({state.org.sponsors.length} Active)
                </h3>

                {state.org.sponsors.length > 0 && (
                  <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    {state.org.sponsors.map((sp) => (
                      <div
                        key={sp.id}
                        className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {sp.brandName} ({sp.industry})
                          </div>
                          <div className="text-slate-500">
                            {sp.type} · {sp.weeksRemaining} weeks left · Win bonus{' '}
                            {formatCurrency(sp.winBonusUSD, state.character.countryId)}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          +{formatCurrency(sp.weeklyPayoutUSD, state.character.countryId)}/wk
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {availableSponsors.map((sp) => {
                    const eligible = state.org.reputation >= sp.minReputation;
                    return (
                      <div
                        key={sp.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500">
                            {sp.industry} · {sp.type} · {sp.weeksRemaining} weeks
                          </div>
                          <div className="font-display font-semibold text-sm">{sp.brandName}</div>
                          <div className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                            {formatCurrency(sp.weeklyPayoutUSD, state.character.countryId)}/wk +{' '}
                            {formatCurrency(sp.signingBonusUSD, state.character.countryId)} signing · Req Rep {sp.minReputation}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!eligible || state.energy < energyCosts.contractNegotiation}
                          onClick={() => onSignSponsor(sp.id)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white disabled:opacity-35 text-xs font-semibold whitespace-nowrap shrink-0"
                        >
                          {eligible ? `Sign (-${energyCosts.contractNegotiation} EN)` : `Need Rep ${sp.minReputation}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {/* 3. FACILITIES */}
      {subTab === 'facilities' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          {!state.org.founded ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Establish your organization first to acquire offices, bootcamps, and gaming houses.
            </p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building size={18} className="text-blue-600" />
                    Facility Progression (Level {state.org.facilityLevel}/9)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Higher-tier facilities unlock more game divisions, accelerate training, and attract superstars.
                  </p>
                </div>
                {state.org.facilityUnderConstruction && (
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Upgrading to Level {state.org.facilityUnderConstruction.targetLevel} (
                    {state.org.facilityUnderConstruction.weeksRemaining} wk left)
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {FACILITY_TIERS.map((fac) => {
                  const owned = state.org.facilityLevel >= fac.level;
                  const isNext = state.org.facilityLevel + 1 === fac.level;
                  const canAfford = state.org.bankBalanceUSD >= fac.costUSD;
                  const busy = state.org.facilityUnderConstruction !== null;

                  return (
                    <div
                      key={fac.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                            {fac.level}. {fac.name}
                          </span>
                          {owned && <CheckCircle2 size={15} className="text-emerald-600" />}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{fac.description}</p>
                        <div className="flex flex-wrap gap-x-4 text-xs font-mono text-slate-500 tabular-nums">
                          <span>Max Divisions: {fac.maxDivisions}</span>
                          <span>Training +{fac.trainingBonus}%</span>
                          <span>Upkeep: {formatCurrency(fac.weeklyMaintenanceUSD, state.character.countryId)}/wk</span>
                          <span>Build: {fac.constructionWeeks} wk</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={owned || !isNext || !canAfford || busy || state.energy < energyCosts.orgManagement}
                        onClick={() => onUpgradeFacility(fac.level)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${
                          owned
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                            : isNext && canAfford && !busy
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {owned
                          ? 'Active'
                          : isNext
                          ? `Build (${formatCurrency(fac.costUSD, state.character.countryId, true)})`
                          : `Requires Lvl ${fac.level - 1}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* 4. STAFF & MEDIA */}
      {subTab === 'staff_media' && (
        <div className="space-y-6">
          {!state.org.founded ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500">
              Establish your organization first to recruit professional staff and launch your media division.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Staff */}
              <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck size={18} className="text-blue-600" />
                    Executive &amp; Performance Staff
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hiring staff reduces CEO energy costs for routine tasks and improves competitive/media outcomes.
                  </p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {STAFF_ROLES.map((role) => {
                    const hired = state.org.staff.find((s) => s.roleId === role.id);
                    return (
                      <div
                        key={role.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500">
                            {role.department} · {role.energyReductionTask}
                          </div>
                          <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                            {role.title}
                            {hired && (
                              <span className="text-xs font-normal text-emerald-600 ml-2">
                                ({hired.name})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">{role.perkSummary}</p>
                        </div>
                        {hired ? (
                          <button
                            type="button"
                            onClick={() => onFireStaff(hired.id)}
                            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold shrink-0"
                          >
                            Dismiss ({formatCurrency(hired.weeklySalaryUSD, state.character.countryId)}/wk)
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={state.org.bankBalanceUSD < role.baseWeeklySalaryUSD * 2}
                            onClick={() => onHireStaff(role.id)}
                            className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white disabled:opacity-35 text-xs font-semibold whitespace-nowrap shrink-0"
                          >
                            Hire ({formatCurrency(role.baseWeeklySalaryUSD, state.character.countryId)}/wk)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Content Creation & Media */}
              <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Megaphone size={18} className="text-blue-600" />
                    Content &amp; Media Division
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Audience: <strong className="font-mono">{state.org.followers.toLocaleString()}</strong> followers
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={state.org.youtubeLaunched || state.org.bankBalanceUSD < 3000}
                    onClick={() => onLaunchMediaInitiative('youtube')}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left disabled:opacity-50"
                  >
                    <div>
                      <div className="text-sm font-semibold">Launch YouTube &amp; Documentary Studio</div>
                      <div className="text-xs text-slate-500">Weekly ad revenue scaling with followers</div>
                    </div>
                    <span className="font-mono text-xs font-semibold">
                      {state.org.youtubeLaunched ? 'Active' : formatCurrency(3000, state.character.countryId)}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={state.org.podcastLaunched || state.org.bankBalanceUSD < 1800}
                    onClick={() => onLaunchMediaInitiative('podcast')}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left disabled:opacity-50"
                  >
                    <div>
                      <div className="text-sm font-semibold">Launch Esports Talk Podcast</div>
                      <div className="text-xs text-slate-500">Steady sponsor &amp; community engagement</div>
                    </div>
                    <span className="font-mono text-xs font-semibold">
                      {state.org.podcastLaunched ? 'Active' : formatCurrency(1800, state.character.countryId)}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={state.org.merchBrandLaunched || state.org.bankBalanceUSD < 5000}
                    onClick={() => onLaunchMediaInitiative('merch')}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left disabled:opacity-50"
                  >
                    <div>
                      <div className="text-sm font-semibold">Establish Official Merch Brand</div>
                      <div className="text-xs text-slate-500">4x apparel revenue per follower</div>
                    </div>
                    <span className="font-mono text-xs font-semibold">
                      {state.org.merchBrandLaunched ? 'Active' : formatCurrency(5000, state.character.countryId)}
                    </span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sign Streamers &amp; Creators ({state.org.creators.length} signed)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Streamer', 'YouTube Producer', 'Podcast Host', 'Documentary Lead'] as const).map(
                      (spec) => (
                        <button
                          key={spec}
                          type="button"
                          disabled={state.org.bankBalanceUSD < 2000}
                          onClick={() => onHireCreator(spec)}
                          className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-600 disabled:opacity-40 text-xs font-semibold"
                        >
                          + {spec}
                        </button>
                      )
                    )}
                  </div>
                  {state.org.creators.length > 0 && (
                    <div className="space-y-1.5 text-xs">
                      {state.org.creators.map((c) => (
                        <div key={c.id} className="flex justify-between py-1">
                          <span>
                            {c.handle} ({c.specialty})
                          </span>
                          <span className="font-mono text-emerald-600">
                            +{formatCurrency(c.weeklyRevenueUSD - c.weeklySalaryUSD, state.character.countryId)}/wk net
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {/* 5. PERSONAL LIFESTYLE & INVESTMENTS */}
      {subTab === 'lifestyle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Investments */}
          <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" />
                Personal Investments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Build personal wealth independently of your esports organization through equities, crypto, real estate, and private businesses.
              </p>
            </div>

            {state.finances.investments.length > 0 && (
              <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500">Your Holdings</div>
                {state.finances.investments.map((inv) => {
                  const pnl = inv.currentValueUSD - inv.investedUSD;
                  return (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-sm">{inv.name}</div>
                        <div className="font-mono text-slate-500">
                          Value: {formatCurrency(inv.currentValueUSD, state.character.countryId)} (
                          <span className={pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {pnl >= 0 ? '+' : ''}
                            {formatCurrency(pnl, state.character.countryId)}
                          </span>
                          )
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSellInvestment(inv.id)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-600 font-semibold"
                      >
                        Liquidate
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {INVESTMENT_PRODUCTS.map((prod) => {
                const canAfford =
                  state.finances.cashUSD + state.finances.bankBalanceUSD >= prod.minUnitUSD;
                return (
                  <div
                    key={prod.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-500">
                        {prod.category} · Risk: {prod.riskLevel}
                      </div>
                      <div className="font-display font-semibold text-sm">{prod.name}</div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{prod.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onInvest(prod.id, prod.minUnitUSD)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white disabled:opacity-35 text-xs font-mono font-semibold whitespace-nowrap shrink-0"
                    >
                      Invest {formatCurrency(prod.minUnitUSD, state.character.countryId, true)}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Properties, Vehicles, Luxury */}
          <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag size={18} className="text-blue-600" />
                Properties, Vehicles &amp; Luxury
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buying a property waives weekly rent. Luxury items boost personal reputation and executive connections.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto pr-1">
              {LIFESTYLE_ITEMS.map((item) => {
                const owned = state.finances.ownedAssetIds.includes(item.id);
                const canAfford =
                  state.finances.cashUSD + state.finances.bankBalanceUSD >= item.priceUSD;
                return (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-500">
                        {item.category} · +{item.reputationBonus} Rep · +{item.connectionsBonus} Conn
                      </div>
                      <div className="font-display font-semibold text-sm">{item.name}</div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={owned || !canAfford}
                      onClick={() => onBuyLifestyleAsset(item.id)}
                      className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap shrink-0 ${
                        owned
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : canAfford
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {owned ? 'Owned' : formatCurrency(item.priceUSD, state.character.countryId, true)}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
