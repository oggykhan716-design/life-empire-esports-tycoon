import { ContractOffer } from '../../types/career';
import { GameState } from '../../types/game';
import { appendBankTransaction } from '../economy/bankEngine';
import { addPrivateMessage } from '../social/messengerEngine';

export function generateContractOffersForPlayer(state: GameState): GameState {
  const pc = state.playerCareer;
  if (!pc || pc.retired || !state.phoneState) return state;

  const activePending = pc.contractOffers.filter((c) => c.status === 'pending');
  if (activePending.length >= 2) return state;

  // Generate direct contract offers as skill/reputation rise or on transfer request
  const triggerChance = !pc.currentOrgId
    ? pc.attributes.reputation >= 20
      ? 0.45
      : 0.25
    : pc.transferRequested || pc.contractWeeksLeft <= 4
    ? 0.55
    : 0.2;

  if (Math.random() > triggerChance) return state;

  const candidates = state.rivals.filter(
    (r) => r.status === 'Active' && r.id !== pc.currentOrgId
  );
  if (candidates.length === 0) return state;

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  if (activePending.some((c) => c.orgId === picked.id)) return state;

  const isBigOrg = picked.reputation >= 84;
  const isStarter = !isBigOrg || pc.attributes.skill >= 76;
  const salary = Math.round(
    (600 + pc.attributes.skill * 48 + pc.attributes.popularity * 18) *
      (isBigOrg ? 1.45 : 0.92) *
      (isStarter ? 1.0 : 0.85)
  );
  const signingBonus = Math.round(salary * 0.5);

  const offer: ContractOffer = {
    id: `c_offer_${picked.id}_${state.week}`,
    orgId: picked.id,
    orgName: picked.name,
    orgTag: picked.tag,
    gameId: pc.primaryGameId,
    role: pc.preferredRole,
    monthlySalaryUSD: salary,
    durationWeeks: isBigOrg ? 40 : 24,
    winBonusUSD: Math.round(salary * 0.15),
    tournamentBonusPct: isBigOrg ? 18 : 12,
    signingBonusUSD: signingBonus,
    isStarter,
    transferClauseUSD: Math.round(salary * 3),
    sponsorAllowanceUSD: Math.round(pc.attributes.popularity * 8),
    status: 'pending',
  };

  const msgRes = addPrivateMessage(state.phoneState.conversations, state.phoneState.messages, {
    conversationId: `conv_gm_${picked.id}`,
    senderId: `gm_${picked.id}`,
    senderName: `${picked.name} Front Office`,
    senderRole: 'General Manager',
    avatarColor: picked.color,
    receiverId: 'user_self',
    content: `${pc.ign}, we want to sign you directly as a ${isStarter ? 'guaranteed starter' : 'sixth-man/bench prospect'} for $${salary.toLocaleString()}/mo + $${signingBonus.toLocaleString()} signing bonus.`,
    timestamp: Date.now(),
    gameWeek: state.week,
    isRead: false,
    action: {
      kind: 'CONTRACT_OFFER',
      status: 'pending',
      orgId: picked.id,
      orgName: picked.name,
      gameId: pc.primaryGameId,
      role: pc.preferredRole,
      monthlySalaryUSD: salary,
      durationWeeks: offer.durationWeeks,
      signingBonusUSD: signingBonus,
      winBonusUSD: offer.winBonusUSD,
      isStarterGuaranteed: isStarter,
    },
  });

  const notifications = [
    {
      id: `notif_coffer_${picked.id}_${state.week}`,
      appId: 'messenger' as const,
      title: `Contract Offer from ${picked.name}`,
      message: `$${salary.toLocaleString()}/mo (${isStarter ? 'Starter' : 'Bench'}) + $${signingBonus.toLocaleString()} bonus.`,
      timestamp: Date.now(),
      gameWeek: state.week,
      gameDay: state.day ?? 1,
      isRead: false,
    },
    ...state.phoneState.notifications,
  ].slice(0, 60);

  return {
    ...state,
    playerCareer: {
      ...pc,
      contractOffers: [offer, ...pc.contractOffers].slice(0, 8),
    },
    phoneState: {
      ...state.phoneState,
      conversations: msgRes.conversations,
      messages: msgRes.messages,
      notifications,
    },
  };
}

export function resolvePlayerContractOffer(
  state: GameState,
  offerId: string,
  decision: 'accept' | 'reject' | 'negotiate'
): { nextState: GameState; outcome: string } {
  const pc = state.playerCareer;
  if (!pc) return { nextState: state, outcome: 'Player career inactive.' };
  const offer = pc.contractOffers.find((o) => o.id === offerId);
  if (!offer || offer.status !== 'pending') {
    return { nextState: state, outcome: 'Offer already closed.' };
  }

  if (decision === 'reject') {
    return {
      nextState: {
        ...state,
        playerCareer: {
          ...pc,
          contractOffers: pc.contractOffers.map((o) =>
            o.id === offerId ? { ...o, status: 'rejected' } : o
          ),
        },
      },
      outcome: `Rejected contract offer from ${offer.orgName}.`,
    };
  }

  if (decision === 'negotiate') {
    const negSuccess = state.character.skills.negotiation >= 10 || Math.random() < 0.7;
    if (!negSuccess) {
      return {
        nextState: {
          ...state,
          playerCareer: {
            ...pc,
            contractOffers: pc.contractOffers.map((o) =>
              o.id === offerId ? { ...o, status: 'rejected' } : o
            ),
          },
        },
        outcome: `${offer.orgName} declined your counter-offer and withdrew the contract.`,
      };
    }
    const newSalary = Math.round(offer.monthlySalaryUSD * 1.18);
    return {
      nextState: {
        ...state,
        playerCareer: {
          ...pc,
          contractOffers: pc.contractOffers.map((o) =>
            o.id === offerId ? { ...o, monthlySalaryUSD: newSalary } : o
          ),
        },
      },
      outcome: `Negotiated ${offer.orgName} up to $${newSalary.toLocaleString()}/mo! Accept whenever ready.`,
    };
  }

  // Accept
  let nextTransactions = state.phoneState?.transactions ?? [];
  if (state.phoneState) {
    nextTransactions = appendBankTransaction(nextTransactions, {
      accountId: 'personal_bank',
      type: 'INCOME',
      category: 'Contract Signing Bonus',
      amount: offer.signingBonusUSD,
      description: `Signing bonus from ${offer.orgName}`,
      timestamp: Date.now(),
      gameWeek: state.week,
    });
  }

  const nextState: GameState = {
    ...state,
    finances: {
      ...state.finances,
      bankBalanceUSD: state.finances.bankBalanceUSD + offer.signingBonusUSD,
      lifetimeEarnedUSD: state.finances.lifetimeEarnedUSD + offer.signingBonusUSD,
    },
    playerCareer: {
      ...pc,
      currentOrgId: offer.orgId,
      currentOrgName: offer.orgName,
      currentOrgTag: offer.orgTag,
      isStarter: offer.isStarter,
      monthlySalaryUSD: offer.monthlySalaryUSD,
      contractWeeksLeft: offer.durationWeeks,
      winBonusUSD: offer.winBonusUSD,
      tournamentBonusPct: offer.tournamentBonusPct,
      transferRequested: false,
      attributes: {
        ...pc.attributes,
        reputation: Math.min(100, pc.attributes.reputation + 5),
      },
      contractOffers: pc.contractOffers.map((o) =>
        o.id === offerId ? { ...o, status: 'accepted' } : o
      ),
    },
    phoneState: state.phoneState
      ? {
          ...state.phoneState,
          transactions: nextTransactions,
        }
      : undefined,
  };

  return {
    nextState,
    outcome: `Signed with ${offer.orgName} for $${offer.monthlySalaryUSD.toLocaleString()}/mo (+$${offer.signingBonusUSD.toLocaleString()} bonus)!`,
  };
}

export function negotiateSalaryIncrease(state: GameState): { nextState: GameState; outcome: string } {
  const pc = state.playerCareer;
  if (!pc || !pc.currentOrgId) {
    return { nextState: state, outcome: 'Sign with an organisation before requesting a raise.' };
  }
  const leverage = pc.attributes.skill * 0.5 + pc.avgRating * 20 + pc.attributes.popularity * 0.25;
  const approved = leverage >= 55 || Math.random() < 0.55;
  if (!approved) {
    return {
      nextState: {
        ...state,
        playerCareer: {
          ...pc,
          attributes: {
            ...pc.attributes,
            teamwork: Math.max(20, pc.attributes.teamwork - 2),
          },
        },
      },
      outcome: `${pc.currentOrgName} rejected your raise request for now—keep building match form.`,
    };
  }
  const nextSalary = Math.round(pc.monthlySalaryUSD * 1.2);
  return {
    nextState: {
      ...state,
      playerCareer: {
        ...pc,
        monthlySalaryUSD: nextSalary,
      },
    },
    outcome: `${pc.currentOrgName} approved a 20% raise to $${nextSalary.toLocaleString()}/mo!`,
  };
}
