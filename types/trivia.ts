export type Trivia = {
  id: string;
  code: string;
  title: string;
  isActive: boolean;
};

export type Question = {
  id: string;
  index: number;
  statement: string;
  answers: { id: string; label: string; text: string; isCorrect?: boolean }[];
};

export type ActiveTriviaPayload = {
  trivia: Trivia | null;
  activeQuestionId?: string | null;
};

export type ActivateTriviaInput =
  | { code: string }
  | { triviaId: string };

export type SetActiveQuestionInput = {
  questionId: string;
};
