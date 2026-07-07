import { createClient } from "@/utils/supabase/server";

export interface ChatMessage {
  id: number;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function getChatHistory(
  userId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }

  return data.reverse();
}

export async function saveMessage(
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<ChatMessage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ user_id: userId, role, content })
    .select()
    .single();

  if (error) {
    console.error("Error saving message:", error);
    return null;
  }

  return data;
}

export async function clearChatHistory(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error clearing chat history:", error);
    return false;
  }

  return true;
}
