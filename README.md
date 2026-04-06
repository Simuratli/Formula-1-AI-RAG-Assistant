# F1 Race Intelligence — RAG Chatbot

An AI-powered Formula 1 chatbot built with **Next.js**, **OpenAI**, and **DataStax Astra DB**. It uses a Retrieval-Augmented Generation (RAG) pipeline to answer questions about Formula 1 with up-to-date context scraped from official F1 sources.

## How it works

1. User sends a message via the chat UI.
2. The message is converted into a vector embedding using OpenAI `text-embedding-3-small`.
3. The embedding is used to perform a vector similarity search against the Astra DB collection, retrieving the most relevant F1 document chunks.
4. The retrieved context is injected into a system prompt alongside the conversation history.
5. `gpt-4o-mini` generates a streamed response, returned to the client via the AI SDK's UI message stream protocol.

## Tech Stack

- **Next.js 15** — App Router, API Routes
- **AI SDK** (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`) — streaming chat
- **OpenAI** — embeddings + chat completions
- **DataStax Astra DB** — vector database
- **LangChain** — web scraping & text splitting (seed script)
- **Tailwind CSS** — UI styling

---