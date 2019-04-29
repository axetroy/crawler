export interface Message {
  type: "data" | "task" | "task:create" | "task:done" | "error";
  payload?: any;
}
