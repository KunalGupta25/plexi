import streamlit as st
from llama_index.core import StorageContext, load_index_from_storage, Settings
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.huggingface import HuggingFaceEmbedding  # <-- Use HuggingFace for BGE
from llama_index.core.memory import ChatMemoryBuffer

st.set_page_config(page_title="Plexi", page_icon="🤖")
st.title("🤖 Plexi-Bot: Academic Assistant")

with st.sidebar:
    st.markdown("**About Me**")
    st.link_button(
        "Portfolio",
        "https://lazyhideout.tech",
        icon=":material/info:",
        use_container_width=True
    )
    st.link_button(
        "GitHub",
        "https://github.com/kunalgupta25",
        icon="🐙",
        use_container_width=True
    )
    st.link_button(
        "Ko-fi",
        "https://ko-fi.com/lazy_human",
        icon=":material/coffee:",
        use_container_width=True
    )

# Step 1: Prompt for Gemini API Key if not already in session_state
if "api_key" not in st.session_state:
    api_key = st.text_input(
        "Enter your Gemini API Key to start chatting:",
        type="password",
        help="Your API key is only used for this session and never stored."
    )
    if api_key:
        st.session_state.api_key = api_key
        st.rerun()
    else:
        st.warning("Please enter your Gemini API Key to use the chatbot. You can find it at [Google AI Studio](https://aistudio.google.com/app/apikey).")
        st.markdown("**Note: Your API key is only used for this session and is not stored.**")
        st.stop()

# Step 2: Use the API key from session_state (input field is now hidden)
api_key = st.session_state.api_key

# Step 3: Set up embedding and LLM
# --- USE BGE FOR EMBEDDINGS ---
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-large-en-v1.5")
Settings.embed_model = embed_model

@st.cache_resource(show_spinner=False)
def load_index():
    storage_context = StorageContext.from_defaults(persist_dir="index")
    return load_index_from_storage(storage_context)

with st.spinner("Loading knowledge base..."):
    index = load_index()

@st.cache_resource(show_spinner=False)
def init_chat_engine():
    llm = GoogleGenAI(
        model="gemini-1.5-flash",
        api_key=api_key
    )
    memory = ChatMemoryBuffer.from_defaults(token_limit=1500)
    return index.as_chat_engine(
        chat_mode="context",
        llm=llm,
        memory=memory,
        system_prompt=(
            "You're an academic assistant helping with Study. "
            "your name is plexi."
            "You have access to a knowledge base of study materials of many semesters so always ask if you are not sure which semester study materials to use. "
            "Use only information from provided documents. "
            "Be concise and accurate. If unsure, say 'I don't know'."
            "if user greets you, greet them back and ask how you can help them."
            "if user asks about your creator or developer, say you are created by Kunal Gupta or LazyHuman to help you with your studies."
        ),
        verbose=True
    )

chat_engine = init_chat_engine()

# Chat UI logic
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Ask me anything about your study materials!"}
    ]

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Ask about your study materials"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            response = chat_engine.chat(prompt)
            st.markdown(response.response)
    st.session_state.messages.append({"role": "assistant", "content": response.response})
