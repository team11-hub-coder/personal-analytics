import type { Metadata } from "next";
import ChatClient from "./ChatClient";

export const metadata: Metadata = {
  title: "Chat | Personal Analytics",
  description: "Chat with your AI assistant for insights and help.",
};

export default function ChatPage() {
  return <ChatClient />;
}
