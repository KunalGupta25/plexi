import streamlit as st
import requests

from utils import render_sidebar, get_manifest, load_subject_context

st.set_page_config(page_title="Plexi")

# ── Provider presets (OpenAI-compatible endpoints) ───────────────
PROVIDERS = {
    "Gemini (Google)": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "models": ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"],
        "key_help": "Get a key at [Google AI Studio](https://aistudio.google.com/app/apikey)",
    },
    "OpenAI": {
        "base_url": "https://api.openai.com/v1",
        "models": ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1-nano"],
        "key_help": "Get a key at [OpenAI Platform](https://platform.openai.com/api-keys)",
    },
    "Mistral": {
        "base_url": "https://api.mistral.ai/v1",
        "models": ["mistral-small-latest", "mistral-medium-latest", "mistral-large-latest", "open-mistral-nemo"],
        "key_help": "Get a key at [Mistral Console](https://console.mistral.ai/api-keys)",
    },
    "Groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it", "mixtral-8x7b-32768"],
        "key_help": "Get a key at [Groq Console](https://console.groq.com/keys)",
    },
    "OpenRouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "models": ["google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.3-70b-instruct:free", "mistralai/mistral-small-3.1-24b-instruct:free", "qwen/qwen3-8b:free"],
        "key_help": "Get a key at [OpenRouter](https://openrouter.ai/keys)",
    },
    "Custom (self-hosted)": {
        "base_url": "",
        "models": [],
        "key_help": "For Ollama, LM Studio, or any OpenAI-compatible server",
    },
}

PROVIDER_NAMES = list(PROVIDERS.keys())


def _is_configured():
    """Check if provider, model, and API key (if needed) are all set."""
    return (
        "cfg_provider" in st.session_state
        and st.session_state.get("cfg_model")
        and (
            st.session_state.get("cfg_provider") == "Custom (self-hosted)"
            or st.session_state.get("api_key")
        )
    )


# ══════════════════════════════════════════════════════════════════
# ONBOARDING — shown on main page when not yet configured
# ══════════════════════════════════════════════════════════════════
if not _is_configured():
    st.title("Plexi-Bot: Academic Assistant")
    st.markdown("#### Set up your LLM to get started")

    provider_name = st.selectbox("Provider", PROVIDER_NAMES, key="ob_provider")
    provider = PROVIDERS[provider_name]

    if provider_name == "Custom (self-hosted)":
        base_url = st.text_input(
            "Base URL",
            value="http://localhost:11434/v1",
            help="e.g. http://localhost:11434/v1 for Ollama, http://localhost:1234/v1 for LM Studio",
        )
        model_name = st.text_input(
            "Model",
            placeholder="e.g. llama3, mistral, phi3",
            help="Enter the model name exactly as your server expects it",
        )
    else:
        base_url = provider["base_url"]
        model_options = provider["models"] + ["Custom"]
        model_choice = st.selectbox("Model", model_options)
        if model_choice == "Custom":
            model_name = st.text_input(
                "Custom model ID",
                placeholder="Enter model identifier",
                help="Enter any model ID supported by this provider",
            )
        else:
            model_name = model_choice

    needs_key = provider_name != "Custom (self-hosted)"
    api_key = ""
    if needs_key:
        st.info(f"{provider['key_help']}")
        api_key = st.text_input(
            "API Key",
            type="password",
            placeholder="Paste your API key here",
            help="Your key is only used for this session and never stored.",
        )

    can_start = model_name and (not needs_key or api_key)
    if st.button("Start chatting →", type="primary", disabled=not can_start, use_container_width=True):
        st.session_state.cfg_provider = provider_name
        st.session_state.cfg_base_url = base_url
        st.session_state.cfg_model = model_name
        if api_key:
            st.session_state.api_key = api_key
        st.session_state.pop("messages", None)
        st.rerun()
    st.stop()

# ══════════════════════════════════════════════════════════════════
# CONFIGURED — resolve active settings
# ══════════════════════════════════════════════════════════════════
provider_name = st.session_state.cfg_provider
provider = PROVIDERS[provider_name]
base_url = st.session_state.cfg_base_url
model_name = st.session_state.cfg_model
api_key = st.session_state.get("api_key", "")
needs_key = provider_name != "Custom (self-hosted)"

st.title("Plexi-Bot: Academic Assistant")

# ── Step 2: Semester + Subject selection ─────────────────────────
try:
    manifest = get_manifest()
except Exception as e:
    st.error(f"Failed to load materials catalog: {e}")
    st.stop()

if not manifest:
    st.info("No study materials available yet.")
    st.stop()

semester_names = sorted(manifest.keys())

with st.sidebar:
    st.subheader("Study Scope")
    selected_semester = st.selectbox("Semester", semester_names, key="asst_semester")
    subjects = sorted(manifest[selected_semester].keys())
    selected_subject = st.selectbox("Subject", subjects, key="asst_subject")

# Build a cache key so we reload context only when scope changes
scope_key = f"{selected_semester}|{selected_subject}"

# ── Step 3: Load subject context (text from files) ──────────────
if st.session_state.get("_scope_key") != scope_key:
    st.session_state._scope_key = scope_key
    st.session_state.pop("messages", None)

@st.cache_data(show_spinner="Loading study materials…", ttl=300)
def _get_subject_context(semester, subject):
    return load_subject_context(manifest, semester, subject)

subject_text, source_list = _get_subject_context(selected_semester, selected_subject)

if not subject_text.strip():
    st.warning("No readable text found for this subject. Try a different one.")
    st.stop()

# Show loaded sources + LLM settings + branding in sidebar
with st.sidebar:
    st.markdown("---")
    st.subheader(f"{len(source_list)} source(s)")
    for src in source_list:
        st.caption(f"**[{src['id']}]** {src['name']} ({src['type']})")

    st.markdown("---")
    with st.expander("Change LLM Settings"):
        new_provider = st.selectbox(
            "Provider", PROVIDER_NAMES,
            index=PROVIDER_NAMES.index(provider_name),
            key="sb_provider",
        )
        new_prov = PROVIDERS[new_provider]

        if new_provider == "Custom (self-hosted)":
            new_base_url = st.text_input(
                "Base URL", value=base_url,
                key="sb_base_url",
            )
            new_model = st.text_input(
                "Model", value=model_name if provider_name == "Custom (self-hosted)" else "",
                key="sb_model_custom",
                placeholder="e.g. llama3, mistral, phi3",
            )
        else:
            new_base_url = new_prov["base_url"]
            sb_model_options = new_prov["models"] + ["Custom"]
            default_idx = sb_model_options.index(model_name) if model_name in sb_model_options else 0
            sb_model_choice = st.selectbox("Model", sb_model_options, index=default_idx, key="sb_model_select")
            if sb_model_choice == "Custom":
                new_model = st.text_input("Custom model ID", key="sb_model_id", placeholder="Enter model identifier")
            else:
                new_model = sb_model_choice

        new_needs_key = new_provider != "Custom (self-hosted)"
        new_key = api_key
        if new_needs_key:
            new_key = st.text_input("API Key", type="password", value=api_key, key="sb_api_key")

        changed = (
            new_provider != provider_name
            or new_base_url != base_url
            or new_model != model_name
            or new_key != api_key
        )
        if changed and new_model:
            if st.button("Apply changes", use_container_width=True, type="primary"):
                st.session_state.cfg_provider = new_provider
                st.session_state.cfg_base_url = new_base_url
                st.session_state.cfg_model = new_model
                if new_key:
                    st.session_state.api_key = new_key
                elif "api_key" in st.session_state:
                    del st.session_state.api_key
                st.session_state.pop("messages", None)
                st.rerun()

    if st.button("New Chat", use_container_width=True):
        st.session_state.pop("messages", None)
        st.rerun()

render_sidebar()

# ── Step 4: Chat completions via OpenAI-compatible API ───────────
# Build source index string for the prompt
_source_index = "\n".join(
    f"  [{s['id']}] {s['name']} ({s['type']})" for s in source_list
)

SYSTEM_PROMPT = (
    "Your name is Plexi. You are an academic assistant for Parul University CS students.\n\n"
    "## STRICT GROUNDING RULES\n"
    "You are a **source-grounded** assistant (like NotebookLM). You must:\n"
    "1. Answer ONLY using information found in the provided source materials below.\n"
    "2. CITE your sources using [Source N] notation after every claim, fact, or explanation.\n"
    "   Example: 'A binary tree has at most two children per node [Source 1].'\n"
    "3. If multiple sources support a point, cite all: [Source 1][Source 3].\n"
    "4. If the answer is NOT in the materials, say: 'This information is not covered in the loaded materials.'\n"
    "   Do NOT guess, infer from general knowledge, or make up information.\n"
    "5. When summarizing or explaining a topic, synthesize information across all relevant sources.\n"
    "6. Use clear structure: headings, bullet points, and bold key terms when helpful.\n\n"
    "## INTERACTION STYLE\n"
    "- If the user greets you, greet them back and briefly list what topics the sources cover.\n"
    "- If asked about your creator, say you were created by Kunal Gupta (LazyHuman).\n"
    "- Be concise but thorough. Prefer depth from the sources over brevity.\n"
    "- When a question is broad, break the answer into sub-topics with source references.\n"
    "- At the end of detailed answers, add a '**Sources used:**' footer listing which sources were referenced.\n\n"
    f"## SOURCE INDEX\n{_source_index}\n\n"
    "## SOURCE MATERIALS\n"
    f"{subject_text}\n"
    "## END OF MATERIALS"
)

def _send_message(endpoint_url, api_key, model, system_prompt, history, user_prompt):
    """Call any OpenAI-compatible chat completions endpoint."""
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_prompt})

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    resp = requests.post(
        f"{endpoint_url}/chat/completions",
        headers=headers,
        json={
            "model": model,
            "messages": messages,
            "temperature": 0.3,
        },
        timeout=120,
    )
    if resp.status_code == 429:
        detail = resp.json().get("error", {}).get("message", "Rate limit exceeded.")
        raise Exception(f"RATE_LIMITED: {detail}")
    if resp.status_code == 401:
        raise Exception("AUTH_ERROR: Invalid API key. Please check your key and try again.")
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]

# ── Step 5: Chat UI ──────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": f"Hi! I'm loaded with **{selected_subject}** ({selected_semester}) materials. Ask me anything!"}
    ]

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# Handle pending retry from a previous rate-limit failure
pending_prompt = st.session_state.pop("_pending_prompt", None)

if prompt := (pending_prompt or st.chat_input("Ask about your study materials")):
    if not pending_prompt:
        st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            past = [m for m in st.session_state.messages[1:-1]
                    if m["role"] in ("user", "assistant")]
            try:
                answer = _send_message(
                    base_url, api_key, model_name,
                    SYSTEM_PROMPT, past, prompt,
                )
            except Exception as e:
                err = str(e)
                if "RATE_LIMITED" in err:
                    st.session_state._pending_prompt = prompt
                    st.error(
                        "API rate limit reached — your message has been saved.\n\n"
                        "Wait a minute and press **Retry**."
                    )
                    if st.button("Retry"):
                        st.rerun()
                    st.stop()
                if "AUTH_ERROR" in err:
                    st.error(f"{err.split(': ', 1)[1]}")
                    del st.session_state.api_key
                    st.session_state.messages.pop()
                    st.stop()
                raise
            st.markdown(answer)
    st.session_state.messages.append({"role": "assistant", "content": answer})
