import OpenAi from "openai";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openaiClient = new OpenAi({
  apiKey: OPENAI_API_KEY,
});


const astraClient = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = astraClient.db(ASTRA_DB_API_ENDPOINT!);

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const lastMsg = messages[messages.length - 1];
    const latestMessage = lastMsg.content ?? lastMsg.parts?.find((p: any) => p.type === "text")?.text ?? "";
    let docContext = "";

    const embedding = await openaiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float",
    });

    try {
      const collection = db.collection(ASTRA_DB_COLLECTION!);
      const cursor = collection.find(
        {},
        {
          sort: {
            $vector: embedding.data[0].embedding,
          },
          limit: 10,
        },
      );

      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc: any) => doc.text);
      docContext = JSON.stringify(docsMap);
    } catch (error) {
      console.error("Error in POST /api/chat:", error);
      docContext = "";
      return new Response("Internal Server Error", { status: 500 });
    }

    const template = {
      role: "system",
      content: `You are an AI assistant who knows everything about Formula 1.
                Use the below context to augment what you know about Formula 1.
                The context will provide you with the most recent page data from the official F1 website and others.
                If the context doesn't include the information you need, answer based on your existing knowledge and don't mention the source of your information or what the context does or doesn't include.
                Format responses using markdown where applicable and don't return images.
                ----------------
                START CONTEXT
                ${docContext}
                END CONTEXT
                ----------------
                QUESTION  :${latestMessage}
                -----------
                `,
    };

    const normalizedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content ?? msg.parts?.find((p: any) => p.type === "text")?.text ?? "",
    }));

    const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: [template, ...normalizedMessages],
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
