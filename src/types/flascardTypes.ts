interface FlashcardQuizQuestion {
    flashcard_content_id: string
    question: string
    options: string[]
    correct_option: string
  }
  
  interface Flashcard {
    flashcard_id: string
    topic_id?: string
    created_at: Date
    flashcard_content_id: string  // References FlashcardQuizQuestion type_id
    next_review: Date
    stability: number
    difficulty: number
    elapsed_days: number
    scheduled_days: number
    reps: number
    lapses: number
    state: number
    last_review: Date

  }