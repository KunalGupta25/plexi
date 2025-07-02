import streamlit as st
import pandas as pd
from googleapiclient.discovery import build
from google.oauth2 import service_account
from googleapiclient.http import MediaIoBaseDownload
from streamlit_pdf_viewer import pdf_viewer
import io
import base64
import os
from dotenv import load_dotenv
load_dotenv()


# Configure page
st.set_page_config(page_title="Study Materials Hub", layout="wide", page_icon="📚")
service_key = {
        "type": "service_account",
        "project_id": os.getenv("PROJECT_ID"),
        "private_key": os.getenv("PRIVATE_KEY").replace('\\n', '\n'),
        "client_email": os.getenv("CLIENT_EMAIL"),
        "token_uri": "https://oauth2.googleapis.com/token",
    }
# Google Drive Setup
SERVICE_ACCOUNT_FILE = service_key #'service_accounts.json'  # Path to your service account JSON file
SCOPES = ['https://www.googleapis.com/auth/drive']
ROOT_FOLDER_ID = '1UjzflgkeugjnODaAxwdbTaPtvGZBDoJC'  # Main Plexi folder ID

@st.cache_resource
def get_drive_service():
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('drive', 'v3', credentials=credentials)

def get_folders_in_parent(parent_id):
    """Get all folders within a parent folder"""
    service = get_drive_service()
    query = f"'{parent_id}' in parents and mimeType='application/vnd.google-apps.folder'"
    results = service.files().list(q=query, fields="files(id, name)").execute()
    return results.get('files', [])

def get_files_in_folder(folder_id, file_types=None):
    """Get files in a folder, optionally filtered by type"""
    service = get_drive_service()
    query = f"'{folder_id}' in parents and mimeType!='application/vnd.google-apps.folder'"
    
    if file_types:
        type_queries = []
        for file_type in file_types:
            if file_type.lower() == 'pdf':
                type_queries.append("mimeType='application/pdf'")
            elif file_type.lower() in ['ppt', 'pptx']:
                type_queries.append("mimeType='application/vnd.ms-powerpoint' or mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation'")
        if type_queries:
            query += f" and ({' or '.join(type_queries)})"
    
    results = service.files().list(q=query, fields="files(id, name, mimeType)").execute()
    return results.get('files', [])

def download_file(file_id):
    """Download file content"""
    service = get_drive_service()
    request = service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
    fh.seek(0)
    return fh.getvalue()

def display_pdf(file_content):
    """Display PDF using streamlit-pdf-viewer"""
    pdf_viewer(file_content, width="100%", height=600)

def display_ppt_as_pdf(file_content):
    """Convert PPT to PDF for viewing (simplified approach)"""
    # For production, you'd convert PPT to PDF using python-pptx or similar
    st.warning("PPT files require conversion to PDF for preview. Download to view original.")
    # For now, show download button
    st.download_button(
        label="Download PPT file",
        data=file_content,
        file_name="presentation.pptx",
        mime="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )

# Initialize session state
if 'selected_semester' not in st.session_state:
    st.session_state.selected_semester = None
if 'selected_subject' not in st.session_state:
    st.session_state.selected_subject = None
if 'selected_type' not in st.session_state:
    st.session_state.selected_type = None
if 'selected_file' not in st.session_state:
    st.session_state.selected_file = None

# Main UI
st.title("📚 Study Materials Hub")
st.markdown("---")

# Create the cascading dropdown system
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.subheader("📅 Semester")
    # Get all semester folders
    semester_folders = get_folders_in_parent(ROOT_FOLDER_ID)
    semester_options = ["Select Semester"] + [folder['name'] for folder in semester_folders]
    
    selected_semester = st.selectbox(
        "Choose Semester:",
        semester_options,
        key="semester_dropdown"
    )
    
    if selected_semester != "Select Semester":
        st.session_state.selected_semester = selected_semester
        # Find semester folder ID
        semester_folder_id = next(f['id'] for f in semester_folders if f['name'] == selected_semester)
    else:
        st.session_state.selected_semester = None

with col2:
    st.subheader("📖 Subject")
    if st.session_state.selected_semester:
        # Get subject folders within semester
        subject_folders = get_folders_in_parent(semester_folder_id)
        subject_options = ["Select Subject"] + [folder['name'] for folder in subject_folders]
        
        selected_subject = st.selectbox(
            "Choose Subject:",
            subject_options,
            key="subject_dropdown"
        )
        
        if selected_subject != "Select Subject":
            st.session_state.selected_subject = selected_subject
            subject_folder_id = next(f['id'] for f in subject_folders if f['name'] == selected_subject)
        else:
            st.session_state.selected_subject = None
    else:
        st.selectbox("Choose Subject:", ["Select Semester First"], disabled=True)

with col3:
    st.subheader("📋 Type")
    if st.session_state.selected_subject:
        # Get type folders (ppts, pdfs, notes, etc.)
        type_folders = get_folders_in_parent(subject_folder_id)
        type_options = ["Select Type"] + [folder['name'] for folder in type_folders]
        
        selected_type = st.selectbox(
            "Choose Type:",
            type_options,
            key="type_dropdown"
        )
        
        if selected_type != "Select Type":
            st.session_state.selected_type = selected_type
            type_folder_id = next(f['id'] for f in type_folders if f['name'] == selected_type)
        else:
            st.session_state.selected_type = None
    else:
        st.selectbox("Choose Type:", ["Select Subject First"], disabled=True)

with col4:
    st.subheader("📄 Chapter/File")
    if st.session_state.selected_type:
        # Get files in the type folder
        files = get_files_in_folder(type_folder_id)
        file_options = ["Select File"] + [file['name'] for file in files]
        
        selected_file = st.selectbox(
            "Choose File:",
            file_options,
            key="file_dropdown"
        )
        
        if selected_file != "Select File":
            st.session_state.selected_file = selected_file
            selected_file_obj = next(f for f in files if f['name'] == selected_file)
        else:
            st.session_state.selected_file = None
    else:
        st.selectbox("Choose File:", ["Select Type First"], disabled=True)

# File Preview Section
st.markdown("---")
st.subheader("🔍 File Preview")

if st.session_state.selected_file:
    # Create columns for preview and info
    preview_col, info_col = st.columns([3, 1])
    
    with info_col:
        st.write("**File Details:**")
        st.write(f"📁 Semester: {st.session_state.selected_semester}")
        st.write(f"📚 Subject: {st.session_state.selected_subject}")
        st.write(f"📋 Type: {st.session_state.selected_type}")
        st.write(f"📄 File: {st.session_state.selected_file}")
        
        # Download button
        if st.button("📥 Download File", use_container_width=True):
            file_content = download_file(selected_file_obj['id'])
            st.download_button(
                label="Click to Download",
                data=file_content,
                file_name=selected_file_obj['name'],
                mime=selected_file_obj['mimeType']
            )
    
    with preview_col:
        try:
            # Download and preview the file
            file_content = download_file(selected_file_obj['id'])
            file_mime = selected_file_obj['mimeType']
            
            if file_mime == 'application/pdf':
                display_pdf(file_content)
            elif file_mime in ['application/vnd.ms-powerpoint', 
                             'application/vnd.openxmlformats-officedocument.presentationml.presentation']:
                display_ppt_as_pdf(file_content)
            else:
                st.info("Preview not available for this file type. Use download button to access the file.")
                
        except Exception as e:
            st.error(f"Error loading file: {str(e)}")
            
else:
    st.info("👆 Please select a file from the dropdowns above to preview it here.")

# Sidebar with additional info
with st.sidebar:
    # st.header("📊 Navigation Summary")
    
    # if st.session_state.selected_semester:
    #     st.success(f"✅ Semester: {st.session_state.selected_semester}")
    # else:
    #     st.info("📅 Semester: Not Selected")
        
    # if st.session_state.selected_subject:
    #     st.success(f"✅ Subject: {st.session_state.selected_subject}")
    # else:
    #     st.info("📖 Subject: Not Selected")
        
    # if st.session_state.selected_type:
    #     st.success(f"✅ Type: {st.session_state.selected_type}")
    # else:
    #     st.info("📋 Type: Not Selected")
        
    # if st.session_state.selected_file:
    #     st.success(f"✅ File: {st.session_state.selected_file}")
    # else:
    #     st.info("📄 File: Not Selected")
    
    # st.markdown("---")
    
    # Reset button

    # if st.button("🔄 Reset All Selections"):
    #     for key in ['selected_semester', 'selected_subject', 'selected_type', 'selected_file']:
    #         if key in st.session_state:
    #             del st.session_state[key]
    #     st.rerun()

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

