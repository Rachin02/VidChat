from youtube_transcript_api import YouTubeTranscriptApi
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_astradb import AstraDBVectorStore

from dotenv import load_dotenv
import os
load_dotenv()

embedding = OpenAIEmbeddings(model = "text-embedding-3-large")
token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")


db = AstraDBVectorStore(
        embedding = embedding,
        collection_name= "vidChat",
        api_endpoint=endpoint,
        token= token )

def store_transcript(video_id:str, user_id:str):

    yt_api = YouTubeTranscriptApi()
    transcript = yt_api.fetch(video_id, languages=["en"])
    text = "\n\n".join([sent.text for sent in transcript])

    text_splitter = RecursiveCharacterTextSplitter(chunk_size = 1000, chunk_overlap = 200)
    docs = text_splitter.create_documents([text])

    for doc in docs:
        doc.metadata["user_id"] = user_id

    db.add_documents(docs)

    return "Video is ready to chat."


def delete_history(user_id:str):
    try:
        deleted = db.delete_by_metadata_filter({"user_id":user_id})
        return f"deleted {deleted} documents for user {user_id}"
    except Exception as e:
       return str(e)




