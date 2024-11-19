### Project Overview
This project is a server-side API built with Node.js that provides a chatbot service. It integrates OpenAI's GPT-3.5 model for generating intelligent and context-aware responses and uses Firebase Firestore to fetch transcription data for contextual conversation.

### Features
* **Chatbot Interaction:**
    * Accepts user queries via a POST request.
    * Uses OpenAI GPT-3.5 model to generate responses.
* **Firebase Integration:**
    * Firestore: Retrieves transcription data to build conversation context.
* **Retry Logic:**
    * Ensures reliable chatbot response generation with multiple retry attempts.
* **Health Check Endpoint:**
    * Provides a simple endpoint to verify server availability.
### Requirements
* **Node.js:** Version 18 or later.
* **npm:** Installed with Node.js.
* **Firebase Project:**
    * Service account JSON key.
    * Configured Firestore database.
* **OpenAI API Key:** Required for GPT-3.5 API access.
