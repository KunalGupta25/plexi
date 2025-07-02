# 📚 Plexi: Notes Platform

<p align="center">
  <img src="assets/logo.png" alt="Plexi Logo" />
</p>

Plexi is a comprehensive platform for My University Computer Science Students. It provides organized access to semester-wise notes and study materials, and also features an AI-powered assistant for academic queries.

---

## 🚀 Features

- **Semester-wise Notes Download:**  
  Easily browse and download CSE notes and study materials for Parul University, organized by semester and subject.

- **Plexi Assistant:**  
  Chat with an AI assistant for academic help, summaries, and quick answers to your questions.

- **Secure & Private:**  
  All credentials are managed securely via environment variables.

---

## 🛠️ Tech Stack

- Python 3.10+
- Streamlit (web app framework)
- Google Drive API (for notes storage)
- LlamaIndex (knowledge base)
- Google GenAI (Base LLM - gemini 2.0 flash) 
- HuggingFace (Data Embedding and Indexing)
- python-dotenv (environment management)

---

## 📥 Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/KunalGupta25/plexi.git
   cd plexi
   ```

2. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   - Copy `example.env` to `.env` and fill in your credentials:
     ```env
     PROJECT_ID=your-google-project-id
     PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
     CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
     GOOGLE_API_KEY=your-google-api-key
     HUGGINGFACEHUB_API_TOKEN=your-huggingface-api
     ```

4. **Run the app:**
   ```sh
   streamlit run Home.py
   ```

---

## 📚 About `loader.py`

The `loader.py` script:

- Authenticates with Google Drive
- Fetches and organizes notes and study materials
- Index the Document to be used as Knowlage Base for Fast Response
---

## 🖼️ Preview

![Plexi Home](assets/home.png)
![Study Material Hub](assets/material_hub1.png)
![Study Material Hub](assets/marteial_hub2.png)
![Plexi Assistant](assets/assistant.png)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## ☕ Request Commission Work

Looking for creating any kind of webapp or chatbot?  
**Open for all kinds of commission work!**  
Whether you need a unique app, integration, or automation, feel free to reach out.

Support my work or request your custom project here:  
[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/lazy_human)

Or visit: https://ko-fi.com/lazy_human

---

> Made with ❤️ by Kunal aka LazyHuman