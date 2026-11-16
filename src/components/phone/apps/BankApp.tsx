import React, { useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Landmark } from 'lucide-react';
import { formatCurrency } from '../../../engine/economy';
import { transferPersonalAndOrgBank } from '../../../engine/economy/bankEngine';
import { GameState } from '../../../types/game';

interface BankAppProps {
  state: GameState;
  onUpdateState: (next: GameState, toast?: string) => void;
}

export const BankApp: React.FC<BankAppProps> = ({ state, onUpdateState }) => {
  const ps = state.phoneState;
  const [scope, setScope] = useState<'PERSONAL' | 'ORGANISATION'>('PERSONAL');
  const [transferAmount, setTransferAmount] = useState('5000');
  const [transferDir, setTransferDir] = useState<'PERSONAL_TO_ORG' | 'ORG_TO_PERSONAL'>(
    'PERSONAL_TO_ORG'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!ps) return null;

  const accountId = scope === 'PERSONAL' ? 'personal_bank' : 'org_bank';
  const filteredTx = ps.transactions.filter((tx) => tx.accountId === accountId);

  const weeklyPayroll = state.org.founded
    ? state.roster.reduce((sum, p) => sum + Math.round(p.monthlySalaryUSD / 4), 0) +
      state.org.staff.reduce((sum, s) => sum + s.weeklySalaryUSD, 0) +
      state.org.creators.reduce((sum, c) => sum + c.weeklySalaryUSD, 0)
    : 0;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(transferAmount);
    const res = transferPersonalAndOrgBank(state, transferDir, num);
    if (res.error) {
      setErrorMsg(res.error);
      return;
    }
    setErrorMsg(null);
    onUpdateState(
      res.nextState,
      `Transferred $${Math.round(num).toLocaleString()} (${
        transferDir === 'PERSONAL_TO_ORG' ? 'Personal → Org' : 'Org → Personal'
      }).`
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F17] overflow-y-auto p-4 space-y-4">
      {/* Scope Switcher */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setScope('PERSONAL')}
          className={`flex-1 min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            scope === 'PERSONAL'
              ? 'bg-cyan-600 text-white'
              : 'bg-[#121A2A] text-slate-300 border border-slate-800'
          }`}
        >
          Personal Bank
        </button>
        <button
          type="button"
          disabled={!state.org.founded}
          onClick={() => setScope('ORGANISATION')}
          className={`flex-1 min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 ${
            scope === 'ORGANISATION'
              ? 'bg-blue-600 text-white'
              : 'bg-[#121A2A] text-slate-300 border border-slate-800'
          }`}
        >
          Organisation Bank
        </button>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#121D32] to-[#0C1220] border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-cyan-400">
            <Landmark size={14} />
            {scope === 'PERSONAL'
              ? `${state.character.firstName} ${state.character.lastName}`
              : `${state.org.name} Treasury`}
          </span>
          <span className="font-mono">Yr {state.year} · Wk {state.week}</span>
        </div>

        <div>
          <div className="text-[11px] text-slate-400">Available Bank Balance</div>
          <div className="font-mono text-2xl font-extrabold tabular-nums text-white mt-0.5">
            {formatCurrency(
              scope === 'PERSONAL' ? state.finances.bankBalanceUSD : state.org.bankBalanceUSD,
              state.character.countryId
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {scope === 'PERSONAL' ? (
            <>
              <div>
                <div className="text-[11px] text-slate-400">Wallet Cash</div>
                <div className="font-mono font-semibold text-emerald-400 tabular-nums">
                  {formatCurrency(state.finances.cashUSD, state.character.countryId)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Upcoming Pro Salary</div>
                <div className="font-mono font-semibold text-blue-400 tabular-nums">
                  {state.playerCareer?.currentOrgId
                    ? `${formatCurrency(
                        Math.round(state.playerCareer.monthlySalaryUSD / 4),
                        state.character.countryId
                      )}/wk`
                    : '$0/wk'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-[11px] text-slate-400">Weekly Payroll</div>
                <div className="font-mono font-semibold text-amber-400 tabular-nums">
                  {formatCurrency(weeklyPayroll, state.character.countryId)}/wk
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Sponsor Revenue</div>
                <div className="font-mono font-semibold text-emerald-400 tabular-nums">
                  {formatCurrency(
                    state.org.sponsors.reduce((s, sp) => s + sp.weeklyPayoutUSD, 0),
                    state.character.countryId
                  )}
                  /wk
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transfer Between Personal & Org Accounts */}
      {state.org.founded && (
        <form
          onSubmit={handleTransfer}
          className="rounded-2xl bg-[#111826] border border-slate-800 p-4 space-y-3"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-display font-bold text-white flex items-center gap-1.5">
              <ArrowLeftRight size={14} className="text-blue-400" />
              Inter-Account Transfer
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTransferDir('PERSONAL_TO_ORG')}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
                transferDir === 'PERSONAL_TO_ORG'
                  ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                  : 'border-slate-800 text-slate-400'
              }`}
            >
              Personal → Org
            </button>
            <button
              type="button"
              onClick={() => setTransferDir('ORG_TO_PERSONAL')}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
                transferDir === 'ORG_TO_PERSONAL'
                  ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                  : 'border-slate-800 text-slate-400'
              }`}
            >
              Org → Personal
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              step={100}
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs font-mono text-white"
            />
            <button
              type="submit"
              className="min-h-[40px] px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap"
            >
              Transfer
            </button>
          </div>
          {errorMsg && <p className="text-[11px] text-red-400">{errorMsg}</p>}
        </form>
      )}

      {/* Ledger */}
      <div className="rounded-2xl bg-[#111826] border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800/80 text-xs font-display font-bold text-white">
          Transaction Ledger ({filteredTx.length})
        </div>
        {filteredTx.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No recorded bank transactions yet for this account.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredTx.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              return (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isIncome
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {isIncome ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {tx.category}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{tx.description}</div>
                      <div className="text-[10px] font-mono text-slate-500">Wk {tx.gameWeek}</div>
                    </div>
                  </div>
                  <div
                    className={`font-mono text-xs font-bold tabular-nums shrink-0 ${
                      isIncome ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount, state.character.countryId)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
