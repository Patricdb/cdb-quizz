import type { Question } from '../types';

export interface GenerateQuizResponse {
  ok: boolean;
  slug: string;
  questions: Question[];
}

export interface HistoryEntry {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface FinishQuizPayload {
  slug: string;
  score?: number;
  app_mode?: string;
  questions: Question[];
  history: HistoryEntry[];
}

export interface FinishQuizResponse {
  ok: boolean;
  intento_id?: number;
}

const baseRestUrl = (window as any).cdbQuizzSettings?.restUrl ?? '/wp-json/';

export async function generateQuiz(slug: string): Promise<GenerateQuizResponse> {
  const response = await fetch(`${baseRestUrl}cdb-quizz/v1/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ slug })
  });

  if (!response.ok) {
    throw new Error('Failed to generate quiz');
  }

  const data = await response.json();
  return data as GenerateQuizResponse;
}

export async function finishQuiz(payload: FinishQuizPayload): Promise<FinishQuizResponse> {
  const response = await fetch(`${baseRestUrl}cdb-quizz/v1/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Failed to finish quiz');
  }

  const data = await response.json();
  return data as FinishQuizResponse;
}
