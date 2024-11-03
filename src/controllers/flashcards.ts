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
        nex_revied_date: nextReviewDate,
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
