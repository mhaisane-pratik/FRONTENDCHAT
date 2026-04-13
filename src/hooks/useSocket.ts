import { supabase } from "../api/supabase";

export const useRealtime = (callback: (data: any) => void) => {
  supabase
    .channel("chat_app")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chat_app" },
      (payload) => callback(payload.new)
    )
    .subscribe();
};
