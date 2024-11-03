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

export const createFlashCard = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    //content to make the flash card
    const { frontContent, backContent, topic_id } = req.body;
    //object card
    const card: Card = createEmptyCard();
    const params = generatorParameters({ maximum_interval: 1000 });
    const f: FSRS = fsrs(params);
    const rating: Rating = 1;
    const schedulingCards = f.repeat(card, new Date());
    //compue next review applying an algo
    const nextReviewDate = schedulingCards[1].log.due;

    const { data, error } = await supabase.from("flashcards").insert([
      {
        topic_id,
        front_content: frontContent,
        back_content: backContent,
        review_date: new Date(),
        next_review_date: nextReviewDate,
        rating: rating,
      },
    ]);

    if (error) {
      return res
        .status(500)
        .json({ message: "Error creating flash card", error });
    }
    data
      ? res.status(201).json({
          message: "Flash card created successfully",
          data: data[0],
        })
      : res.status(500).json({ message: "Error: data is null" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating flash card",
    });
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
export const reviewFlashCard = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { data: flashcards, error } = await supabase
      .from("flashcards")
      .select("*")
      .lt("next_review_date", new Date().toISOString());
    // Filtrar tarjetas cuya próxima revisión es hoy o antes
    if (error) {
      return res.status(404).json({
        message: "No flashcards found",
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
    const { flashcardId, rating }: { flashcardId: string; rating: number } =
      req.body;

    const { data: flashcard, error: flashcardError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("flashcard_id", flashcardId)
      .single();
    if (flashcardError || !flashcard) {
      return res.status(404).json({ message: "Flashcard not found" });
    }

    const card: Card = createEmptyCard();
    const params = generatorParameters({ maximum_interval: 1000 });
    const f: FSRS = fsrs(params);
    const schedulingCards: Card[] = f.repeat(card, new Date());
    const next_review = schedulingCards[rating]?.due;

    const { error: updateError } = await supabase
      .from("flashcards")
      .update({
        review_date: new Date(),
        next_review_date: next_review,
        rating: rating,
      })
      .eq("flashcard_id", flashcardId);
    if (updateError) {
      return res.status(400).json({ message: "Error updating flashcard" });
    }
    res.status(200).json({ message: "Flashcard updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating flashcard" });
  }
};
