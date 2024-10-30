require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const OpenAI = require('openai');

const app = express();
const port = 3002;

app.use(cors({ origin: 'http://localhost:8100' }));
app.use(express.json()); // Middleware to parse JSON requests

// Ensure required environment variables are set
if (!process.env.OPENAI_API_KEY || !process.env.FIREBASE_PROJECT_ID) {
  console.error("API keys or Firebase configurations are missing in the .env file.");
  process.exit(1);
}

// Configure OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,  // Set timeout to 30 seconds
});

// Initialize Firebase Admin SDK for Firestore
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();  // Firestore reference

// Function to gather transcriptions from Firestore
async function fetchTranscriptions() {
  const transcriptionsRef = db.collection('transcriptions');
  const snapshot = await transcriptionsRef.get();
  const transcriptions = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    transcriptions.push(data.transcription);
  });

  return transcriptions.join(' ');  // Concatenate transcriptions into one context string
}

// Endpoint to handle chatbot requests
app.post('/chat', async (req, res) => {
  const userQuery = req.body.query;

  if (!userQuery) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Fetch transcriptions to build context
    const context = await fetchTranscriptions();

    // Generate chatbot response using OpenAI with the transcriptions as context
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',  // Updated model
      messages: [
        { role: "system", content: "You are a helpful assistant that uses the provided transcription context to answer questions." },
        { role: "user", content: context },  // Provide context to the model
        { role: "user", content: userQuery }, // User's question
      ],
      max_tokens: 150,  // Set response length as needed
      temperature: 0.7,  // Adjust creativity level
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

app.listen(port, () => {
  console.log(`Chatbot server running at http://localhost:${port}`);
});
