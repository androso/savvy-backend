import { Request, Response } from "express";
import supabase from "../database/db";
export { selectCard, getRating } from "../helpers/flashcardsHelpers";

import {
  Card,
  CardInput,
  createEmptyCard,
  FSRS,
  fsrs,
  generatorParameters,
  Rating,
} from "ts-fsrs";
import {
  getRating,
  selectCard,
  createQuizQuestion,
} from "../helpers/flashcardsHelpers";

export const getAllFlashcards = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(400).json({ error: "Unauthorized" });
    }
    const { data: courses, error: courseError } = await supabase
      .from("courses")
      .select("course_id")
      .eq("user_id", user_id);

    if (courseError) {
      res.status(500).json({ error: courseError.message });
      return;
    }

    if (!courses || courses.length === 0) {
      res.status(404).json({ error: "No courses found for this user" });
      return;
    }

    const courseIds = courses.map((course) => course.course_id);

    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("topic_id")
      .eq("course_id", courseIds);

    if (topicsError) {
      res.status(500).json({ error: topicsError.message });
      return;
    }

    if (!topics || topics.length === 0) {
      res.status(404).json({ message: "No topics found for the user." });
      return;
    }

    const topicIds = topics.map((topic) => topic.topic_id);
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("*")
      .in("topic_id", topicIds);

    if (flashcardsError) {
      res.status(500).json({ error: flashcardsError.message });
      return;
    }

    res.status(200).json({ flashcards });
  } catch (error) {
    res.status(500).json({ error: "An unexpected error occurred." });
  }
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
    // const nextReviewDate = schedulingCards[Rating.Again].log.due;
    const rate = "Again";
    const selectedCard = selectCard(schedulingCards, Rating[rate]);

    // Then create the flashcard using the quiz question's type_id
    const now = new Date();
    const flashcard: Partial<Flashcard> = {
      topic_id: topicId,
      flashcard_content_id: quizQuestion.flashcard_content_id,
      next_review: selectedCard.card.due,
      stability: selectedCard.card.stability,
      difficulty: selectedCard.card.difficulty,
      elapsed_days: selectedCard.card.elapsed_days,
      scheduled_days: selectedCard.card.scheduled_days,
      reps: selectedCard.card.reps,
      lapses: selectedCard.card.lapses,
      state: selectedCard.card.state,
      last_review: now,
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
      next_review,
      last_review,
      flashcard_content_id,
      flashcard_content (
        question,
        options,
        correct_option
      )
    `
      )
      .eq("topic_id", topicId)
      .lte("next_review", new Date().toISOString());

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

export const updateFlashcardReview = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { flashcardId, rate } = req.body;

    console.log("Request Body:", req.body);
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
    const card: CardInput = {
      state: flashcard.state,
      due: new Date(flashcard.next_review),
      stability: flashcard.stability,
      difficulty: flashcard.difficulty,
      elapsed_days: flashcard.elapsed_days,
      scheduled_days: flashcard.scheduled_days,
      reps: flashcard.reps,
      lapses: flashcard.lapses,
      last_review: new Date(),
    };
    console.log("Card Object:", card); // Log for debugging
    const params = generatorParameters({ maximum_interval: 1000 });
    const f: FSRS = fsrs(params);
    const schedulingCards = f.repeat(card, new Date());

    const updateCard = selectCard(schedulingCards, getRating(rate));
    console.log("this your card?", updateCard);

    // Update the flashcard with the new review date
    const { data: updatedFlashcard, error: updateError } = await supabase
      .from("flashcards")
      .update({
        next_review: updateCard.card.due,
        stability: updateCard.card.stability,
        difficulty: updateCard.card.difficulty,
        elapsed_days: updateCard.card.elapsed_days,
        scheduled_days: updateCard.card.scheduled_days,
        reps: updateCard.card.reps,
        lapses: updateCard.card.lapses,
        state: updateCard.card.state,
        last_review: new Date(),
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
