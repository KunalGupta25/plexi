import os
import io
import mimetypes
import streamlit as st
import requests
import PyPDF2
from dotenv import load_dotenv

load_dotenv()

# GitHub repo that hosts study materials via Releases + manifest.json
# Format: "owner/repo"
MATERIALS_REPO = os.getenv("MATERIALS_REPO", "KunalGupta25/plexi-materials")
MANIFEST_BRANCH = "main"


def _manifest_url():
    """Raw GitHub URL for manifest.json."""
    return f"https://raw.githubusercontent.com/{MATERIALS_REPO}/{MANIFEST_BRANCH}/manifest.json"


@st.cache_data(ttl=300, show_spinner=False)
def get_manifest():
    """Fetch the materials manifest from GitHub. Cached for 5 minutes."""
    url = _manifest_url()
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    return resp.json()


def download_github_file(download_url, max_retries=3):
    """Download a file from a GitHub Release asset URL with retry logic."""
    for attempt in range(max_retries):
        try:
            resp = requests.get(download_url, timeout=60)
            resp.raise_for_status()
            return resp.content
        except requests.RequestException as e:
            print(f"Download error (attempt {attempt + 1}): {e}")
            if attempt == max_retries - 1:
                raise
    return None


def get_mime_type(filename):
    """Guess MIME type from filename extension."""
    mime, _ = mimetypes.guess_type(filename)
    return mime or "application/octet-stream"


def render_sidebar():
    """Render the shared sidebar with branding and links."""
    with st.sidebar:
        st.markdown("---")
        st.caption("Built by **Kunal Gupta** (LazyHuman)")
        cols = st.columns(3)
        with cols[0]:
            st.link_button("Web", "https://lazyhideout.tech", help="Portfolio")
        with cols[1]:
            st.link_button("GitHub", "https://github.com/kunalgupta25", help="GitHub")
        with cols[2]:
            st.link_button("Ko-fi", "https://ko-fi.com/lazy_human", help="Ko-fi")


def read_pdf_text(pdf_bytes):
    """Extract text from PDF bytes with error handling."""
    text = []
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            try:
                page_text = page.extract_text()
                if page_text:
                    filtered = page_text.encode("utf-16", "surrogatepass").decode("utf-16", "ignore")
                    text.append(filtered)
            except Exception:
                pass
        return "\n".join(text)
    except Exception:
        return pdf_bytes.decode("utf-8", errors="ignore") if pdf_bytes else ""


def load_subject_context(manifest, semester, subject):
    """Download and extract text from all files for a given semester + subject.

    Returns (context_string, source_list) where:
    - context_string: numbered source blocks for the system prompt
    - source_list: list of dicts with 'id', 'name', 'type' for citation display
    """
    subject_data = manifest.get(semester, {}).get(subject, {})
    parts = []
    sources = []
    source_id = 0

    for file_type, file_list in subject_data.items():
        for file_entry in file_list:
            name = file_entry["name"]
            mime = get_mime_type(name)

            if not (mime.startswith("text/") or mime == "application/pdf"):
                continue

            try:
                content = download_github_file(file_entry["download_url"])
                if not content:
                    continue

                if mime == "application/pdf":
                    text = read_pdf_text(content)
                else:
                    text = content.decode("utf-8", errors="ignore")

                if text.strip():
                    source_id += 1
                    sources.append({"id": source_id, "name": name, "type": file_type})
                    parts.append(
                        f"[Source {source_id}: {name} ({file_type})]\n{text}\n[End Source {source_id}]"
                    )
            except Exception as e:
                print(f"Error loading {name}: {e}")

    return "\n\n".join(parts), sources
