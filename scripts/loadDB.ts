import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAi from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "dotenv/config";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAi({
    apiKey: OPENAI_API_KEY,
})


type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const f1_data = [
    'https://en.wikipedia.org/wiki/Formula_One',
    'https://www.skysports.com/f1/news/12433/13117256/lewis-hamilton-says-he-is-at-peace-as-he-prepares-for-his-first-race-for-ferrari',
    'https://www.formula1.com/en/latest/all',
    'https://www.forbes.com/sites/brettknight/2023/11/29/formula-1s-highest-paid-drivers-2023/',
    'https://www.autosport.com/f1/news/history-of-female-f1-drivers-including-susie-wolff-and-maria-teresa-de-filippis/10584871/',
    'https://en.wikipedia.org/wiki/2023_Formula_One_World_Championship',
    'https://en.wikipedia.org/wiki/2022_Formula_One_World_Championship',
    'https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions',
    'https://en.wikipedia.org/wiki/2024_Formula_One_World_Championship',
    'https://www.formula1.com/en/results.html/2024/races.html',
    'https://www.formula1.com/en/racing/2024.html',
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT!);

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100,
});

const createCollection = async (similarity: SimilarityMetric = 'dot_product') => {
    try {
        await db.createCollection(ASTRA_DB_COLLECTION!, {
            vector: {
                dimension: 1536,
                metric: similarity
            }
        });
    } catch (e: any) {
        if (!e?.message?.includes('already exists')) throw e;
        console.log(`Collection "${ASTRA_DB_COLLECTION}" already exists, skipping creation.`);
    }
}

const loadSampleData = async() => {
    const collection  = await db.collection(ASTRA_DB_COLLECTION!);
    for await (const url of f1_data) {
        const content =await scrapePage(url);
        const chunks = await splitter.splitText(content);

        for await(const chunk of chunks){
            const embeddings = await openai.embeddings.create({
                model:"text-embedding-3-small",
                input:chunk,
                encoding_format:"float"
            })

            const vector = embeddings.data[0].embedding;

            const res = await collection.insertOne({
                $vector:vector,
                text:chunk
            });
            console.log(res);
        }
    }
        
}


const scrapePage = async (url:string) => {
    const loader = new PuppeteerWebBaseLoader(url,{
        launchOptions:{
            headless:true,
        },
        gotoOptions:{
            waitUntil:"domcontentloaded",
        },
        evaluate:async(page,browser)=>{
            const result = await page.evaluate(()=>document.body.innerHTML)
            await browser.close();
            return result;
        }
    });
    
    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '') || '';
}

createCollection().then(()=>loadSampleData())