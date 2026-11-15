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
import { FinancialCharts } from './FinancialCharts';
import facilityHqImg from '../assets/images/facility_bootcamp_hq_1794780501022.jpg';

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
  const [hqImgFailed, setHqImgFailed] = useState(false);

  const { total: weeklyExpensesUSD, breakdown } = calculateWeeklyPersonalExpensesUSD(state);
  const netWorthUSD = calculatePersonalNetWorthUSD(state);
  const availableSponsors = generateAvailableSponsors(state);
  const energyCosts = getEnergyCosts(state);

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="fm-panel p-2.5 flex items-center gap-1.5 overflow-x-auto">
        {(
          [
            { id: 'personal', label: 'Personal Finance' },
            { id: 'org', label: 'Org Treasury & Sponsors' },
            { id: 'facilities', label: 'Facilities & HQ' },
            { id: 'staff_media', label: 'Staff & Media' },
            { id: 'lifestyle', label: 'Lifestyle & Investments' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
              subTab === t.id
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Live Financial Analytics Charts on Finance Tabs */}
      {(subTab === 'personal' || subTab === 'org') && (
        <FinancialCharts
          state={state}
          personalExpensesUSD={weeklyExpensesUSD}
          expenseBreakdown={breakdown}
        />
      )}

      {/* 1. PERSONAL FINANCE */}
      {subTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 fm-panel p-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet size={19} className="text-blue-500" />
                Personal Ledger &amp; Banking
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Personal capital and organization funds remain strictly isolated. Bank savings accrue weekly interest.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 py-4 border-y border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">Wallet Cash</div>
                <div className="font-mono text-base font-bold tabular-nums mt-0.5">
                  {formatCurrency(state.finances.cashUSD, state.character.countryId)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">Bank Balance</div>
                <div className="font-mono text-base font-bold tabular-nums text-blue-500 mt-0.5">
                  {formatCurrency(state.finances.bankBalanceUSD, state.character.countryId)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">Debt</div>
                <div className="font-mono text-base font-bold tabular-nums text-red-500 mt-0.5">
                  {formatCurrency(state.finances.debtUSD, state.character.countryId)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">Net Worth</div>
                <div className="font-mono text-base font-bold tabular-nums text-emerald-500 mt-0.5">
                  {formatCurrency(netWorthUSD, state.character.countryId, true)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Quick Cash / Bank Transfer Amount
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[100, 500, 2000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTransferAmt(amt)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-mono ${
                      transferAmt === amt
                        ? 'border-blue-500 bg-blue-600/15 text-blue-400'
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
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 text-xs font-semibold"
                >
                  Deposit to Bank
                </button>
                <button
                  type="button"
                  disabled={state.finances.bankBalanceUSD < transferAmt}
                  onClick={() => onWithdrawFromBank(transferAmt)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-xs font-semibold"
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

          <section className="lg:col-span-5 fm-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Weekly Living Costs
              </h3>
              <span className="font-mono text-base font-bold tabular-nums text-amber-500">
                {formatCurrency(weeklyExpensesUSD, state.character.countryId)}/wk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSetLifestyle('basic')}
                className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-semibold ${
                  state.finances.lifestyle === 'basic'
                    ? 'border-blue-500 bg-blue-600/15 text-blue-400'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                Basic Lifestyle
              </button>
              <button
                type="button"
                onClick={() => onSetLifestyle('expensive')}
                className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-semibold ${
                  state.finances.lifestyle === 'expensive'
                    ? 'border-purple-500 bg-purple-600/15 text-purple-400'
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

      {/* 2. ORG TREASURY & SPONSORS */}
      {subTab === 'org' && (
        <div className="space-y-6">
          {!state.org.founded ? (
            <div className="fm-panel p-8 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Establish your esports organization in the Esports tab to unlock corporate accounts and sponsorships.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-5 fm-panel p-6 space-y-4">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins size={18} className="text-blue-500" />
                  Organization Treasury
                </h3>
                <div className="grid grid-cols-2 gap-3.5 py-3 border-y border-slate-100 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500">Org Bank</div>
                    <div className="font-mono text-lg font-bold tabular-nums">
                      {formatCurrency(state.org.bankBalanceUSD, state.character.countryId)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500">Valuation</div>
                    <div className="font-mono text-lg font-bold tabular-nums text-emerald-500">
                      {formatCurrency(state.org.valuationUSD, state.character.countryId, true)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500">Last Week Rev</div>
                    <div className="font-mono text-sm font-semibold tabular-nums text-emerald-500">
                      +{formatCurrency(state.org.lastWeekRevenueUSD, state.character.countryId)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121C] border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500">Last Week Burn</div>
                    <div className="font-mono text-sm font-semibold tabular-nums text-red-500">
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
                            ? 'border-blue-500 bg-blue-600/15 text-blue-400'
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
                    className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 disabled:opacity-40 text-white text-xs font-semibold"
                  >
                    Inject {formatCurrency(orgTransferAmt, state.character.countryId)} into Org Bank
                  </button>
                </div>
              </section>

              <section className="lg:col-span-7 fm-panel p-6 space-y-4">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Sponsorship Agreements ({state.org.sponsors.length} Active)
                </h3>

                {state.org.sponsors.length > 0 && (
                  <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    {state.org.sponsors.map((sp) => (
                      <div
                        key={sp.id}
                        className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {sp.brandName} ({sp.industry})
                          </div>
                          <div className="text-slate-500 dark:text-slate-300">
                            {sp.type} · {sp.weeksRemaining} weeks left · Win bonus{' '}
                            {formatCurrency(sp.winBonusUSD, state.character.countryId)}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-emerald-500">
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
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-35 text-xs font-semibold whitespace-nowrap shrink-0"
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

      {/* 3. FACILITIES & HQ */}
      {subTab === 'facilities' && (
        <div className="space-y-6">
          {/* Facility HQ Showcase Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[180px] bg-[#0D121C]">
            {!hqImgFailed && (
              <img
                src={facilityHqImg}
                alt="Modern esports training bootcamp and facility interior"
                referrerPolicy="no-referrer"
                onError={() => setHqImgFailed(true)}
                className="absolute inset-0 w-full h-full object-cover opacity-55"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/80 to-transparent" />
            <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
              <div className="space-y-1 max-w-xl">
                <div className="text-xs font-semibold text-blue-400">
                  Infrastructure &amp; Training Campus · Level {state.org.facilityLevel}/9
                </div>
                <h3 className="font-display text-2xl font-extrabold">
                  {FACILITY_TIERS.find((f) => f.level === state.org.facilityLevel)?.name ??
                    'Organization Headquarters'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  World-class bootcamps accelerate player development, expand division slots, and attract superstar free agents.
                </p>
              </div>
              {state.org.facilityUnderConstruction && (
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                  Upgrading to Level {state.org.facilityUnderConstruction.targetLevel} (
                  {state.org.facilityUnderConstruction.weeksRemaining} wk left)
                </div>
              )}
            </div>
          </div>

          <section className="fm-panel p-6 space-y-4">
            {!state.org.founded ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Establish your organization first to acquire offices, bootcamps, and gaming houses.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FACILITY_TIERS.map((fac) => {
                  const owned = state.org.facilityLevel >= fac.level;
                  const unlockedOverride = Boolean(state.isSandbox || state.devOverrides?.unlockAllFacilities);
                  const isNext = state.org.facilityLevel + 1 === fac.level || unlockedOverride;
                  const canAfford = state.org.bankBalanceUSD >= fac.costUSD || Boolean(state.isSandbox);
                  const busy = state.org.facilityUnderConstruction !== null && !state.devOverrides?.instantUpgrades && !state.isSandbox;

                  return (
                    <div
                      key={fac.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${
                        owned
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : isNext
                          ? 'border-blue-500/50 bg-blue-600/5'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-blue-500 font-bold">TIER {fac.level}</span>
                          {owned && <CheckCircle2 size={16} className="text-emerald-500" />}
                        </div>
                        <div className="font-display font-bold text-base text-slate-900 dark:text-white">
                          {fac.name}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{fac.description}</p>
                        <div className="pt-2 space-y-1 text-xs font-mono text-slate-500 tabular-nums">
                          <div>Max Divisions: {fac.maxDivisions} · Training +{fac.trainingBonus}%</div>
                          <div>
                            Upkeep: {formatCurrency(fac.weeklyMaintenanceUSD, state.character.countryId)}/wk ·{' '}
                            {state.isSandbox || state.devOverrides?.instantUpgrades ? 'Instant build' : `${fac.constructionWeeks} wk build`}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={owned || !isNext || !canAfford || busy || (!state.isSandbox && state.energy < energyCosts.orgManagement)}
                        onClick={() => onUpgradeFacility(fac.level)}
                        className={`w-full min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          owned
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : isNext && canAfford && !busy
                            ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {owned
                          ? 'Operational'
                          : isNext
                          ? `Build (${formatCurrency(fac.costUSD, state.character.countryId, true)})`
                          : `Requires Tier ${fac.level - 1}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 4. STAFF & MEDIA */}
      {subTab === 'staff_media' && (
        <div className="space-y-6">
          {!state.org.founded ? (
            <div className="fm-panel p-8 text-center text-sm text-slate-500">
              Establish your organization first to recruit professional staff and launch your media division.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-7 fm-panel p-6 space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck size={18} className="text-blue-500" />
                    Executive &amp; Coaching Staff (10 Roles)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dedicated staff reduce CEO energy costs and elevate match prep, scouting, and revenue.
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
                          <div className="text-xs text-blue-500 font-medium">
                            {role.department} · {role.energyReductionTask}
                          </div>
                          <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                            {role.title}
                            {hired && (
                              <span className="text-xs font-normal text-emerald-500 ml-2">
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
                            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-red-500/40 text-red-500 text-xs font-semibold shrink-0"
                          >
                            Dismiss ({formatCurrency(hired.weeklySalaryUSD, state.character.countryId)}/wk)
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={state.org.bankBalanceUSD < role.baseWeeklySalaryUSD * 2}
                            onClick={() => onHireStaff(role.id)}
                            className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-35 text-xs font-semibold whitespace-nowrap shrink-0"
                          >
                            Hire ({formatCurrency(role.baseWeeklySalaryUSD, state.character.countryId)}/wk)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="lg:col-span-5 fm-panel p-6 space-y-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Megaphone size={18} className="text-purple-500" />
                    Content &amp; Media Studio
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Global Audience: <strong className="font-mono text-slate-900 dark:text-white">{state.org.followers.toLocaleString()}</strong> followers
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={state.org.youtubeLaunched || state.org.bankBalanceUSD < 3000}
                    onClick={() => onLaunchMediaInitiative('youtube')}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] flex items-center justify-between text-left disabled:opacity-50"
                  >
                    <div>
                      <div className="text-sm font-semibold">YouTube &amp; Documentary Studio</div>
                      <div className="text-xs text-slate-500">Weekly ad revenue scaling with followers</div>
                    </div>
                    <span className="font-mono text-xs font-semibold text-blue-500">
                      {state.org.youtubeLaunched ? 'Active' : formatCurrency(3000, state.character.countryId)}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={state.org.podcastLaunched || state.org.bankBalanceUSD < 1800}
                    onClick={() => onLaunchMediaInitiative('podcast')}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] flex items-center justify-between text-left disabled:opacity-50"
                  >
                    <div>
                      <div className="text-sm font-semibold">Esports Talk Podcast</div>
                      <div className="text-xs text-slate-500">Steady sponsor &amp; community engagement</div>
                    </div>
                    <span className="font-mono text-xs font-semibold text-blue-500">
                      {state.org.podcastLaunched ? 'Active' : formatCurrency(1800, state.character.countryId)}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={state.org.merchBrandLaunched || state.org.bankBalanceUSD < 5000}
                    onClick={() => onLaunchMediaInitiative('merch')}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] flex items-center justify-between text-left disabled:opacity-50"
                  >
                    <div>
                      <div className="text-sm font-semibold">Official Apparel &amp; Merch Line</div>
                      <div className="text-xs text-slate-500">4x apparel revenue per follower</div>
                    </div>
                    <span className="font-mono text-xs font-semibold text-blue-500">
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
                          className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 disabled:opacity-40 text-xs font-semibold"
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
                          <span className="font-mono text-emerald-500">
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
          <section className="lg:col-span-6 fm-panel p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                Investment Portfolio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grow personal wealth independently via index equities, crypto, real estate, and private businesses.
              </p>
            </div>

            {state.finances.investments.length > 0 && (
              <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500">Active Holdings</div>
                {state.finances.investments.map((inv) => {
                  const pnl = inv.currentValueUSD - inv.investedUSD;
                  return (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121C] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-sm">{inv.name}</div>
                        <div className="font-mono text-slate-500">
                          Value: {formatCurrency(inv.currentValueUSD, state.character.countryId)} (
                          <span className={pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                            {pnl >= 0 ? '+' : ''}
                            {formatCurrency(pnl, state.character.countryId)}
                          </span>
                          )
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSellInvestment(inv.id)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-blue-500 font-semibold"
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
                      <div className="text-xs text-purple-500 font-medium">
                        {prod.category} · Risk: {prod.riskLevel}
                      </div>
                      <div className="font-display font-semibold text-sm">{prod.name}</div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{prod.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onInvest(prod.id, prod.minUnitUSD)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-35 text-xs font-mono font-semibold whitespace-nowrap shrink-0"
                    >
                      Invest {formatCurrency(prod.minUnitUSD, state.character.countryId, true)}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="lg:col-span-6 fm-panel p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag size={18} className="text-purple-500" />
                Properties, Vehicles &amp; Luxury
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Properties eliminate rent expenses. Luxury assets elevate reputation and executive connections.
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
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : canAfford
                          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
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
