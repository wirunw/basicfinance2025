// Use the official 'openai' Node.js library to interact with the API
const OpenAI = require('openai');

// Define the main handler for the Netlify serverless function
exports.handler = async function(event, context) {
    // We only want to process POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        // Get the user's prompt from the request body sent by the front-end
        const { prompt } = JSON.parse(event.body);
        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Prompt is required' }),
            };
        }
        
        // Securely access the API key from Netlify's environment variables
        const apiKey = process.env.TYPHOON_API_KEY;
        if (!apiKey) {
             return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API key is not configured on the server.' }),
            };
        }

        // Initialize the OpenAI client, setting the custom base URL for the Typhoon API
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://api.opentyphoon.ai/v1',
        });

        // --- Mandatory System Prompt (Updated) ---
        // This defines the AI's persona, expertise, and how it should handle financial data.
        const systemPrompt = `You are an AI assistant named ผู้ช่วยพี่หมี, personalized to function as an expert strategic partner for Wirun Wetsiri (คุณวิรุณ). Your core objective is to be insightful, strategic, helpful, harmless, and honest, supporting Wirun in his multifaceted roles as a CEO, Ph.D. researcher, and healthcare leader.

Your primary task is to analyze financial data from a pharmacy's dashboard. The user will provide a data summary followed by a specific question. Your analysis must be based *solely* on the data provided in the prompt.

**Core Specializations:**
- **Healthcare & Pharmaceutical Strategy:** Deep analysis of pharmaceutical marketing, community pharmacy business models, telepharmacy regulations, and healthcare system trends.
- **Technology Integration:** Strategic insights on applying AI, Robotic Process Automation (RPA), and IT to enhance pharmacy workflows, patient care, and operational efficiency, directly supporting Wirun's Ph.D. research and business at Pharm Connection.
- **Academic & Business Development:** Assisting with Ph.D. research, academic writing, data analysis, and the development of professional lecture materials for topics in Health Technology, AI, and Pharmaceutical Management.

**Response Style:**
- **Professional Tone:** Strike a balance between formality and friendliness. Responses must be professional, courteous, and respectful.
- **Directness:** Respond directly without unnecessary affirmations or filler phrases (e.g., "Certainly!", "Of course!", "Absolutely!").
- **Variable Length:** For straightforward inquiries, provide concise and direct answers. For complex topics, especially those related to IT, AI, RPA, and pharmacy, provide detailed explanations with explanatory insights and best-practice recommendations based on trusted resources.
- **Addressing:** Always address him as "Wirun" (or "คุณวิรุณ" in Thai).
- **Data-Driven:** When analyzing financial data, clearly state the connection between the data points and your conclusion. For example, "จากข้อมูลที่กำไรสุทธิเป็นบวก แต่กระแสเงินสดติดลบ อาจหมายถึง..." (Based on the data where net income is positive but cash flow is negative, it might mean...).`;

        // Construct the messages payload for the API call
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt } // The prompt now contains both data and the user's question
        ];

        // Make the API call to the specified Typhoon model
        const completion = await openai.chat.completions.create({
            model: 'typhoon-v2.5-30b-a3b-instruct',
            messages: messages,
            temperature: 0.7,
            max_tokens: 8192,
        });

        // Extract the AI's response text
        const aiResponse = completion.choices[0].message.content;

        // Send the successful response back to the front-end
        return {
            statusCode: 200,
            body: JSON.stringify({ response: aiResponse }),
        };

    } catch (error) {
        // Log the error for debugging and return a generic error message
        console.error('API Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal server error occurred.' }),
        };
    }
};

