export interface ChatRow {
  id: string;
  row_type: "user" | "message" | "typing";
  user_id?: string;
  mobile?: string;
  message_text?: string;
  seen?: boolean;
  is_typing?: boolean;
}
