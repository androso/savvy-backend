import { Request, Response } from "express";
import supabase from "../database/db";

import {
  Card,
  createEmptyCard,
  FSRS,
  fsrs,
  generatorParameters,
  Rating,
} from "ts-fsrs";

// Create a quiz question
const createQuizQuestion = async (
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

export const createFlashcardWithQuestion = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { question, options, correct_option } = req.body;
    const topicId = req.params.topicId;
    // First create the quiz question
    const quizQuestion = await createQuizQuestion(
      question,
      options,
      correct_option
    );
    // Then create the flashcard with FSRS
    const card: Card = createEmptyCard();
    
    const params = generatorParameters({ maximum_interval: 1000 });
    const f: FSRS = fsrs(params);
    const schedulingCards = f.repeat(card, new Date());
    //compute next review applying an algo
    const nextReviewDate = schedulingCards[1].log.due;

    // Then create the flashcard using the quiz question's type_id
    const now = new Date();
    const flashcard: Partial<Flashcard> = {
      topic_id: topicId,
      flashcard_content_id: quizQuestion.flashcard_content_id,
      review_date: now,
      next_review_date: nextReviewDate,
    };

    const { data: createdFlashcard, error } = await supabase
      .from("flashcards")
      .insert(flashcard)
      .select()
      .single();

    if (error) {
      return res
        .status(500)
        .json({ message: "Error creating flash card", error });
    }
    // Return the created flashcard and quiz question
    createdFlashcard
      ? res.status(201).json({
          message: "Flash card created successfully",
          data: createdFlashcard,
          quizQuestion,
        })
      : res.status(500).json({ message: "Error: data is null" });
  } catch (error) {
    res.status(500).json({ message: "Error creating flashcard" });
  }
};

//get flashcard by next_time_review

/**
 * Reviews flashcards that are due for review.
 *
 * This function fetches flashcards from the "flashcards" table in the database
 * where the `next_review_date` is earlier than the current date and time.
 * If no flashcards are found, it responds with a 404 status and a message indicating
 * that no flashcards were found. If flashcards are found, it responds with a 200 status
 * and the list of flashcards. In case of an error during the fetch operation, it logs
 * the error and responds with a 500 status and an error message.
 */
export const getFlashcardsByTopicAndReviewDate = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { topicId } = req.params;

    // Check if the topic exists
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("topic_id")
      .eq("topic_id", topicId)
      .single();

    if (topicError || !topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // Get flashcards for the topic that are due for review today
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select(
        `
      flashcard_id,
      topic_id,
      created_at,
      review_date,
      next_review_date,
      flashcard_content_id,
      flashcard_content (
        question,
        options,
        correct_option
      )
    `
      )
      .eq("topic_id", topicId)
      .lte("next_review_date", new Date().toISOString());

    if (flashcardsError) {
      return res.status(404).json({
        message: "No flashcards found",
        error: flashcardsError,
      });
    }

    res.status(200).json(flashcards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching flashcards" });
  }
};

const calculateNextReviewDate = (card: Card, rating: number): Date => {
  const params = generatorParameters({ maximum_interval: 1000 });
  const f: FSRS = fsrs(params);

  // Use rating to get the correct scheduling card
  const schedulingCards = f.repeat(card, new Date(), (recordLog: any) => {
    recordLog.rating = rating;
    return recordLog;
  });
  console.log("Scheduling Cards:", schedulingCards); // Log for debugging
  return schedulingCards[1].log.due;
};

export const updateFlashcardReview = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { flashcardId, rating } = req.body;
    console.log("Request Body:", req.body); // Log for debugging

    // Validate rating
    if (rating < 1 || rating > 4) {
      return res.status(400).json({
        message: "Rating must be between 1 and 4",
      });
    }

    // Retrieve the existing flashcard
    const { data: flashcard, error: fetchError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("flashcard_id", flashcardId)
      .single();

    if (fetchError || !flashcard) {
      return res.status(404).json({
        message: "Flashcard not found",
        error: fetchError,
      });
    }

    // Create a Card object from the retrieved flashcard
    const card = createEmptyCard();
    console.log("Card Object:", card); // Log for debugging

    // Calculate the next review date using the rating
    const nextReviewDate = calculateNextReviewDate(card, rating);
    console.log("Next Review Date:", nextReviewDate); // Log for debugging

    // Update the flashcard with the new review date
    const { data: updatedFlashcard, error: updateError } = await supabase
      .from("flashcards")
      .update({
        review_date: new Date(),
        next_review_date: nextReviewDate,
      })
      .eq("flashcard_id", flashcardId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        message: "Error updating flashcard review",
        error: updateError,
      });
    }

    return res.status(200).json({
      message: "Flashcard review updated successfully",
      data: updatedFlashcard,
    });
  } catch (error) {
    console.error("Error updating flashcard review:", error);
    return res.status(500).json({
      message: "Error updating flashcard review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

