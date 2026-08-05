# ⚙️ Installation & Setup Guide

This guide covers the necessary steps to configure your environment and install the required dependencies for the Federated Blockchain Thyroid Detection System.

## Prerequisites
* **Python 3.8 or higher** installed on your system.
* A terminal or command prompt (VS Code integrated terminal is recommended).

## Step 1: Navigate to the Project Directory
Ensure you are inside the main project folder before running any commands:
```bash
cd "College_Project_Complete (1)"  

Step 2: Install Core Dependencies
The project requires several machine learning, deep learning, and UI libraries. Install them by running the following command:
Bash
pip install -r requirements.txt

Step 3: Install Explainable AI & UI Packages
If they were not included in your requirements.txt, ensure you install Streamlit and the XAI libraries:
Bash
pip install streamlit shap lime