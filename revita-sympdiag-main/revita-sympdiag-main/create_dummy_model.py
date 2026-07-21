import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer

def create_dummy_model():
    print("Creating dummy model for demonstration...")
    
    # We use English texts because the Backend translates the medical record from Vietnamese to English before sending it to AI!
    texts = [
        "chest pain and high blood pressure",
        "diabetes, thirsty, fatigue",
        "high fever, infection, cough with phlegm",
        "headache, dizziness, nausea",
        "stomachache, diarrhea, food poisoning"
    ]
    word_vec = TfidfVectorizer()
    X = word_vec.fit_transform(texts)
    
    # 2. Create dummy labels (ICD codes) corresponding to the texts
    # We will just map them to some realistic-looking ICD codes
    # Text 1: Huyết áp (10-I10), Đau thắt ngực (10-I20)
    # Text 2: Tiểu đường (10-E119)
    # Text 3: Viêm phổi (10-J189), Sốt (10-R509)
    # Text 4: Đau đầu (10-R51)
    # Text 5: Tiêu chảy (10-A09)
    labels = [
        ["10-I10", "10-I20"],
        ["10-E119"],
        ["10-J189", "10-R509"],
        ["10-R51"],
        ["10-A09"]
    ]
    
    # 3. Binarize labels
    mlb = MultiLabelBinarizer()
    y = mlb.fit_transform(labels)
    
    # 4. Train the classifier
    clf = OneVsRestClassifier(SGDClassifier(loss='log_loss', random_state=42))
    clf.fit(X, y)
    
    # 5. Create bundle
    bundle = {
        "clf": clf,
        "word_vec": word_vec,
        "char_vec": None,
        "mlb": mlb,
        "cfg": {
            "MAX_TOKENS_PER_DOC": 8000,
            "USE_TABULAR": False
        }
    }
    
    # 6. Ensure models directory exists and save
    os.makedirs("models", exist_ok=True)
    model_path = os.path.join("models", "ovr_sgd_tfidf.joblib")
    joblib.dump(bundle, model_path)
    
    print(f"Successfully created dummy model at: {model_path}")
    print("Classes available:", mlb.classes_)

if __name__ == "__main__":
    create_dummy_model()
