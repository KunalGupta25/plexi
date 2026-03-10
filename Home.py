import streamlit as st

st.set_page_config(page_title="Plexi | Home", layout="centered")

# ── Hero Section ─────────────────────────────────────────────────
st.image("assets/logo.png", width=120)
st.title("Plexi")
st.caption("Your AI-powered study partner for Parul University")

st.markdown("---")

# ── Feature cards ────────────────────────────────────────────────
col1, col2 = st.columns(2, gap="large")

with col1:
    st.markdown(
        """
        ### Study Material Hub
        Browse, preview, and download study materials organized by
        **semester → subject → type**. PDFs open inline — no extra apps needed.
        """
    )
    st.link_button(
        "Open Material Hub →",
        "/Study_Material_Hub",
        use_container_width=True,
        type="primary",
    )

with col2:
    st.markdown(
        """
        ### Plexi Assistant
        Chat with an AI that **only uses your study materials** as context —
        like NotebookLM. Pick any LLM provider (Gemini, GPT, Mistral, Groq…).
        """
    )
    st.link_button(
        "Open Assistant →",
        "/Plexi-Assistant",
        use_container_width=True,
        type="primary",
    )

st.markdown("---")

# ── How it works ─────────────────────────────────────────────────
st.markdown("### How it works")
steps = st.columns(3, gap="medium")
with steps[0]:
    st.markdown("**1. Pick your scope**")
    st.caption("Select semester and subject from the sidebar.")
with steps[1]:
    st.markdown("**2. Browse or chat**")
    st.caption("View files in the Hub, or ask Plexi-Bot questions grounded in your materials.")
with steps[2]:
    st.markdown("**3. Contribute**")
    st.caption("Upload your own notes via a GitHub Issue — they appear for everyone automatically.")

# ── Contribute CTA ───────────────────────────────────────────────
st.markdown("---")
with st.expander("Want to contribute study materials?"):
    st.markdown(
        "Open an Issue on the materials repo and attach your file. "
        "A bot will process it and make it available to everyone.\n\n"
        "[Open an Upload Issue →](https://github.com/KunalGupta25/plexi-materials/issues/new?template=upload-material.yml)"
    )


