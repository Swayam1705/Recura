# 🩺 Recura — Clinical AI Platform for Thyroid Cancer Care

> **Recura** is an enterprise-grade, multi-role Clinical Decision Support System (CDSS) designed for thyroid carcinoma recurrence risk stratification, explainable AI (XAI) diagnostics, and federated patient data governance.

---

## 🚀 Key Highlights & Extraordinary Features

### 🧠 1. Explainable AI (XAI) & Attribution
* **Feature Importance Breakdown:** Uses SHAP & LIME attribution models to break down *why* an AI diagnosis was made, categorizing parameters as **Reassuring** vs. **Elevating Concern**.
* **Black-Box Elimination:** Gives physicians transparent clinical trust rather than uninterpretable probability scores.

### 📐 2. ACR-TIRADS Clinical Decision Engine
* **Guideline Compliance:** Automatically maps extracted clinical parameters against the **ACR-TIRADS 2017** radiology management standards.
* **Standardized Recommendations:** Generates actionable guidance (e.g., *FNA Biopsy recommended if size >= 1.5 cm*, *TR2/TR3 Routine Monitoring*).

### 🎛️ 3. "What-If" Counterfactual AI Simulator
* **Interactive Treatment Planning:** Allows clinicians to dynamically adjust clinical inputs (Nodule Size, Involved Lymph Nodes, Age) using live sliders.
* **Real-Time Risk Trajectory:** Dynamically recalculates risk deltas to help doctors evaluate treatment scenarios before surgery or therapy.

### 🛡️ 4. Federated Blockchain Audit Ledger
* **Cryptographic Immutability:** Diagnostic records are cryptographically signed with block hashes, previous hashes, and Merkle root verification.
* **Tamper-Evident Verification:** Includes a slide-over audit drawer allowing doctors and auditors to verify ledger integrity on demand.

### 🎙️ 5. Ambient Voice Dictation & AI Note Parser
* **Speech-to-Text NLP:** Integrated Web Speech API enables real-time ambient voice dictation directly into clinical note inputs.
* **Entity Extraction:** Automated NLP parsing converts unstructured clinical dictation into structured SOAP note parameters.

### 🐳 6. Production-Ready Docker Microservices
* **Containerized Architecture:** Fully dockerized frontend, FastAPI ML backend, and orchestrator using docker-compose.
* **Hospital On-Premise Ready:** Built for HIPAA-compliant local server deployment inside hospital firewalls.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Three.js (React Three Fiber), Lucide Icons
* **Backend:** Python 3.10, FastAPI, PyTorch, Scikit-Learn, Pandas, NumPy, OpenCV
* **XAI & ML:** SHAP, LIME, Custom Ensemble Pipeline, Federated Learning Engine
* **DevOps:** Docker, Docker Compose, Git

---

## 💻 Quick Start Guide

### Option A: Running with Docker (Recommended)
docker compose up --build

### Option B: Running Locally
1. Backend: python app.py
2. Frontend: cd recura-frontend && npm run dev