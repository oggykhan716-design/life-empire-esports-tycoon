import { getGameById } from '../../data/esportsTitles';
import { GameState } from '../../types/game';
import { ConversationMeta, Message } from '../../types/phone';
import { appendBankTransaction } from '../economy/bankEngine';
import { WorldEvent } from '../events/types';

const MAX_MESSAGES_PER_CONVERSATION = 100;

export function createInitialConversations(state: GameState): {
  conversations: ConversationMeta[];
  messages: Message[];
} {
  const isPlayer = state.careerType === 'PLAYER';
  const senderId = isPlayer ? 'agent_marcus' : 'advisor_elena';
  const senderName = isPlayer ? 'Marcus Vale (Esports Agent)' : 'Elena Vance (League Ops)';
  const senderRole = isPlayer ? 'Talent Representation' : 'Operations Advisor';
  const convId = `conv_${senderId}`;

  const introContent = isPlayer
    ? `Welcome to the circuit, ${state.playerCareer?.ign ?? state.character.firstName}. Keep grinding ranked & solo queue—scouts watch performance closely before sending tryout invites.`
    : `Welcome to Life Empire, ${state.character.firstName}. Watch your inbox for sponsor proposals, tournament invites, and player contract inquiries.`;

  return {
    conversations: [
      {
        id: convId,
        participantId: senderId,
        participantName: senderName,
        participantRole: senderRole,
        avatarColor: isPlayer ? '#8B5CF6' : '#2563EB',
        lastMessageAt: Date.now(),
      },
    ],
    messages: [
      {
        id: `msg_init_${senderId}`,
        conversationId: convId,
        senderId,
        senderName,
        senderRole,
        receiverId: 'user_self',
        content: introContent,
        timestamp: Date.now(),
        gameWeek: state.week,
        isRead: false,
      },
    ],
  };
}

export function addPrivateMessage(
  conversations: ConversationMeta[],
  messages: Message[],
  msg: Omit<Message, 'id'> & { id?: string; participantRole?: string; avatarColor?: string }
): { conversations: ConversationMeta[]; messages: Message[] } {
  if (msg.relatedEventId && messages.some((m) => m.relatedEventId === msg.relatedEventId && m.conversationId === msg.conversationId)) {
    return { conversations, messages };
  }

  const newMessage: Message = {
    id: msg.id ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderHandle: msg.senderHandle,
    senderRole: msg.senderRole,
    receiverId: msg.receiverId,
    content: msg.content,
    timestamp: msg.timestamp,
    gameWeek: msg.gameWeek,
    isRead: msg.isRead,
    relatedEventId: msg.relatedEventId,
    action: msg.action,
  };

  const existsConv = conversations.some((c) => c.id === msg.conversationId);
  const nextConversations = existsConv
    ? conversations.map((c) =>
        c.id === msg.conversationId ? { ...c, lastMessageAt: msg.timestamp } : c
      )
    : [
        {
          id: msg.conversationId,
          participantId: msg.senderId,
          participantName: msg.senderName,
          participantRole: msg.participantRole ?? msg.senderRole ?? 'Esports Contact',
          avatarColor: msg.avatarColor ?? '#3B82F6',
          lastMessageAt: msg.timestamp,
        },
        ...conversations,
      ];

  // Enforce 100-message cap per conversation
  const convMessages = [newMessage, ...messages.filter((m) => m.conversationId === msg.conversationId)].slice(
    0,
    MAX_MESSAGES_PER_CONVERSATION
  );
  const otherMessages = messages.filter((m) => m.conversationId !== msg.conversationId);

  return {
    conversations: [...nextConversations].sort((a, b) => b.lastMessageAt - a.lastMessageAt),
    messages: [...convMessages, ...otherMessages],
  };
}

export function applyEventToMessenger(
  conversations: ConversationMeta[],
  messages: Message[],
  event: WorldEvent,
  state: GameState
): { conversations: ConversationMeta[]; messages: Message[] } {
  const p = event.payload;
  const isOwnerPlayerActor = event.actorId === 'player_org' || event.actorId === 'user_player';
  if (!isOwnerPlayerActor) {
    return { conversations, messages };
  }

  if (event.type === 'TOURNAMENT_COMPLETED' && p.won !== false) {
    return addPrivateMessage(conversations, messages, {
      conversationId: 'conv_team_captain',
      senderId: 'team_captain',
      senderName: `${String(p.mvpIgn ?? 'Team')} · Squad Room`,
      senderRole: 'Roster Group Chat',
      avatarColor: '#10B981',
      receiverId: 'user_self',
      content: `Unreal tournament run in ${String(p.tournamentName ?? 'the event')}! Trophy secured (${String(p.scoreLine ?? '2-0')}). The entire roster is hyped.`,
      timestamp: event.timestamp,
      gameWeek: event.gameWeek,
      isRead: false,
      relatedEventId: event.id,
    });
  }

  if (event.type === 'PLAYER_SIGNED' && state.careerType !== 'PLAYER') {
    const playerIgn = String(p.playerIgn ?? 'New Signing');
    return addPrivateMessage(conversations, messages, {
      conversationId: `conv_plr_${playerIgn}`,
      senderId: `plr_${playerIgn}`,
      senderName: playerIgn,
      senderRole: 'Signed Player',
      avatarColor: '#6366F1',
      receiverId: 'user_self',
      content: `Appreciate the opportunity at ${state.org.name || 'the club'}. Ready to start scrims right away!`,
      timestamp: event.timestamp,
      gameWeek: event.gameWeek,
      isRead: false,
      relatedEventId: event.id,
    });
  }

  if (event.type === 'SPONSORSHIP_PAYMENT_RECEIVED' && state.org.founded) {
    return addPrivateMessage(conversations, messages, {
      conversationId: 'conv_advisor_elena',
      senderId: 'advisor_elena',
      senderName: 'Elena Vance (League Ops)',
      senderRole: 'Operations Advisor',
      avatarColor: '#2563EB',
      receiverId: 'user_self',
      content: `Weekly sponsor & commercial settlement completed cleanly (+$${Number(p.amountUSD ?? 0).toLocaleString()}).`,
      timestamp: event.timestamp,
      gameWeek: event.gameWeek,
      isRead: false,
      relatedEventId: event.id,
    });
  }

  return { conversations, messages };
}

export function markConversationAsRead(state: GameState, conversationId: string): GameState {
  if (!state.phoneState) return state;
  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      messages: state.phoneState.messages.map((m) =>
        m.conversationId === conversationId ? { ...m, isRead: true } : m
      ),
    },
  };
}

export function sendUserMessengerMessage(
  state: GameState,
  conversationId: string,
  text: string
): GameState {
  if (!state.phoneState || !text.trim()) return state;
  const conv = state.phoneState.conversations.find((c) => c.id === conversationId);
  if (!conv) return state;

  const myName =
    state.careerType === 'PLAYER' && state.playerCareer?.ign
      ? state.playerCareer.ign
      : `${state.character.firstName} ${state.character.lastName}`;

  const step1 = addPrivateMessage(state.phoneState.conversations, state.phoneState.messages, {
    conversationId,
    senderId: 'user_self',
    senderName: myName,
    receiverId: conv.participantId,
    content: text.trim().slice(0, 320),
    timestamp: Date.now(),
    gameWeek: state.week,
    isRead: true,
  });

  // Natural short acknowledgment reply from NPC
  const step2 = addPrivateMessage(step1.conversations, step1.messages, {
    conversationId,
    senderId: conv.participantId,
    senderName: conv.participantName,
    senderRole: conv.participantRole,
    receiverId: 'user_self',
    content: `Got your message, ${myName}. Keep an eye on upcoming weekly updates as decisions unfold.`,
    timestamp: Date.now() + 800,
    gameWeek: state.week,
    isRead: true,
  });

  return {
    ...state,
    phoneState: {
      ...state.phoneState,
      conversations: step2.conversations,
      messages: step2.messages,
    },
  };
}

export function resolveMessengerAction(
  state: GameState,
  messageId: string,
  decision: 'accept' | 'reject' | 'negotiate'
): { nextState: GameState; feedback: string } {
  if (!state.phoneState) return { nextState: state, feedback: 'Phone unavailable.' };
  const msg = state.phoneState.messages.find((m) => m.id === messageId);
  if (!msg || !msg.action || msg.action.status !== 'pending') {
    return { nextState: state, feedback: 'This offer has already been resolved.' };
  }

  const action = msg.action;
  let nextState = { ...state };
  let replyContent = '';
  let feedback = '';
  let resolvedStatus: 'accepted' | 'rejected' | 'negotiated' =
    decision === 'accept' ? 'accepted' : decision === 'reject' ? 'rejected' : 'negotiated';

  if (decision === 'reject') {
    replyContent = `Understood—we'll pass on this proposal for now. Let us know if things change.`;
    feedback = `Declined offer from ${msg.senderName}.`;
  } else if (decision === 'negotiate') {
    // Boost salary/payout by 15% and keep pending OR resolve with improved terms
    const boostedSalary = action.monthlySalaryUSD ? Math.round(action.monthlySalaryUSD * 1.15) : undefined;
    const boostedWeekly = action.weeklyPayoutUSD ? Math.round(action.weeklyPayoutUSD * 1.15) : undefined;
    const negSuccess = state.character.skills.negotiation >= 10 || Math.random() < 0.72;

    if (!negSuccess) {
      resolvedStatus = 'rejected';
      replyContent = `Those counter-terms are above our current budget. We're pulling the offer off the table.`;
      feedback = `${msg.senderName} walked away from negotiations.`;
    } else {
      // Update message action in place with better terms & keep pending so user can accept!
      const updatedMsgs = state.phoneState.messages.map((m) =>
        m.id === messageId && m.action
          ? {
              ...m,
              action: {
                ...m.action,
                monthlySalaryUSD: boostedSalary ?? m.action.monthlySalaryUSD,
                weeklyPayoutUSD: boostedWeekly ?? m.action.weeklyPayoutUSD,
              },
            }
          : m
      );
      const added = addPrivateMessage(state.phoneState.conversations, updatedMsgs, {
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        receiverId: 'user_self',
        content: boostedSalary
          ? `Deal! We've raised the offer to $${boostedSalary.toLocaleString()}/mo. Hit Accept on the offer card above to sign.`
          : `We can bump the weekly payout to $${(boostedWeekly ?? 500).toLocaleString()}/wk. Accept above when ready.`,
        timestamp: Date.now() + 300,
        gameWeek: state.week,
        isRead: true,
      });
      return {
        nextState: {
          ...state,
          phoneState: {
            ...state.phoneState,
            conversations: added.conversations,
            messages: added.messages,
          },
        },
        feedback: `Negotiated a 15% increase with ${msg.senderName}!`,
      };
    }
  } else {
    // ACCEPT
    if (action.kind === 'TRYOUT_INVITE' && nextState.playerCareer) {
      const pc = nextState.playerCareer;
      const tryoutScore =
        pc.attributes.skill * 0.45 +
        pc.attributes.consistency * 0.2 +
        pc.attributes.teamwork * 0.15 +
        pc.attributes.potential * 0.1 +
        pc.attributes.reputation * 0.1 +
        (Math.random() * 14 - 4);
      const passed = tryoutScore >= 52;
      if (passed) {
        const salary = action.monthlySalaryUSD ?? 1800;
        const duration = action.durationWeeks ?? 26;
        const game = getGameById(action.gameId ?? pc.primaryGameId);
        nextState = {
          ...nextState,
          playerCareer: {
            ...pc,
            currentOrgId: action.orgId ?? pc.currentOrgId,
            currentOrgName: action.orgName ?? msg.senderName,
            currentOrgTag: (action.orgName ?? 'ORG').slice(0, 3).toUpperCase(),
            isStarter: action.isStarterGuaranteed ?? true,
            monthlySalaryUSD: salary,
            contractWeeksLeft: duration,
            winBonusUSD: action.winBonusUSD ?? Math.round(salary * 0.12),
            attributes: {
              ...pc.attributes,
              reputation: Math.min(100, pc.attributes.reputation + 4),
              experience: Math.min(100, pc.attributes.experience + 3),
            },
          },
        };
        replyContent = `You crushed the ${game.name} tryout! Welcome to ${action.orgName ?? msg.senderName} on a $${salary.toLocaleString()}/mo contract.`;
        feedback = `Passed tryout and signed with ${action.orgName ?? msg.senderName}!`;
      } else {
        replyContent = `Thanks for scrimming with us, though we're going in another direction right now. Keep grinding!`;
        feedback = `Tryout at ${action.orgName ?? msg.senderName} did not result in a spot this time.`;
      }
    } else if (action.kind === 'CONTRACT_OFFER' && nextState.playerCareer) {
      const pc = nextState.playerCareer;
      const salary = action.monthlySalaryUSD ?? 2400;
      const signingBonus = action.signingBonusUSD ?? Math.round(salary * 0.5);
      nextState = {
        ...nextState,
        finances: {
          ...nextState.finances,
          bankBalanceUSD: nextState.finances.bankBalanceUSD + signingBonus,
          lifetimeEarnedUSD: nextState.finances.lifetimeEarnedUSD + signingBonus,
        },
        playerCareer: {
          ...pc,
          currentOrgId: action.orgId ?? 'rival_org',
          currentOrgName: action.orgName ?? msg.senderName,
          currentOrgTag: (action.orgName ?? 'ORG').slice(0, 3).toUpperCase(),
          isStarter: action.isStarterGuaranteed ?? true,
          monthlySalaryUSD: salary,
          contractWeeksLeft: action.durationWeeks ?? 32,
          winBonusUSD: action.winBonusUSD ?? Math.round(salary * 0.15),
          transferRequested: false,
          attributes: {
            ...pc.attributes,
            reputation: Math.min(100, pc.attributes.reputation + 5),
          },
        },
        phoneState: nextState.phoneState
          ? {
              ...nextState.phoneState,
              transactions: appendBankTransaction(nextState.phoneState.transactions, {
                accountId: 'personal_bank',
                type: 'INCOME',
                category: 'Contract Signing Bonus',
                amount: signingBonus,
                description: `Signing bonus from ${action.orgName ?? msg.senderName}`,
                timestamp: Date.now(),
                gameWeek: nextState.week,
              }),
            }
          : undefined,
      };
      replyContent = `Contract signed! Your $${signingBonus.toLocaleString()} signing bonus has been wired to your Personal Bank.`;
      feedback = `Signed contract with ${action.orgName ?? msg.senderName} ($${salary.toLocaleString()}/mo)!`;
    } else if (action.kind === 'SPONSOR_OFFER') {
      const weekly = action.weeklyPayoutUSD ?? 600;
      const bonus = action.signingBonusUSD ?? weekly * 2;
      if (nextState.careerType === 'PLAYER' && nextState.playerCareer) {
        nextState = {
          ...nextState,
          finances: {
            ...nextState.finances,
            bankBalanceUSD: nextState.finances.bankBalanceUSD + bonus,
            lifetimeEarnedUSD: nextState.finances.lifetimeEarnedUSD + bonus,
          },
          playerCareer: {
            ...nextState.playerCareer,
            personalSponsors: [
              ...nextState.playerCareer.personalSponsors,
              {
                id: `psp_${Date.now()}`,
                brandName: action.sponsorBrand ?? msg.senderName,
                weeklyPayoutUSD: weekly,
                weeksRemaining: action.durationWeeks ?? 10,
              },
            ],
          },
        };
      } else if (nextState.org.founded) {
        nextState = {
          ...nextState,
          org: {
            ...nextState.org,
            bankBalanceUSD: nextState.org.bankBalanceUSD + bonus,
            sponsors: [
              ...nextState.org.sponsors,
              {
                id: `sp_msg_${Date.now()}`,
                brandName: action.sponsorBrand ?? msg.senderName,
                industry: 'Esports Partner',
                type: 'Short-term',
                weeklyPayoutUSD: weekly,
                signingBonusUSD: bonus,
                weeksRemaining: action.durationWeeks ?? 12,
                minReputation: 0,
                winBonusUSD: 250,
                penaltyUSD: 1000,
              },
            ],
          },
        };
      }
      replyContent = `Partnership finalized! Signing bonus ($${bonus.toLocaleString()}) deposited.`;
      feedback = `Signed sponsor deal with ${action.sponsorBrand ?? msg.senderName}!`;
    } else {
      replyContent = `Confirmed—let's move forward!`;
      feedback = `Accepted proposal from ${msg.senderName}.`;
    }
  }

  const updatedMessages = (nextState.phoneState?.messages ?? []).map((m) =>
    m.id === messageId && m.action
      ? { ...m, isRead: true, action: { ...m.action, status: resolvedStatus } }
      : m
  );
  const withReply = addPrivateMessage(
    nextState.phoneState?.conversations ?? [],
    updatedMessages,
    {
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      receiverId: 'user_self',
      content: replyContent,
      timestamp: Date.now() + 400,
      gameWeek: nextState.week,
      isRead: true,
    }
  );

  return {
    nextState: {
      ...nextState,
      phoneState: nextState.phoneState
        ? {
            ...nextState.phoneState,
            conversations: withReply.conversations,
            messages: withReply.messages,
          }
        : undefined,
    },
    feedback,
  };
}
