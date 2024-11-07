export interface Step {
  order: number;
  title: string;
}

export interface ListMessageResponse {
  type: "list";
  role: "assistant";
  content: {
    headerText: string;
    steps: Step[];
  }
}