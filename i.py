from langchain_groq import ChatGroq
from langchain_openrouter import ChatOpenRouter
from dotenv import load_dotenv
load_dotenv()

# llm = ChatGroq(model = "openai/gpt-oss-20b")
# response = llm.invoke("who is iron man?")
# print(response.content)


# llm = ChatOpenRouter(model = "dots-studio/dots-3-note-preview:free")
# response = llm.invoke("who is iron man?")
# print(response.content)


# from langchain_huggingface import HuggingFaceEmbeddings
# hf = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en")
# embedding = hf.embed_query("hi this is harrison")
# print(embedding)