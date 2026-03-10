import streamlit as st
from streamlit_pdf_viewer import pdf_viewer

from utils import get_manifest, download_github_file, get_mime_type, render_sidebar


# Configure page
st.set_page_config(page_title="Study Materials Hub", layout="wide")


# ── Header ───────────────────────────────────────────────────────
st.title("Study Materials Hub")
st.caption("Browse, preview, and download study materials — organized by semester, subject, and type.")


def display_pdf(file_content):
    """Display PDF using streamlit-pdf-viewer"""
    pdf_viewer(file_content, width="100%", height=600)


def display_ppt(file_content, filename):
    """Show PPT download button (no inline preview)."""
    st.info("PPT files cannot be previewed inline — use the download button.")
    st.download_button(
        label="Download PPT",
        data=file_content,
        file_name=filename,
        mime="application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )


# Load manifest
try:
    manifest = get_manifest()
except Exception as e:
    st.error(f"Failed to load materials catalog: {e}")
    st.stop()

semester_names = sorted(manifest.keys()) if manifest else []

if not semester_names:
    st.info("No study materials available yet. Check back later!")
    st.stop()

# ── Filters on main page ─────────────────────────────────────────
filter_cols = st.columns(4, gap="medium")

with filter_cols[0]:
    selected_semester = st.selectbox("Semester", semester_names, key="hub_semester")

subjects = sorted(manifest[selected_semester].keys())
with filter_cols[1]:
    selected_subject = st.selectbox("Subject", subjects, key="hub_subject")

sem_data = manifest[selected_semester][selected_subject]
types = sorted(sem_data.keys())
with filter_cols[2]:
    selected_type = st.selectbox("Type", types, key="hub_type")

files_list = sem_data[selected_type]
file_names = [f["name"] for f in files_list]
with filter_cols[3]:
    selected_file_name = st.selectbox("File", file_names, key="hub_file") if file_names else None

selected_file_obj = next((f for f in files_list if f["name"] == selected_file_name), None) if selected_file_name else None

render_sidebar()

# ── Breadcrumb ───────────────────────────────────────────────────
st.markdown(
    f"**{selected_semester}** › {selected_subject} › {selected_type}"
    + (f" › `{selected_file_name}`" if selected_file_name else ""),
    unsafe_allow_html=False,
)
st.markdown("---")

# ── File Preview ─────────────────────────────────────────────────
if selected_file_obj:
    try:
        file_content = download_github_file(selected_file_obj["download_url"])
        file_mime = get_mime_type(selected_file_obj["name"])
    except Exception as e:
        st.error(f"Error loading file: {e}")
        st.stop()

    if not file_content:
        st.error("Failed to download file.")
        st.stop()

    # Info bar
    info_col, dl_col = st.columns([3, 1])
    with info_col:
        st.markdown(f"### {selected_file_obj['name']}")
    with dl_col:
        st.download_button(
            label="Download",
            data=file_content,
            file_name=selected_file_obj["name"],
            mime=file_mime,
            use_container_width=True,
            type="primary",
        )

    # Preview area
    if file_mime == "application/pdf":
        display_pdf(file_content)
    elif file_mime in [
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]:
        display_ppt(file_content, selected_file_obj["name"])
    else:
        st.info("Preview not available for this file type. Use the download button.")
else:
    st.info("No files found for this selection.")

