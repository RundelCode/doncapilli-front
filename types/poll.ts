export type PollSummary = {
  id: string;
  title: string;
  createdAt: string;
  candidateCount: number;
  roundCount: number;
  hasOpenRound: boolean;
};

export type PollCandidate = { id: string; name: string };

export type RoundOption = {
  position: number; 
  candidateId: string;
  name: string;
  votes: number;
};

export type PollRound = {
  id: string;
  pollId: string;
  number: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
  options: RoundOption[];
  totalVotes: number;
};

export type PollDetail = {
  id: string;
  title: string;
  createdAt: string;
  candidates: PollCandidate[];
  rounds: PollRound[]; 
  totals: { candidateId: string; name: string; votes: number }[];
};

export type ActiveRoundPayload = {
  poll: { id: string; title: string } | null;
  round: PollRound | null;
};
