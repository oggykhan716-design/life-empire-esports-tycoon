export type PhoneAppId =
  | 'messenger'
  | 'news'
  | 'bank'
  | 'stocks'
  | 'twitter'
  | 'instagram'
  | 'youtube';

export interface PhoneNotification {
  id: string;
  appId: PhoneAppId;
  title: string;
  message: string;
  timestamp: number;
  gameWeek: number;
  gameDay: number;
  isRead: boolean;
  relatedEventId?: string;
}

export type MessageActionKind =
  | 'TRYOUT_INVITE'
  | 'CONTRACT_OFFER'
  | 'SPONSOR_OFFER'
  | 'TRANSFER_INQUIRY'
  | 'TOURNAMENT_INVITE'
  | 'STAFF_APPLICATION';

export interface MessageActionPayload {
  kind: MessageActionKind;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiated';
  orgId?: string;
  orgName?: string;
  gameId?: string;
  role?: string;
  monthlySalaryUSD?: number;
  durationWeeks?: number;
  winBonusUSD?: number;
  signingBonusUSD?: number;
  isStarterGuaranteed?: boolean;
  sponsorBrand?: string;
  weeklyPayoutUSD?: number;
  playerId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderHandle?: string;
  senderRole?: string;
  receiverId: string;
  content: string;
  timestamp: number;
  gameWeek: number;
  isRead: boolean;
  relatedEventId?: string;
  action?: MessageActionPayload;
}

export interface ConversationMeta {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  avatarColor: string;
  lastMessageAt: number;
}
