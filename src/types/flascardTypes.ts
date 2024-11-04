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
    review_date: Date
    next_review_date: Date
    rating?: number
    flashcard_content_id: string  // References FlashcardQuizQuestion type_id
  }