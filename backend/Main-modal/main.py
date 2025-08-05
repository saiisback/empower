# Dynamic Mini-Game Generator for Kids Learning
import os
import json
import logging
import tempfile
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langgraph.graph import StateGraph, END
from langgraph.graph.state import CompiledStateGraph
from typing_extensions import TypedDict
from groq import Groq

# Load environment variables
load_dotenv()

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Dynamic Kids Learning Mini-Games", version="4.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # Allow your Next.js frontend origin
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class LearningRequest(BaseModel):
    age: int
    disability: str
    subject: str
    topic: str

class QuizRequest(BaseModel):
    age: int
    disability: str
    subject: str

class GameRequest(BaseModel):
    age: int
    disability: str
    subject: str
    topic: str

# State management for LangGraph
class AgentState(TypedDict):
    request_data: Dict[str, Any]
    prompt: str
    llm_response: str
    formatted_output: Dict[str, Any]


# LangGraph nodes for dynamic mini-game generation
def generate_prompt_node(state: AgentState) -> Dict[str, Any]:
    """Generates a prompt based on the request type."""
    data = state['request_data']
    task_type = data['type']
    
    prompt = "" # Initialize prompt
    
    if task_type == "game":
        prompt = f"""
        You are an expert game developer who specializes in creating fun, educational, and accessible web-based mini-games for children.

        Your task is to generate a complete, self-contained HTML file for a mini-game based on the user's request.

        **User Request:**
        - **Age:** {data['age']}
        - **Topic:** "{data['topic']}"
        - **Subject:** "{data['subject']}"
        - **Disability considerations:** "{data['disability']}"

        **Game Requirements:**
        1.  **Single HTML File:** The entire game (HTML, CSS, JavaScript) must be in one file. Do not use external libraries unless via a CDN link.
        2.  **Dynamic & Creative:** DO NOT use a fixed template. Create a unique game mechanic suitable for the topic. Examples of mechanics:
            - A **drag-and-drop** game to sort animals into habitats.
            - A **matching-pairs** game to link words to pictures.
            - A **"whack-a-mole"** style game to identify correct answers.
            - A **sequencing** game to order the steps of photosynthesis.
            - A simple **click-to-collect** game.
        3.  **Age-Appropriate:**
            - For ages 3-6: Use large clickable elements, bright colors, simple instructions, and focus on visual/auditory feedback.
            - For ages 7-10: Introduce slightly more complex rules, points, and text.
            - For ages 11+: Can include more complex logic, timers, and detailed explanations.
        4.  **Accessibility:**
            - If disability is 'visual', use high-contrast colors (e.g., black/white/yellow), large font sizes (minimum 24px), and ARIA labels.
            - If disability is 'motor', ensure all targets are large and easy to click or drag. Avoid fast-timed events.
            - If disability is 'adhd', use engaging visuals, clear goals, and frequent, positive feedback to maintain focus.
        5.  **Communication with Parent App:** The game runs in an iframe. The JavaScript inside the game MUST communicate events back to the parent application using `window.parent.postMessage`.
            - **Required Messages:**
              - When the score changes: `window.parent.postMessage({{ type: 'scoreUpdate', payload: {{ score: newScore }} }}, '*');`
              - When an achievement is unlocked: `window.parent.postMessage({{ type: 'achievement', payload: {{ title: 'Achievement Name' }} }}, '*');`
              - When the game is won/completed: `window.parent.postMessage({{ type: 'gameEnd', payload: {{ finalScore: score }} }}, '*');`
        6.  **Fun Factor:** The game must be visually appealing, with fun sound effects (optional, if you can find a way), animations, and positive reinforcement (e.g., "Great Job!", "Awesome!").

        **Output Format:**
        Return a single, clean JSON object. DO NOT add any text before or after the JSON.

        ```json
        {{
            "title": "A fun and engaging title for the game",
            "description": "A brief, one-sentence description of the game's goal.",
            "instructions": "Simple, step-by-step instructions on how to play.",
            "learningGoals": [
                "Identify the planets in the solar system.",
                "Learn the order of the planets from the sun."
            ],
            "achievements": [
                "First Correct Answer!",
                "Solar System Explorer",
                "Galaxy Champion"
            ],
            "htmlCode": ""
        }}
        ```

        Now, create the game based on the user's request.
        """
        
    elif task_type == "quiz":
        # This prompt is fine, no changes needed
        prompt = f"""
        Create 5 fun, interactive quiz questions about {data['subject']} for {data['age']}-year-old children.
        Return JSON array format:
        [
            {{"question": "Fun question with emojis 🎈", "options": ["Option A 🌟", "Option B 🎯", "Option C 🎨"], "correctAnswer": 0, "explanation": "Simple explanation"}}
        ]
        """
    else: # explain
        # This prompt is fine, no changes needed
        prompt = f"""
        Create a simple, engaging explanation about {data['topic']} for {data['age']}-year-old children.
        Return JSON format:
        {{"title": "✨ Title", "content": "Simple explanation with emojis", "funFact": "Cool fact!"}}
        """
    
    return {"prompt": prompt}

def call_llm_node(state: AgentState) -> Dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not found")
    
    llm = ChatOpenAI(api_key=api_key, model="gpt-4o", temperature=0.7, max_tokens=4000) # Increased max_tokens for full HTML
    response = llm.invoke(state['prompt'])
    return {"llm_response": response.content}

def format_output_node(state: AgentState) -> Dict[str, Any]:
    try:
        response_text = state['llm_response'].strip()
        
        # More robust JSON cleaning
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].strip()
        if '```' in response_text:
            response_text = response_text.split('```')[0].strip()

        start_idx = -1
        # Find the start of the JSON object or array
        for i, char in enumerate(response_text):
            if char in ['{', '[']:
                start_idx = i
                break
        
        if start_idx == -1:
             raise json.JSONDecodeError("No JSON object or array found in response.", response_text, 0)
        
        response_text = response_text[start_idx:]
        
        formatted_output = json.loads(response_text)
        logger.info("✨ Successfully parsed AI response!")
        return {"formatted_output": formatted_output}
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {e}")
        logger.error(f"Raw LLM Response Text:\n---\n{state['llm_response']}\n---")
        raise Exception("AI response format error - please try again. The response was not valid JSON.")

# Create workflow (no changes needed here)
workflow = StateGraph(AgentState)
workflow.add_node("generate_prompt", generate_prompt_node)
workflow.add_node("call_llm", call_llm_node)
workflow.add_node("format_output", format_output_node)
workflow.set_entry_point("generate_prompt")
workflow.add_edge("generate_prompt", "call_llm")
workflow.add_edge("call_llm", "format_output")
workflow.add_edge("format_output", END)
app_graph = workflow.compile()

# API endpoints
@app.post("/game")
async def generate_game(request: GameRequest):
    try:
        logger.info(f"🎮 Creating dynamic mini-game for topic: {request.topic}")
        inputs = {"request_data": {"type": "game", **request.dict()}}
        result = app_graph.invoke(inputs)
        
        output = result.get('formatted_output')
        if not isinstance(output, dict) or "htmlCode" not in output:
            raise HTTPException(status_code=500, detail="AI failed to generate valid game data with htmlCode.")
        
        logger.info(f"✨ Successfully generated custom mini-game titled: {output.get('title')}")
        return output
        
    except Exception as e:
        # Pass the specific error message to the frontend for better debugging
        logger.error(f"Error generating mini-game: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mini-game creation failed: {str(e)}")

# The /quiz and /explain endpoints are fine as they were, so no changes are needed for them.
@app.post("/quiz")
async def get_quiz(request: QuizRequest):
    try:
        logger.info(f"📝 Creating dynamic quiz for: {request.subject}")
        inputs = {"request_data": {"type": "quiz", **request.dict()}}
        result = app_graph.invoke(inputs)
        
        output = result.get('formatted_output')
        if not isinstance(output, list):
            raise HTTPException(status_code=500, detail="Invalid quiz data")
        
        logger.info(f"✅ Generated {len(output)} quiz questions!")
        return output
        
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail="Quiz creation failed")

@app.post("/explain")
async def explain_topic(request: LearningRequest):
    try:
        logger.info(f"📚 Creating explanation for: {request.topic}")
        inputs = {"request_data": {"type": "explain", **request.dict()}}
        result = app_graph.invoke(inputs)
        
        output = result.get('formatted_output')
        if not isinstance(output, dict):
            raise HTTPException(status_code=500, detail="Invalid explanation data")
        
        logger.info("💡 Generated dynamic explanation!")
        return output
        
    except Exception as e:
        logger.error(f"Error generating explanation: {str(e)}")
        raise HTTPException(status_code=500, detail="Explanation creation failed")


@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio using Groq's Whisper API
    """
    try:
        # Validate file type
        if not audio.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Create a temporary file to store the uploaded audio
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe using Groq Whisper
            with open(temp_file_path, 'rb') as audio_file:
                transcription = groq_client.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-large-v3-turbo",
                    prompt="This is speech from a child using an educational app. Please transcribe clearly.",
                    response_format="json",
                    language="en",
                    temperature=0.0,
                )
            
            # Clean up temporary file
            os.unlink(temp_file_path)
            
            logger.info(f"🎤 Audio transcribed successfully: {transcription.text}")
            return {"transcript": transcription.text}
            
        except Exception as groq_error:
            # Clean up temporary file on error
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            logger.error(f"Groq transcription error: {str(groq_error)}")
            raise HTTPException(status_code=500, detail="Transcription failed")
            
    except Exception as e:
        logger.error(f"Error in transcribe endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Audio processing failed")


@app.get("/")
def read_root():
    return {
        "message": "🎮 Dynamic Mini-Game Learning Hub is LIVE!",
        "version": "4.0.0",
        "features": [
            "🎯 True on-the-spot game generation via LLM",
            "🎨 Unique game mechanics for each topic",
            "🧠 Concept-based learning",
            "♿ Disability-aware adaptations",
            "🌟 No hardcoded templates"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "4.0.0", "type": "dynamic-mini-games"}