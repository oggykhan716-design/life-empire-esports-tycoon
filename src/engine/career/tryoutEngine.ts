import { getGameById } from '../../data/esportsTitles';
import { TryoutInvite } from '../../types/career';
import { GameState } from '../../types/game';
import { addPrivateMessage } from '../social/messengerEngine';

export function evaluatePlayerTryoutScore(state: GameState): number {
  const pc = state.playerCareer;
  if (!pc) return 0;
  const a = pc.attributes;
  return (
    a.skill * 0.42 +
    a.consistency * 0.18 +
    a.teamwork * 0.15 +
    a.potential * 0.12 +
    a.pressure * 0.08 +
    a.reputation * 0.05
  );
}

export function generateTryoutInvitesForPlayer(state: GameState): GameState {
  const pc = state.playerCareer;
  if (!pc || pc.retired || !state.phoneState) return state;

  // Limit active pending tryouts to 2
  const activePending = pc.tryouts.filter(
    (t) => t.status === 'pending' && t.expiresWeek >= state.week
  );
  if (activePending.length >= 2) return state;

  // Higher chance if free agent or requesting transfer
  const shouldInvite =
    !pc.currentOrgId
      ? state.week === 1 || Math.random() < 0.65
      : pc.transferRequested && Math.random() < 0.6;
  if (!shouldInvite) return state;

  const skill = pc.attributes.skill;
  const eligibleRivals = state.rivals.filter((r) => {
    if (r.status === 'Bankrupt' || r.id === pc.currentOrgId) return false;
    if (skill < 54) return r.strength <= 80;
    if (skill < 72) return r.strength <= 88;
    return true;
  });

  const pool =
    eligibleRivals.length > 0
      ? eligibleRivals
      : state.rivals.filter((r) => r.status === 'Active' && r.id !== pc.currentOrgId);
  if (pool.length === 0) return state;

  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (activePending.some((t) => t.orgId === picked.id)) return state;

  const game = getGameById(pc.primaryGameId);
  const isStarterGuaranteed = skill >= picked.strength - 16 || picked.strength < 80;
  const baseSalary = Math.round(
    (skill < 55 ? 650 : skill < 70 ? 1850 : skill < 84 ? 4800 : 11500) *
      (picked.reputation / 75)
  );

  const invite: TryoutInvite = {
    id: `try_${picked.id}_${state.week}`,
    orgId: picked.id,
    orgName: picked.name,
    orgTag: picked.tag,
    orgReputation: picked.reputation,
    gameId: pc.primaryGameId,
    role: pc.preferredRole,
    offeredSalaryUSD: baseSalary,
    contractWeeks: 26,
    isStarterGuaranteed,
    expiresWeek: state.week + 3,
    status: 'pending',
  };

  const convId = `conv_tryout_${picked.id}`;
  const msgRes = addPrivateMessage(state.phoneState.conversations, state.phoneState.messages, {
    conversationId: convId,
    senderId: `scouting_${picked.id}`,
    senderName: `${picked.name} Scouting`,
    senderRole: 'Head Scout',
    avatarColor: picked.color,
    receiverId: 'user_self',
    content: `Hey ${pc.ign}! We've been tracking your ${game.name} form. Would you attend a ${isStarterGuaranteed ? 'starting' : 'academy/sub'} tryout at ${picked.name} (~$${baseSalary.toLocaleString()}/mo)?`,
    timestamp: Date.now(),
    gameWeek: state.week,
    isRead: false,
    action: {
      kind: 'TRYOUT_INVITE',
      status: 'pending',
      orgId: picked.id,
      orgName: picked.name,
      gameId: pc.primaryGameId,
      role: pc.preferredRole,
      monthlySalaryUSD: baseSalary,
      durationWeeks: 26,
      isStarterGuaranteed,
    },
  });

  const notifications = [
    {
      id: `notif_try_${picked.id}_${state.week}`,
      appId: 'messenger' as const,
      title: `Tryout Invitation: ${picked.name}`,
      message: `${picked.name} invited you to try out for their ${game.name} roster.`,
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
      tryouts: [invite, ...pc.tryouts].slice(0, 12),
    },
    phoneState: {
      ...state.phoneState,
      conversations: msgRes.conversations,
      messages: msgRes.messages,
      notifications,
    },
  };
}

export function respondToTryoutInvite(
  state: GameState,
  tryoutId: string,
  accept: boolean
): { nextState: GameState; outcome: string } {
  const pc = state.playerCareer;
  if (!pc) return { nextState: state, outcome: 'Player career not active.' };
  const invite = pc.tryouts.find((t) => t.id === tryoutId);
  if (!invite || invite.status !== 'pending') {
    return { nextState: state, outcome: 'Tryout invitation unavailable.' };
  }

  if (!accept) {
    return {
      nextState: {
        ...state,
        playerCareer: {
          ...pc,
          tryouts: pc.tryouts.map((t) => (t.id === tryoutId ? { ...t, status: 'rejected' } : t)),
        },
      },
      outcome: `Declined tryout from ${invite.orgName}.`,
    };
  }

  const score = evaluatePlayerTryoutScore(state) + (Math.random() * 14 - 5);
  const threshold = Math.max(46, invite.orgReputation * 0.68);
  const passed = score >= threshold;

  if (!passed) {
    return {
      nextState: {
        ...state,
        playerCareer: {
          ...pc,
          attributes: {
            ...pc.attributes,
            experience: Math.min(100, pc.attributes.experience + 2),
          },
          tryouts: pc.tryouts.map((t) => (t.id === tryoutId ? { ...t, status: 'failed' } : t)),
        },
      },
      outcome: `Completed scrims at ${invite.orgName}, but they passed for now (+2 Experience).`,
    };
  }

  return {
    nextState: {
      ...state,
      playerCareer: {
        ...pc,
        currentOrgId: invite.orgId,
        currentOrgName: invite.orgName,
        currentOrgTag: invite.orgTag,
        isStarter: invite.isStarterGuaranteed,
        monthlySalaryUSD: invite.offeredSalaryUSD,
        contractWeeksLeft: invite.contractWeeks,
        winBonusUSD: Math.round(invite.offeredSalaryUSD * 0.14),
        tournamentBonusPct: 12,
        transferRequested: false,
        attributes: {
          ...pc.attributes,
          reputation: Math.min(100, pc.attributes.reputation + 5),
          experience: Math.min(100, pc.attributes.experience + 4),
        },
        tryouts: pc.tryouts.map((t) => (t.id === tryoutId ? { ...t, status: 'passed' } : t)),
      },
    },
    outcome: `Passed tryout and signed with ${invite.orgName} ($${invite.offeredSalaryUSD.toLocaleString()}/mo, ${invite.isStarterGuaranteed ? 'Starter' : 'Bench'})!`,
  };
}
