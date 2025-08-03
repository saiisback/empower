# 🎮  EMPOWER : Dynamic Educational Mini-Game Platform

This project is a web-based platform that uses AI to generate educational mini-games for children, with a special focus on adapting the games to the child's age and specific disability needs. The application is built with a React/Next.js frontend and a Python/FastAPI backend.

## ✨ Features

-   **On-the-Spot Game Generation**: Creates unique mini-games from scratch for any educational topic. No pre-built templates are used.
-   **AI-Powered**: Leverages LangChain and OpenAI's GPT-4o to design creative and engaging game mechanics, content, and code.
-   **Adaptive Learning**: Dynamically adjusts game complexity, visuals, and interactions based on the child's age and disability (e.g., visual impairment, ADHD, motor skill challenges).
-   **Interactive Frontend**: A clean, modern, and engaging user interface built with Next.js and Tailwind CSS.
-   **Robust Backend**: A powerful FastAPI server that orchestrates the AI-driven game generation process using LangGraph.

## 🛠️ Tech Stack

-   **Frontend**:
    -   React
    -   Next.js
    -   TypeScript
    -   Tailwind CSS
-   **Backend**:
    -   Python 3
    -   FastAPI
    -   LangGraph & LangChain
    -   OpenAI GPT-4o
    -   Uvicorn (for serving)

## 📂 Project Structure

```
.
├── backend/
│   ├── main.py         # FastAPI application, LangGraph workflow, and game generation logic
│   ├── .env            # Environment variables (contains OPENAI_API_KEY)
│   └── requirements.txt# Python dependencies
└── frontend/
    ├── app/
    │   └── page.tsx    # Main page component
    ├── components/
    │   └── GameComponent.tsx # The core React component for game interaction
    ├── package.json    # Node.js dependencies
    └── ...
```

## 🚀 Getting Started

### Prerequisites

-   Python 3.8+
-   Node.js and npm
-   An OpenAI API key

### 1. Backend Setup

First, set up and run the FastAPI server.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Create a .env file and add your OpenAI API key
echo "OPENAI_API_KEY='your_openai_api_key_here'" > .env

# 4. Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend server will now be running on `http://127.0.0.1:8000`.

### 2. Frontend Setup

Next, set up and run the Next.js frontend.

```bash
# 1. Navigate to the frontend directory
cd ../frontend

# 2. Install Node.js dependencies
npm install

# 3. Start the frontend development server
npm run dev
```

The frontend will now be running on `http://localhost:3000`. Open this URL in your browser to use the application.

## ⚙️ How It Works

1.  **User Input**: The user enters a topic they want to learn about on the frontend.
2.  **API Request**: The Next.js app sends a POST request to the backend's `/game` endpoint with the topic, age, and disability information.
3.  **AI Orchestration (LangGraph)**:
    -   The backend receives the request and triggers a LangGraph workflow.
    -   A detailed prompt is constructed, instructing the AI to design a complete, self-contained HTML mini-game.
    -   The prompt specifies requirements for accessibility, age-appropriateness, and game mechanics.
4.  **Dynamic Game Generation**:
    -   The OpenAI GPT-4o model generates a JSON object containing the game's title, instructions, and the full `htmlCode`.
    -   The backend code then injects this AI-generated data into a dynamic HTML structure with adaptive CSS.
5.  **Frontend Display**:
    -   The backend sends the complete game object back to the frontend.
    -   The React app displays the game's instructions and then renders the `htmlCode` within an `<iframe>` to create a sandboxed play area.

## 🔧 Customization

The core of the game generation logic is in the `generate_prompt_node` function inside `backend/main.py`. You can modify the prompt within this function to change the AI's behavior, such as:
-   Requesting different types of game mechanics.
-   Changing the visual style or tone.
-   Adding new rules for accessibility or learning goals.
