# 🩺 Federated Blockchain Thyroid Detection System

![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![TensorFlow](https://img.shields.io/badge/TensorFlow-Deep_CNN-orange)
![Streamlit](https://img.shields.io/badge/Streamlit-UI-red)
![Blockchain](https://img.shields.io/badge/Security-SHA--256-green)

## 📌 Overview
This project presents a state-of-the-art, privacy-preserving machine learning architecture for predicting thyroid disease recurrence. By combining **Deep Convolutional Neural Networks (1D-CNN)** with an ensemble **Voting Classifier**, the system achieves a peak diagnostic accuracy of **98.7%**. 

To overcome the dual challenges of medical data privacy and AI opacity, this framework implements a decentralized **Federated Learning** network secured by a **SHA-256 Blockchain ledger**, and integrates **Explainable AI (XAI)** to provide transparent, human-readable clinical reasoning.

## 📖 Documentation Quick Links
* ⚙️ **[Installation & Setup Guide](INSTALL.md)** - Instructions for setting up your Python environment and dependencies.
* 🚀 **[Execution & Presentation Guide](EXECUTION.md)** - Step-by-step instructions for running the pipeline and launching the web UI.

---

## ✨ Key Features
* **High-Accuracy Diagnostics:** Utilizes XGBoost and a custom 100-epoch Deep 1D-CNN (98.7% Accuracy, 1.0 ROC-AUC).
* **Privacy-Preserving (Federated Learning):** Simulates a decentralized network of hospital nodes that train the model locally without sharing raw patient data.
* **Blockchain Security:** All federated weight updates are cryptographically hashed (SHA-256) into a secure, immutable ledger to prevent adversarial attacks.
* **Explainable AI (XAI):** * **SHAP:** Global feature importance evaluation.
  * **LIME:** Local, patient-specific diagnostic reasoning.
* **Clinical SaaS Dashboard:** A fully interactive, web-based UI built with Streamlit for seamless clinical deployment.

---

## 📂 Project Structure
```text
COLLEGE_PROJECT_COMPLETE/
│
├── .streamlit/
│   └── config.toml                  # Custom UI Theme (White SaaS layout)
│
├── app.py                           # The Streamlit Web Dashboard (UI)
├── thyroid_pipeline.py              # Main ML pipeline (Data, CNN, SHAP, LIME)
├── federated_blockchain_thyroid.py  # Blockchain and Node logic
├── run_all.py                       # Executes the federated network simulation
├── requirements.txt                 # Project dependencies
├── Thyroid_Diff.csv                 # Primary dataset
├── INSTALL.md                       # Setup instructions
├── EXECUTION.md                     # Running instructions
└── README.md                        # Main project documentation