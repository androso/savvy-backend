import { Rating } from "ts-fsrs";
import supabase from "../database/db";

export const createQuizQuestion = async (
  question: string,
  options: string[],
  correct_option: string
): Promise<FlashcardQuizQuestion> => {
  const quizQuestion = {
    question,
    options,
    correct_option,
  };

  const { data, error } = await supabase
    .from("flashcard_content")
    .insert(quizQuestion)
    .select()
    .single();

  if (error) console.error(error);
  return data;
};

export function selectCard (scheduling_cards: any, grade: Rating) {
    for (const item of scheduling_cards) {
        if(item.log.rating === grade){
            return item;
        }
    }
  }

export function getRating(rate: string): Rating {
    switch (rate.toLowerCase()) {
        case 'again': 
            return Rating.Again
        case 'easy':
            return Rating.Easy;
        case 'good':
            return Rating.Good;
        case 'hard':
            return Rating.Hard;
        default:
            throw new Error(`Invalid rating: ${rate}`);
    }
}