 py -3.12 -m pip install -r requirements.txt

 py -3.12 -m uvicorn api:app --reload

 py -3.12 -m streamlit run app.py
 OR(py -3.12 -m streamlit run app.py --server.port 8502)