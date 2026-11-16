import { WorldEvent } from '../events/types';
import { GameState } from '../../types/game';
import { BankAccount, BankTransaction } from '../../types/finance';

export function buildBankAccounts(state: GameState): BankAccount[] {
  const ownerName = `${state.character.firstName} ${state.character.lastName}`.trim();
  const accounts: BankAccount[] = [
    {
      id: 'personal_bank',
      scope: 'PERSONAL',
      label: 'Personal Checking & Savings',
      ownerName,
    },
  ];
  if (state.org.founded) {
    accounts.push({
      id: 'org_bank',
      scope: 'ORGANISATION',
      label: `${state.org.name || 'Organisation'} Corporate Treasury`,
      ownerName: state.org.name || 'Organisation',
    });
  }
  return accounts;
}

export function appendBankTransaction(
  transactions: BankTransaction[],
  tx: Omit<BankTransaction, 'id'> & { id?: string }
): BankTransaction[] {
  // Deduplicate by relatedEventId + accountId + category if derived from an event
  if (tx.relatedEventId) {
    const duplicate = transactions.some(
      (existing) =>
        existing.relatedEventId === tx.relatedEventId &&
        existing.accountId === tx.accountId &&
        existing.category === tx.category
    );
    if (duplicate) return transactions;
  }

  const record: BankTransaction = {
    ...tx,
    id: tx.id ?? `tx_${tx.gameWeek}_${tx.accountId}_${transactions.length}_${Math.round(tx.amount)}`,
  };
  return [record, ...transactions].slice(0, 150);
}

export function applyEventToBank(
  transactions: BankTransaction[],
  event: WorldEvent
): BankTransaction[] {
  const p = event.payload;
  const amount = typeof p.amountUSD === 'number' ? Math.round(p.amountUSD) : 0;
  if (amount <= 0) return transactions;

  if (event.type === 'TOURNAMENT_PRIZE_RECEIVED') {
    const accountId = (p.accountId as string) || 'org_bank';
    return appendBankTransaction(transactions, {
      accountId,
      type: 'INCOME',
      category: 'Tournament Prize',
      amount,
      description: event.description || `Prize money: ${event.title}`,
      timestamp: event.timestamp,
      gameWeek: event.gameWeek,
      relatedEventId: event.id,
    });
  }

  if (event.type === 'SPONSORSHIP_PAYMENT_RECEIVED' || event.type === 'SPONSORSHIP_SIGNED') {
    const accountId = (p.accountId as string) || 'org_bank';
    return appendBankTransaction(transactions, {
      accountId,
      type: 'INCOME',
      category: 'Sponsorship',
      amount,
      description: event.description || event.title,
      timestamp: event.timestamp,
      gameWeek: event.gameWeek,
      relatedEventId: event.id,
    });
  }

  if (event.type === 'SALARY_PAID') {
    const accountId = (p.accountId as string) || 'personal_bank';
    const txType = accountId === 'org_bank' ? 'EXPENSE' : 'INCOME';
    return appendBankTransaction(transactions, {
      accountId,
      type: txType,
      category: 'Salary',
      amount,
      description: event.description || event.title,
      timestamp: event.timestamp,
      gameWeek: event.gameWeek,
      relatedEventId: event.id,
    });
  }

  if (event.type === 'VIDEO_REVENUE_RECEIVED') {
    return appendBankTransaction(transactions, {
      accountId: 'personal_bank',
      type: 'INCOME',
      category: 'Creator Revenue',
      amount,
      description: event.description || event.title,
      timestamp: event.timestamp,
      gameWeek: event.gameWeek,
      relatedEventId: event.id,
    });
  }

  if (event.type === 'PLAYER_SIGNED' && p.signingFeeUSD && typeof p.signingFeeUSD === 'number' && p.signingFeeUSD > 0) {
    return appendBankTransaction(transactions, {
      accountId: 'org_bank',
      type: 'EXPENSE',
      category: 'Signing Bonus',
      amount: Math.round(p.signingFeeUSD),
      description: `Signing fee for ${String(p.playerIgn ?? 'Player')}`,
      timestamp: event.timestamp,
      gameWeek: event.gameWeek,
      relatedEventId: event.id,
    });
  }

  return transactions;
}

export function transferPersonalAndOrgBank(
  state: GameState,
  direction: 'PERSONAL_TO_ORG' | 'ORG_TO_PERSONAL',
  amountUSD: number
): { nextState: GameState; error?: string } {
  const cleanAmount = Math.round(amountUSD);
  if (!state.org.founded) {
    return { nextState: state, error: 'You must establish an organisation first.' };
  }
  if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
    return { nextState: state, error: 'Enter a positive transfer amount.' };
  }

  if (direction === 'PERSONAL_TO_ORG') {
    if (state.finances.bankBalanceUSD < cleanAmount) {
      return { nextState: state, error: 'Insufficient Personal Bank balance.' };
    }
    const existingPhone = state.phoneState;
    const txList = existingPhone
      ? appendBankTransaction(
          appendBankTransaction(existingPhone.transactions, {
            accountId: 'personal_bank',
            type: 'TRANSFER',
            category: 'Capital Injection',
            amount: cleanAmount,
            description: `Transferred to ${state.org.name} treasury`,
            timestamp: Date.now(),
            gameWeek: state.week,
          }),
          {
            accountId: 'org_bank',
            type: 'INCOME',
            category: 'Owner Capital',
            amount: cleanAmount,
            description: `Owner capital transfer from personal bank`,
            timestamp: Date.now(),
            gameWeek: state.week,
          }
        )
      : [];

    return {
      nextState: {
        ...state,
        finances: {
          ...state.finances,
          bankBalanceUSD: state.finances.bankBalanceUSD - cleanAmount,
        },
        org: {
          ...state.org,
          bankBalanceUSD: state.org.bankBalanceUSD + cleanAmount,
        },
        phoneState: existingPhone
          ? {
              ...existingPhone,
              transactions: txList,
            }
          : undefined,
      },
    };
  }

  // ORG_TO_PERSONAL
  if (state.org.bankBalanceUSD < cleanAmount) {
    return { nextState: state, error: 'Insufficient Organisation Bank balance.' };
  }
  const existingPhone = state.phoneState;
  const txList = existingPhone
    ? appendBankTransaction(
        appendBankTransaction(existingPhone.transactions, {
          accountId: 'org_bank',
          type: 'TRANSFER',
          category: 'Owner Draw',
          amount: cleanAmount,
          description: `Owner distribution to personal account`,
          timestamp: Date.now(),
          gameWeek: state.week,
        }),
        {
          accountId: 'personal_bank',
          type: 'INCOME',
          category: 'Owner Draw',
          amount: cleanAmount,
          description: `Dividend draw from ${state.org.name}`,
          timestamp: Date.now(),
          gameWeek: state.week,
        }
      )
    : [];

  return {
    nextState: {
      ...state,
      finances: {
        ...state.finances,
        bankBalanceUSD: state.finances.bankBalanceUSD + cleanAmount,
      },
      org: {
        ...state.org,
        bankBalanceUSD: state.org.bankBalanceUSD - cleanAmount,
      },
      phoneState: existingPhone
        ? {
            ...existingPhone,
            transactions: txList,
          }
        : undefined,
    },
  };
}
