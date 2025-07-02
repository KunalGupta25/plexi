import streamlit as st

st.set_page_config(page_title="Plexi | Home", page_icon="🤖")
st.title("🤖 Plexi: Your Study Patner")
st.markdown("""
Welcome to **Plexi**, your one stop solution for all academic needs!\n
- It is specially designed to help students with their academic journey by providing access to study materials, answering questions, and assisting with various academic tasks.\n
- Plexi is powered by advanced AI models and integrates with Google Drive to provide a seamless experience \n
## Currently, it have:\n
- **Study Material Hub**: Access a wide range of study materials organized by semester and subject.(but only have 5th semester data for now)\n
- **Plexi-Bot**: An AI assistant that can answer your academic questions and assist with your studies.(Works with gemini 2.0 flash)\n
            """)
st.markdown("## Get Started:")
col1, col2 = st.columns(2)
with col1:
    st.link_button(
        "Study Material Hub",
        "/Study_Material_Hub",
        use_container_width=True,
        type="primary",
        # Replace with your GitHub URL
    )
with col2:
    st.link_button(
        "Plexi-Bot",
        "Plexi-Assistant",
        use_container_width=True,
        type="secondary",
        # Replace with your GitHub URL
    )

with st.sidebar:
    # st.markdown("---")
    st.markdown("**About Me**")
    st.link_button(
        "Portfolio",
        "https://lazyhideout.tech",  # Replace with your GitHub URL
        icon=":material/info:",                          # Octopus emoji as GitHub icon
        use_container_width=True
    )
    st.link_button(
        "GitHub",
        "https://github.com/kunalgupta25",  # Replace with your GitHub URL
        icon="🐙",                          # Octopus emoji as GitHub icon
        use_container_width=True
        
    )
    st.link_button(
        "Ko-fi",
        "https://ko-fi.com/lazy_human",   # Replace with your Ko-fi URL
        icon=":material/coffee:",                          # Coffee emoji as Ko-fi icon
        use_container_width=True
    )


