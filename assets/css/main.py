from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import json
import os

# FastAPI app initialize karna
app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API Configure karna
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

@app.get("/generate-quiz")
def generate_quiz(topic: str, difficulty: str):
    prompt = f"""
    Generate exactly 5 multiple-choice questions about '{topic}' at a '{difficulty}' difficulty level.
    Return ONLY a valid JSON array of objects. Do not use markdown blocks like ```json. 
    Each object must have exactly these keys:
    "q": The question string.
    "opts": An array of exactly 4 option strings.
    "ans": The integer index (0 to 3) of the correct option.
    """
    
    try:
        response = model.generate_content(prompt)
        quiz_data = json.loads(response.text.strip())
        return {"status": "success", "data": quiz_data}
    
    except Exception as e:
        return {"status": "error", "message": "Failed to generate quiz.", "details": str(e)}