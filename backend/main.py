from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from summarizer import store_transcript_information, talk_with_ai
from vector_store import delete_history

class Get_url(BaseModel):
    url : str
    user_id : str

class Get_input(BaseModel):
    input: str
    user_id: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message":"Chat with youtube transcript"}


# PROCESS YOUTUBE VIDEO
@app.post("/youtube_url")
def get_youtube_transcript(video_url: Get_url):

    url = video_url.url
    user_id = video_url.user_id
    status = store_transcript_information(url, user_id)

    return JSONResponse(status_code=200, content={"status": status, "user_id": user_id})

# CHAT WITH AI
@app.post("/ask")
def chat(question: Get_input ):

    query = question.input
    user_id = question.user_id

    response = talk_with_ai(query, user_id)
    return {"response": response}

#DELETE THE HISTORY
@app.post("/cleanup")
def cleanup(user_id: str = Form(...)):

    status = delete_history(user_id)

    return {
        "status": status
    }



