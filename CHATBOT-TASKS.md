# Chatbot Module — Task Tracker

**Owner:** nyeinchan-lwin
**Branch:** `feature/chatbot`

---

## Completed ✅

- [x] Set up Gemini API integration in server route (`app/api/chat/route.ts`)
- [x] Build chatbot UI — floating button, panel, message bubbles
- [x] Query engine with Supabase context (transactions, budgets, categories)
- [x] Chat data hooks (`hooks/useChat.ts`)
- [x] Chat UI components (ChatHeader, ChatInput, ChatMessages, ChatPanel)
- [x] Rate limiting (5/hour, 20/day)
- [x] Usage tracking (`chat_usage` table)
- [x] Optimistic message updates
- [x] Error handling with user feedback
- [x] Clear chat with confirmation dialog
- [x] Accessibility (ARIA labels, roles)
- [x] Skeleton loading states
- [x] Input validation (Zod, maxLength)
- [x] Security (auth checks, no data leaks)
- [x] Production comments (JSDoc)

---

## Pending (Week 2)

- [ ] Advanced insights — trend analysis
- [ ] Cross-module correlations (finance × fitness × tasks)
- [ ] Export chat history as JSON/CSV
- [ ] End-to-end flow test
- [ ] Context-window optimization

---

## Dependencies

| Waiting On | Owner | Status |
|---|---|---|
| Finance module data | shirleyshyun-lgtm | ✅ Done |
| Workout module data | aungkyawminhtet | ❌ Table missing |
| Task module data | team | ❌ Table missing |
| Reminder module data | team | ❌ Table missing |

---

## Notes

- Uses Gemini 2.0 Flash (not Claude)
- API key: `GEMINI_API_KEY` (server-side only)
- RLS ensures each user only sees their own data
- Rate limits protect against API abuse
