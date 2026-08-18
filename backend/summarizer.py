from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from dotenv import load_dotenv
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from extract_video_id import extract_youtube_video_id
from vector_store import store_transcript, db
load_dotenv()

llm = ChatOpenAI(model = "gpt-4o-mini")
embedding = OpenAIEmbeddings(model = "text-embedding-3-large")

prompt = PromptTemplate(
    template= """You are an AI assistant that answers questions about a YouTube video.

    Use the provided video transcript and retrieved context as your primary source of information.
    Rules:
    1. Answer questions based on the video content.
    2. Do not invent information that is not supported by the video.
    3. If the answer is not available in the video, clearly say that you cannot find it in the video.
    4. Keep answers clear, accurate, and easy to understand.
    5. When appropriate, provide concise summaries, explanations, key points, and examples.
    6. Maintain the context of the conversation when answering follow-up questions.
    7. If the user asks something unrelated to the video, politely explain that you are designed primarily to discuss the processed video.
    8. If timestamps are available in the retrieved context, include them when they help the user locate the information.

    Your goal is to help the user understand and interact with the video content.

    context = {context},
    input = {input}
    """,
    input_variables= ["context", "input"]
)

def format_data(retrieved_docs):
    context_text = "\n\n".join([doc.page_content for doc in retrieved_docs])
    return context_text

def store_transcript_information(url:str, user_id: str):
    video_id = extract_youtube_video_id(url)
    status = store_transcript(video_id, user_id)
  
    return status

def talk_with_ai(user_input:str, user_id:str):

    retriever = db.as_retriever(search_type = "similarity", search_kwargs = {"k":5, "filter":{"user_id": user_id}})

    parallel_chain = RunnableParallel(
            {
                "context" : retriever | RunnableLambda(format_data),
                "input": RunnablePassthrough()
            }
    )
    parser = StrOutputParser()
    main_chain = parallel_chain | prompt | llm | parser
    response = main_chain.invoke(user_input)

    return response







