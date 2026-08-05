# =============================================================================
# THYROID DETECTION PIPELINE
# Dataset : Thyroid_Diff.csv (383 rows x 17 columns)
# Target  : Recurred (Yes = 1, No = 0)
# Models  : Lazy Classifiers → Voting Classifier (Soft) → Deep CNN
# Paper   : Blockchain-Enabled Thyroid Detection using Voting Classifier
#           and Deep Convolutional Neural Network
# =============================================================================
# INSTALL DEPENDENCIES (run once in terminal):
# pip install pandas numpy scikit-learn matplotlib seaborn lazypredict
#             xgboost lightgbm catboost tensorflow
# =============================================================================
print("⏳ Loading ML Libraries... this might take a minute...")
from xml.parsers.expat import model

import matplotlib
matplotlib.use('Agg')  # ✅ Fix: saves plots as PNG files instead of opening popups

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, matthews_corrcoef, cohen_kappa_score,
                             confusion_matrix, roc_auc_score, roc_curve,
                             ConfusionMatrixDisplay)
from sklearn.ensemble import (VotingClassifier, BaggingClassifier,
                               RandomForestClassifier, ExtraTreesClassifier,
                               AdaBoostClassifier)
from sklearn.tree import DecisionTreeClassifier
import lightgbm as lgb
import xgboost as xgb
from catboost import CatBoostClassifier

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (Conv1D, MaxPooling1D, Flatten,
                                      Dense, Dropout, BatchNormalization)
from tensorflow.keras.callbacks import EarlyStopping

print("✅ Libraries loaded successfully! Starting data processing...")

# =============================================================================
# STEP 1 — LOAD DATASET
# =============================================================================
print("=" * 60)
print("STEP 1: Loading Dataset")
print("=" * 60)

# ✅ Keep CSV in the same folder as this script, or provide full path
df = pd.read_csv("Thyroid_Diff.csv")

TARGET_COL = "Recurred"
print(f"Shape: {df.shape}")
print(f"\nTarget Distribution:\n{df[TARGET_COL].value_counts()}")

# --- Fig. 2: Dataset Distribution Pie Chart ---
plt.figure(figsize=(5, 5))
df[TARGET_COL].value_counts().plot(
    kind='pie', autopct='%1.2f%%',
    colors=['#4C72B0', '#DD8452'],
    labels=['No (Normal)', 'Yes (Abnormal)'],
    startangle=90
)
plt.title("Distribution of Normal and Abnormal (No/Yes)")
plt.ylabel("")
plt.tight_layout()
plt.savefig("fig2_dataset_distribution.png", dpi=150)
#plt.show()  # disabled: plots saved as PNG files
print("✅ Dataset loaded.\n")


# =============================================================================
# STEP 2 — DATA PREPROCESSING
# =============================================================================
print("=" * 60)
print("STEP 2: Data Preprocessing")
print("=" * 60)

df_processed = df.copy()

# --- Encode target: Yes=1, No=0 ---
df_processed[TARGET_COL] = df_processed[TARGET_COL].map({'Yes': 1, 'No': 0})

# --- Label encode all categorical columns ---
le = LabelEncoder()
categorical_cols = df_processed.select_dtypes(include='object').columns.tolist()
for col in categorical_cols:
    df_processed[col] = le.fit_transform(df_processed[col].astype(str))

print(f"Categorical columns encoded: {categorical_cols}")

# --- Separate features and target ---
X = df_processed.drop(columns=[TARGET_COL])
y = df_processed[TARGET_COL]

# --- Min-Max Scaling (Equation 1 in paper) ---
# X_scaled = (X - X_min) / (X_max - X_min)
scaler = MinMaxScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=X.columns)

print(f"\nFeatures shape after scaling: {X_scaled.shape}")
print("✅ Preprocessing done.\n")


# =============================================================================
# STEP 3 — FEATURE SELECTION (CatBoost + XGBoost + LightGBM)
# Equations 2, 3, 4 from the paper
# =============================================================================
print("=" * 60)
print("STEP 3: Feature Selection using Boosting Classifiers")
print("=" * 60)

cat_model = CatBoostClassifier(verbose=0, random_state=42)
xgb_model = xgb.XGBClassifier(eval_metric='logloss', random_state=42)
lgb_model  = lgb.LGBMClassifier(random_state=42, verbose=-1)

cat_model.fit(X_scaled, y)
xgb_model.fit(X_scaled, y)
lgb_model.fit(X_scaled, y)

# Average feature importance across 3 models (Eq. 2)
importance_df = pd.DataFrame({
    'Feature'  : X_scaled.columns,
    'CatBoost' : cat_model.feature_importances_,
    'XGBoost'  : xgb_model.feature_importances_,
    'LightGBM' : lgb_model.feature_importances_
})
importance_df['Avg_Importance'] = importance_df[
    ['CatBoost', 'XGBoost', 'LightGBM']].mean(axis=1)
importance_df = importance_df.sort_values('Avg_Importance', ascending=False)

print("\nFeature Importance Ranking:")
print(importance_df[['Feature', 'Avg_Importance']].to_string(index=False))

# --- Fig. 3: Feature Importance Plot ---
plt.figure(figsize=(8, 6))
sns.barplot(data=importance_df, x='Avg_Importance', y='Feature', palette='Blues_r')
plt.title("Feature Importance (CatBoost + XGBoost + LightGBM Average)")
plt.xlabel("Importance Score")
plt.tight_layout()
plt.savefig("fig3_feature_importance.png", dpi=150)
#plt.show()  # disabled: plots saved as PNG files

# --- Select Top-7 features (Eq. 3 & 4) ---
TOP_K = 7
top_features = importance_df['Feature'].head(TOP_K).tolist()
print(f"\nSelected Top-{TOP_K} Features: {top_features}")

X_selected = X_scaled[top_features]
print("✅ Feature selection done.\n")


# =============================================================================
# STEP 4 — TRAIN/TEST SPLIT (80/20 as in paper)
# =============================================================================
print("=" * 60)
print("STEP 4: Train/Test Split (80% / 20%)")
print("=" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    X_selected, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Train size : {X_train.shape}")
print(f"Test size  : {X_test.shape}")
print("✅ Split done.\n")


# =============================================================================
# STEP 5 — LAZY CLASSIFIERS (Table 1 in paper)
# =============================================================================
print("=" * 60)
print("STEP 5: Lazy Classifiers Evaluation (27 ML Models)")
print("=" * 60)

try:
    from lazypredict.Supervised import LazyClassifier
    lazy_clf = LazyClassifier(verbose=0, ignore_warnings=True, custom_metric=None)
    lazy_models, lazy_predictions = lazy_clf.fit(X_train, X_test, y_train, y_test)
    print("\nLazy Classifier Results (Top 10):")
    print(lazy_models.head(10))
    lazy_models.to_csv("table1_lazy_classifiers.csv")
    print("✅ Results saved to table1_lazy_classifiers.csv\n")
except ImportError:
    print("⚠️  lazypredict not installed. Run: pip install lazypredict")
    print("   Skipping lazy classifiers step...\n")


# =============================================================================
# STEP 6 — VOTING CLASSIFIER (Top-7 base learners from paper)
# Equation 6 from the paper
# =============================================================================
print("=" * 60)
print("STEP 6: Voting Classifier (Soft + Hard)")
print("=" * 60)

base_estimators = [
    ('bagging',  BaggingClassifier(random_state=42)),
    ('dt',       DecisionTreeClassifier(random_state=42)),
    ('et',       ExtraTreesClassifier(random_state=42)),
    ('rf',       RandomForestClassifier(random_state=42)),
    ('lgbm',     lgb.LGBMClassifier(random_state=42, verbose=-1)),
    ('xgb',      xgb.XGBClassifier(eval_metric='logloss', random_state=42)),
    ('adaboost', AdaBoostClassifier(random_state=42))
]

def evaluate_model(name, model, X_tr, X_te, y_tr, y_te):
    model.fit(X_tr, y_tr)
    y_pred = model.predict(X_te)
    y_prob = model.predict_proba(X_te)[:, 1] if hasattr(model, 'predict_proba') else None

    acc   = accuracy_score(y_te, y_pred)
    prec  = precision_score(y_te, y_pred, zero_division=0)
    rec   = recall_score(y_te, y_pred, zero_division=0)
    f1    = f1_score(y_te, y_pred, zero_division=0)
    mcc   = matthews_corrcoef(y_te, y_pred)
    kappa = cohen_kappa_score(y_te, y_pred)
    auc   = roc_auc_score(y_te, y_prob) if y_prob is not None else None

    print(f"\n{'─'*50}")
    print(f"Model     : {name}")
    print(f"Accuracy  : {acc:.4f}")
    print(f"Precision : {prec:.4f}")
    print(f"Recall    : {rec:.4f}")
    print(f"F1-Score  : {f1:.4f}")
    print(f"MCC       : {mcc:.4f}")
    print(f"Kappa     : {kappa:.4f}")
    if auc:
        print(f"ROC-AUC   : {auc:.4f}")

    return {
        'Model': name, 'Accuracy': acc, 'Precision': prec,
        'Recall': rec, 'F1-Score': f1, 'MCC': mcc, 'Kappa': kappa,
        'ROC-AUC': auc, 'y_pred': y_pred, 'y_prob': y_prob, 'model': model
    }

voting_soft = VotingClassifier(estimators=base_estimators, voting='soft')
soft_results = evaluate_model("Voting Classifier (Soft)",
                               voting_soft, X_train, X_test, y_train, y_test)

voting_hard = VotingClassifier(estimators=base_estimators, voting='hard')
hard_results = evaluate_model("Voting Classifier (Hard)",
                               voting_hard, X_train, X_test, y_train, y_test)

print("\n✅ Voting classifiers done.\n")


# =============================================================================
# STEP 7 — DEEP CNN MODEL (Architecture from paper)
# Equation 7 from the paper: Y = σ(ΣΣ X * W + b)
# =============================================================================
print("=" * 60)
print("STEP 7: Deep CNN Model")
print("=" * 60)

# Reshape for Conv1D: (samples, features, 1)
X_train_cnn = np.array(X_train).reshape(X_train.shape[0], X_train.shape[1], 1)
X_test_cnn  = np.array(X_test).reshape(X_test.shape[0],  X_test.shape[1],  1)

def build_deep_cnn(input_shape):
    model = Sequential([
        # Conv Block 1 — 1x1 kernels as described in paper
        Conv1D(filters=64, kernel_size=1, padding='same',
               activation='relu', input_shape=input_shape),
        BatchNormalization(),
        MaxPooling1D(pool_size=1),

        # Conv Block 2
        Conv1D(filters=128, kernel_size=1, padding='same', activation='relu'),
        BatchNormalization(),
        MaxPooling1D(pool_size=1),

        # Conv Block 3
        Conv1D(filters=64, kernel_size=1, padding='same', activation='relu'),
        BatchNormalization(),

        # Fully Connected — 128 neurons as in paper
        Flatten(),
        Dense(128, activation='relu'),
        Dropout(0.4),
        Dense(64, activation='relu'),
        Dropout(0.3),

        # Output — sigmoid for binary classification
        Dense(1, activation='sigmoid')
    ])
    model.compile(optimizer='adam',
                  loss='binary_crossentropy',
                  metrics=['accuracy'])
    return model

cnn_model = build_deep_cnn((X_train_cnn.shape[1], 1))
cnn_model.summary()

early_stop = EarlyStopping(monitor='val_loss', patience=10,
                            restore_best_weights=True)

history = cnn_model.fit(
    X_train_cnn, y_train,
    epochs=100,
    batch_size=16,
    validation_data=(X_test_cnn, y_test),
    callbacks=[early_stop],
    verbose=1
)

# Save the model in the Keras h5 format
cnn_model.save("deep_cnn_model.h5")

# --- Fig. 4: Training & Validation Accuracy/Loss ---
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

axes[0].plot(history.history['accuracy'],     label='Train Accuracy')
axes[0].plot(history.history['val_accuracy'], label='Validation Accuracy')
axes[0].set_title("Training & Validation Accuracy")
axes[0].set_xlabel("Epochs")
axes[0].set_ylabel("Accuracy")
axes[0].legend()

axes[1].plot(history.history['loss'],     label='Train Loss')
axes[1].plot(history.history['val_loss'], label='Validation Loss')
axes[1].set_title("Training & Validation Loss")
axes[1].set_xlabel("Epochs")
axes[1].set_ylabel("Loss")
axes[1].legend()

plt.tight_layout()
plt.savefig("fig4_cnn_training_curves.png", dpi=150)
#plt.show()  # disabled: plots saved as PNG files

# --- CNN Evaluation ---
y_prob_cnn = cnn_model.predict(X_test_cnn).flatten()
y_pred_cnn = (y_prob_cnn >= 0.5).astype(int)

cnn_results = {
    'Model'    : 'Deep CNN',
    'Accuracy' : accuracy_score(y_test, y_pred_cnn),
    'Precision': precision_score(y_test, y_pred_cnn, zero_division=0),
    'Recall'   : recall_score(y_test, y_pred_cnn, zero_division=0),
    'F1-Score' : f1_score(y_test, y_pred_cnn, zero_division=0),
    'MCC'      : matthews_corrcoef(y_test, y_pred_cnn),
    'Kappa'    : cohen_kappa_score(y_test, y_pred_cnn),
    'ROC-AUC'  : roc_auc_score(y_test, y_prob_cnn),
    'y_pred'   : y_pred_cnn,
    'y_prob'   : y_prob_cnn
}
print(f"\nDeep CNN Accuracy  : {cnn_results['Accuracy']:.4f}")
print(f"Deep CNN F1-Score  : {cnn_results['F1-Score']:.4f}")
print(f"Deep CNN ROC-AUC   : {cnn_results['ROC-AUC']:.4f}")
print("✅ Deep CNN done.\n")


# =============================================================================
# STEP 8 — RESULTS TABLE (Table 2 in paper)
# =============================================================================
print("=" * 60)
print("STEP 8: Final Results Summary (Table 2)")
print("=" * 60)

results_table = pd.DataFrame([
    {k: v for k, v in soft_results.items() if k not in ['y_pred','y_prob','model']},
    {k: v for k, v in hard_results.items() if k not in ['y_pred','y_prob','model']},
    {k: v for k, v in cnn_results.items()  if k not in ['y_pred','y_prob']},
])
results_table = results_table.set_index('Model').round(4)
print("\n", results_table.to_string())
results_table.to_csv("table2_model_comparison.csv")
print("\n✅ Results saved to table2_model_comparison.csv\n")


# =============================================================================
# STEP 9 — CONFUSION MATRICES (Fig. 5 in paper)
# =============================================================================
print("=" * 60)
print("STEP 9: Confusion Matrices (Fig. 5)")
print("=" * 60)

fig, axes = plt.subplots(1, 3, figsize=(15, 4))
models_for_cm = [
    ("Voting (Soft)", soft_results['y_pred']),
    ("Voting (Hard)", hard_results['y_pred']),
    ("Deep CNN",      cnn_results['y_pred']),
]
for ax, (name, y_pred) in zip(axes, models_for_cm):
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm,
                                  display_labels=['No (0)', 'Yes (1)'])
    disp.plot(ax=ax, colorbar=False, cmap='Blues')
    ax.set_title(f"Confusion Matrix\n{name}")

plt.tight_layout()
plt.savefig("fig5_confusion_matrices.png", dpi=150)
#plt.show()  # disabled: plots saved as PNG files
print("✅ Confusion matrices saved.\n")


# =============================================================================
# STEP 10 — ROC-AUC CURVES (Fig. 6 & 7 in paper)
# =============================================================================
print("=" * 60)
print("STEP 10: ROC-AUC Curves (Fig. 6 & 7)")
print("=" * 60)

# --- Fig. 6: ROC for all 7 base classifiers + voting ---
plt.figure(figsize=(9, 6))
colors = ['blue','green','red','purple','orange','brown','pink']

for (name, estimator), color in zip(base_estimators, colors):
    estimator.fit(X_train, y_train)
    prob = estimator.predict_proba(X_test)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, prob)
    auc = roc_auc_score(y_test, prob)
    plt.plot(fpr, tpr, color=color,
             label=f"{name.upper()} (AUC = {auc:.2f})")

fpr, tpr, _ = roc_curve(y_test, soft_results['y_prob'])
auc = roc_auc_score(y_test, soft_results['y_prob'])
plt.plot(fpr, tpr, 'k--', linewidth=2,
         label=f"Voting Classifier (AUC = {auc:.2f})")

plt.plot([0, 1], [0, 1], 'gray', linestyle=':')
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC-AUC Curve for All Classifiers")
plt.legend(fontsize=8, loc='lower right')
plt.tight_layout()
plt.savefig("fig6_roc_all_classifiers.png", dpi=150)
#plt.show()  # disabled: plots saved as PNG files

# --- Fig. 7: ROC for Deep CNN ---
plt.figure(figsize=(7, 5))
fpr, tpr, _ = roc_curve(y_test, cnn_results['y_prob'])
auc = roc_auc_score(y_test, cnn_results['y_prob'])
plt.plot(fpr, tpr, 'b-', linewidth=2, label=f"Class 1 (AUC = {auc:.2f})")
plt.plot([0, 1], [0, 1], 'gray', linestyle=':')
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve for Deep CNN Model")
plt.legend()
plt.tight_layout()
plt.savefig("fig7_roc_deep_cnn.png", dpi=150)
#plt.show()  # disabled: plots saved as PNG files

print("✅ ROC curves saved.\n")

# =============================================================================
# STEP 11 — EXPLAINABLE AI (SHAP)
# =============================================================================
print("=" * 60)
print("STEP 11: Explainable AI (SHAP Visualization)")
print("=" * 60)

try:
    import shap
    print("Running SHAP Analysis on XGBoost Model...")
    
    # Train a dedicated XGBoost model on the final selected features for clean explanation
    xgb_explainer_model = xgb.XGBClassifier(eval_metric='logloss', random_state=42)
    xgb_explainer_model.fit(X_train, y_train)
    
    # Initialize the SHAP TreeExplainer
    explainer = shap.TreeExplainer(xgb_explainer_model)
    shap_values = explainer.shap_values(X_test)
    
    # Generate the Summary Plot
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_test, show=False) # show=False prevents GUI popups
    plt.title("SHAP Summary Plot: Feature Impact on Predictions")
    plt.tight_layout()
    plt.savefig("fig8_shap_summary.png", dpi=150, bbox_inches='tight')
    plt.clf() # Clear the figure from memory
    
    print("✅ SHAP analysis complete. Saved as fig8_shap_summary.png\n")

except ImportError:
    print("⚠️ SHAP library not installed. Run: pip install shap in your terminal.\n")
    
# =============================================================================
# STEP 12 — EXPLAINABLE AI (LIME)
# =============================================================================
print("=" * 60)
print("STEP 12: Explainable AI (LIME Local Explanation)")
print("=" * 60)

try:
    import lime
    import lime.lime_tabular

    print("Running LIME Analysis on a sample patient...")
    
    # 1. Initialize the LIME Explainer using your training data
    explainer_lime = lime.lime_tabular.LimeTabularExplainer(
        training_data=np.array(X_train),
        feature_names=X_train.columns.tolist(),
        class_names=['Normal (0)', 'Recurred (1)'],
        mode='classification',
        random_state=42
    )
    
    # 2. Pick a single patient from your test set (e.g., the very first one at index 0)
    patient_data = X_test.iloc[0]
    true_label = y_test.iloc[0]
    
    # 3. Explain the prediction made by your Soft Voting Classifier
    exp = explainer_lime.explain_instance(
        data_row=patient_data.values,
        predict_fn=voting_soft.predict_proba
    )
    
    # 4. Save the explanation as a PNG image
    fig = exp.as_pyplot_figure()
    plt.title(f"LIME Explanation for Patient #1 (True Label: {true_label})", pad=20)
    plt.tight_layout()
    plt.savefig("fig9_lime_patient.png", dpi=150, bbox_inches='tight')
    plt.clf() # Clear the figure from memory

    # 5. Save as an Interactive HTML file (Highly recommended for your UI later!)
    # exp.save_to_file("fig9_lime_patient.html")
    
    print("✅ LIME analysis complete. Saved as fig9_lime_patient.png and .html\n")

except ImportError:
    print("⚠️ LIME library not installed. Run: pip install lime in your terminal.\n")

# =============================================================================
# =============================================================================
# =============================================================================
print("=" * 60)
print("🎉  PIPELINE COMPLETE!")
print("=" * 60)
print("\nGenerated Output Files:")
print("  📊 fig2_dataset_distribution.png")
print("  📊 fig3_feature_importance.png")
print("  📊 fig4_cnn_training_curves.png")
print("  📊 fig5_confusion_matrices.png")
print("  📊 fig6_roc_all_classifiers.png")
print("  📊 fig7_roc_deep_cnn.png")
print("  📊 fig8_shap_summary.png")
print("  📊 fig9_lime_patient.png")   # <--- Added LIME PNG
# print("  🌐 fig9_lime_patient.html")  # <--- Added LIME HTML
print("  📄 table1_lazy_classifiers.csv")
print("  📄 table2_model_comparison.csv")
