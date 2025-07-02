# loader.py
import os
import io
import time
from http.client import IncompleteRead
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from googleapiclient.errors import HttpError
from llama_index.core import VectorStoreIndex, Document, StorageContext, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from dotenv import load_dotenv
import PyPDF2

load_dotenv()

def initialize_drive_service():
    """Authenticate with Google Drive using service account."""
    service_key = {
        "type": "service_account",
        "project_id": os.getenv("PROJECT_ID"),
        "private_key": os.getenv("PRIVATE_KEY").replace('\\n', '\n'),
        "client_email": os.getenv("CLIENT_EMAIL"),
        "token_uri": "https://oauth2.googleapis.com/token",
    }
    credentials = service_account.Credentials.from_service_account_info(
        service_key,
        scopes=['https://www.googleapis.com/auth/drive.readonly']
    )
    return build('drive', 'v3', credentials=credentials)

def fetch_drive_files(service, folder_id):
    """Recursively fetch all files from Drive folder and subfolders."""
    files = []
    stack = [folder_id]
    while stack:
        current_folder = stack.pop()
        page_token = None
        while True:
            try:
                results = service.files().list(
                    q=f"'{current_folder}' in parents and trashed = false",
                    fields="nextPageToken, files(id, name, mimeType)",
                    pageToken=page_token
                ).execute()
                items = results.get('files', [])
                for item in items:
                    if item['mimeType'] == 'application/vnd.google-apps.folder':
                        stack.append(item['id'])
                    else:
                        files.append(item)
                page_token = results.get('nextPageToken')
                if not page_token:
                    break
            except HttpError as e:
                print(f"Drive API error: {e}")
                time.sleep(5)  # Wait before retrying
                continue
    return files

def download_file_with_retry(service, file_id, max_retries=3):
    """Download file content with retry on IncompleteRead"""
    request = service.files().get_media(fileId=file_id)
    for attempt in range(max_retries):
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        try:
            while not done:
                _, done = downloader.next_chunk()
            fh.seek(0)
            return fh.read()
        except IncompleteRead as e:
            print(f"IncompleteRead error on attempt {attempt+1} for file {file_id}, retrying...")
            if attempt == max_retries - 1:
                raise
        except Exception as e:
            print(f"Download error: {str(e)}")
            if attempt == max_retries - 1:
                raise
    return None

def read_pdf_content_safe(pdf_bytes):
    """Extract text from PDF with error handling and surrogate filtering."""
    text = []
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            try:
                page_text = page.extract_text()
                if page_text:
                    # Remove lone surrogates (invalid Unicode code points)
                    filtered = page_text.encode("utf-16", "surrogatepass").decode("utf-16", "ignore")
                    text.append(filtered)
            except Exception as e:
                print(f"Page extraction warning: {str(e)}")
        return "\n".join(text)
    except Exception as e:
        print(f"PDF extraction error: {str(e)}")
        # Fallback: try to decode as text
        try:
            return pdf_bytes.decode('utf-8', errors='ignore')
        except:
            return ""


def create_documents(service, files):
    """Convert Drive files to LlamaIndex Documents with error handling"""
    documents = []
    supported_types = ['text/', 'application/pdf']

    for file in files:
        # Skip unsupported file types
        if not any(file['mimeType'].startswith(t) for t in supported_types):
            print(f"Skipping unsupported file: {file['name']} ({file['mimeType']})")
            continue

        try:
            content = download_file_with_retry(service, file['id'])
            if not content:
                continue

            # Handle text files
            if file['mimeType'].startswith('text/'):
                try:
                    text = content.decode('utf-8')
                    documents.append(Document(text=text, id_=file['id']))
                except UnicodeDecodeError:
                    print(f"Skipped binary file: {file['name']}")

            # Handle PDF files
            elif file['mimeType'] == 'application/pdf':
                text = read_pdf_content_safe(content)
                if text.strip():
                    documents.append(Document(text=text, id_=file['id']))
                else:
                    print(f"Failed to extract text from PDF: {file['name']}")

        except Exception as e:
            print(f"Error processing {file['name']}: {str(e)}")

    return documents

def load_and_index_data():
    """Main function to load data and create index"""
    drive_service = initialize_drive_service()
    folder_id = "1UjzflgkeugjnODaAxwdbTaPtvGZBDoJC"

    print("Fetching files from Google Drive...")
    files = fetch_drive_files(drive_service, folder_id)
    print(f"Found {len(files)} files.")

    print("Processing files...")
    documents = create_documents(drive_service, files)
    print(f"Processed {len(documents)} documents.")

    print("Building vector index...")
    embed_model = HuggingFaceEmbedding(
        model_name="BAAI/bge-large-en-v1.5",
        # api_key=os.getenv("HUGGINGFACEHUB_API_TOKEN")  # Use your HF API token in .env
    )
    Settings.embed_model = embed_model

    index = VectorStoreIndex.from_documents(documents, embed_model=embed_model)
    index.storage_context.persist(persist_dir="index")
    print("Index built and persisted in ./index")

    return len(documents)

if __name__ == "__main__":
    doc_count = load_and_index_data()
    print(f"All done! {doc_count} documents indexed.")
