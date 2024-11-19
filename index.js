require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const OpenAI = require('openai');

const app = express();
const port = 3002;

// Allow CORS from all origins (or specify origin if needed)
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Ensure required environment variables are set
if (!process.env.OPENAI_API_KEY || !process.env.FIREBASE_PROJECT_ID) {
  console.error("API keys or Firebase configurations are missing in the .env file.");
  process.exit(1);
} else {
  console.log("Environment variables loaded successfully.");
}

// Configure OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // Set timeout to 30 seconds
});

// Initialize Firebase Admin SDK for Firestore
try {
  console.log("Attempting to initialize Firebase...");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  console.log("Firebase initialized successfully.");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  process.exit(1);
}

const db = admin.firestore(); // Firestore reference

/**
 * Fetch all transcriptions from Firestore and concatenate them into a single context string.
 * @returns {Promise<string>} A string containing concatenated transcriptions.
 */
async function fetchTranscriptions() {
  try {
    const transcriptionsRef = db.collection('transcriptions');
    const snapshot = await transcriptionsRef.get();
    const transcriptions = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      transcriptions.push(data.transcription);
    });

    console.log(`Fetched ${transcriptions.length} transcriptions from Firestore.`);
    return transcriptions.join(' '); // Concatenate transcriptions into one context string
  } catch (error) {
    console.error("Error fetching transcriptions:", error);
    throw new Error("Could not fetch transcriptions.");
  }
}

/**
 * Endpoint to handle chatbot requests.
 * The chatbot uses the transcriptions as context to generate responses to user queries.
 */
app.post('/chat', async (req, res) => {
  console.log("Received a request to /chat.");
  const userQuery = req.body.query;

  if (!userQuery) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Fetch transcriptions to build context for the chatbot
    const context = await fetchTranscriptions();

    // Generate a response using OpenAI with the context
    console.log("Sending request to OpenAI API for response...");
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use GPT model for conversation
      messages: [
        { role: "system", content: "You are a helpful assistant that uses the provided transcription context to answer questions." },
        { role: "user", content: context },  // Provide context to the model
        { role: "user", content: userQuery }, // User's question
      ],
      max_tokens: 150, // Set response length as needed
      temperature: 0.7, // Adjust creativity level
    });

    const answer = chatCompletion.choices[0].message.content.trim();
    console.log(`User query: ${userQuery}`);
    console.log(`Assistant response: ${answer}`);

    res.json({ answer });
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    res.status(500).json({ error: "Error processing chatbot response." });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  console.log("Health check endpoint hit.");
  res.send('Chatbot server is running.');
});

// Start the server and listen on 0.0.0.0 to make it accessible externally
app.listen(port, '0.0.0.0', () => {
  console.log(`Chatbot server running at http://0.0.0.0:${port}`);
});
