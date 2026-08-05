# =============================================================================
# RUN ALL — THYROID DETECTION PROJECT
# =============================================================================
# Just run:  python run_all.py
#
# This script runs both pipelines in sequence:
#   1. thyroid_pipeline.py      — Original ML pipeline (Voting + Deep CNN)
#   2. federated_blockchain_thyroid.py — FL + Blockchain extension
#
# All output figures and CSV tables are saved to the current folder.
# =============================================================================

import subprocess
import sys
import os

CYAN  = "\033[96m"
GREEN = "\033[92m"
RED   = "\033[91m"
BOLD  = "\033[1m"
RESET = "\033[0m"

def banner(title):
    line = "=" * 70
    print(f"\n{CYAN}{BOLD}{line}{RESET}")
    print(f"{CYAN}{BOLD}  {title}{RESET}")
    print(f"{CYAN}{BOLD}{line}{RESET}\n")

def run_script(path, label):
    banner(label)
    result = subprocess.run(
        [sys.executable, path],
        capture_output=False   # let output stream live to terminal
    )
    if result.returncode != 0:
        print(f"\n{RED}❌ {label} failed (exit code {result.returncode}){RESET}")
        sys.exit(result.returncode)
    print(f"\n{GREEN}✅ {label} finished successfully.{RESET}")

# ── Check CSV is present ────────────────────────────────────────────────── #
if not os.path.exists("Thyroid_Diff.csv"):
    print(f"{RED}ERROR: Thyroid_Diff.csv not found in the current directory.{RESET}")
    print("Place Thyroid_Diff.csv next to run_all.py and try again.")
    sys.exit(1)

# ── Pipeline 1: Original ────────────────────────────────────────────────── #
run_script("thyroid_pipeline.py",
           "PIPELINE 1 — Original: Voting Classifier + Deep CNN")

# ── Pipeline 2: FL + Blockchain ─────────────────────────────────────────── #
run_script("federated_blockchain_thyroid.py",
           "PIPELINE 2 — Federated Learning + Blockchain")

# ── Final summary ───────────────────────────────────────────────────────── #
banner("ALL DONE — OUTPUT FILES GENERATED")
outputs = [
    # Original pipeline outputs
    ("fig2_dataset_distribution.png",   "Dataset distribution pie chart"),
    ("fig3_feature_importance.png",     "Feature importance bar chart"),
    ("fig4_cnn_training_curves.png",    "CNN training & validation curves"),
    ("fig5_confusion_matrices.png",     "Confusion matrices (Voting + CNN)"),
    ("fig6_roc_all_classifiers.png",    "ROC curves — all base classifiers"),
    ("fig7_roc_deep_cnn.png",           "ROC curve — Deep CNN"),
    ("table1_lazy_classifiers.csv",     "LazyPredict results (27 models)"),
    ("table2_model_comparison.csv",     "Voting vs CNN comparison table"),
    # FL + Blockchain outputs
    ("fl_architecture.png",             "FL + Blockchain system architecture"),
    ("fl_round_accuracy.png",           "Global accuracy per FL round"),
    ("fl_blockchain_ledger.png",        "Blockchain ledger visualisation"),
    ("fl_vs_centralised.png",           "FL vs Centralised comparison"),
    ("fl_confusion_matrix.png",         "FL global model confusion matrix"),
]

print(f"{'File':<45} {'Status':<8} Description")
print("-" * 90)
for fname, desc in outputs:
    exists = os.path.exists(fname)
    status = f"{GREEN}✓{RESET}" if exists else f"{RED}✗{RESET}"
    print(f"  {fname:<43} {status}      {desc}")

print(f"\n{GREEN}{BOLD}Project complete!{RESET}\n")
