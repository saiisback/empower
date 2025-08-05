from fastapi import FastAPI, Query
from pydantic import BaseModel
from model import SimpleSLM
import os

MODEL_PATH = "slm_model_trained"
app = FastAPI()

# Load trained or default model
if os.path.exists(MODEL_PATH):
    slm = SimpleSLM.load(MODEL_PATH)
else:
    slm = SimpleSLM()

class TextGenRequest(BaseModel):
    prompt: str
    age: int
    disability: str

@app.post("/generate_text")
def generate_text(req: TextGenRequest):
    context = f"Prompt: {req.prompt} Age: {req.age} Disability: {req.disability}"
    result = slm.generate(context)
    return {"generated_text": result}
