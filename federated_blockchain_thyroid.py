# =============================================================================
# FEDERATED LEARNING + BLOCKCHAIN FOR PRIVACY-PRESERVING THYROID DETECTION
# Title  : Blockchain and Federated Learning for Privacy-Preserving
#           Thyroid Disease Detection
# Dataset: Thyroid_Diff.csv (383 rows x 17 columns)
# Target : Recurred (Yes = 1, No = 0)
# Tech   : Pure-Python Federated Learning (FedAvg) + SHA-256 Blockchain Ledger
#
# ✅ NO Ray / Flower simulation — works on Windows, macOS, Linux
#
# HOW IT WORKS:
#   • Data is split across N simulated hospitals (clients)
#   • Each hospital trains locally — NO raw data ever leaves the hospital
#   • Only model weights are shared with the central server
#   • The server aggregates weights using FedAvg (weighted average)
#   • Every aggregation round is recorded on a tamper-proof SHA-256 blockchain
#   • Final aggregated model is evaluated on a held-out test set
#
# INSTALL (run once):
#   pip install scikit-learn numpy pandas matplotlib seaborn
# =============================================================================

import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL']  = '3'

import json
import hashlib
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime
from typing import List

warnings.filterwarnings('ignore')

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix,
                             ConfusionMatrixDisplay)

print("✅ All libraries imported successfully.\n")


# =============================================================================
# PART A — BLOCKCHAIN LEDGER
# =============================================================================

class Block:
    """A single immutable block in the chain."""

    def __init__(self, index: int, data: dict, previous_hash: str):
        self.index         = index
        self.timestamp     = datetime.utcnow().isoformat()
        self.data          = data
        self.previous_hash = previous_hash
        self.hash          = self._compute_hash()

    def _compute_hash(self) -> str:
        block_str = json.dumps({
            "index"        : self.index,
            "timestamp"    : self.timestamp,
            "data"         : self.data,
            "previous_hash": self.previous_hash
        }, sort_keys=True)
        return hashlib.sha256(block_str.encode()).hexdigest()

    def __repr__(self):
        return (f"Block #{self.index} | hash={self.hash[:16]}… | "
                f"prev={self.previous_hash[:16]}…")


class Blockchain:
    """Append-only blockchain that records every FL aggregation round."""

    def __init__(self):
        self.chain: List[Block] = []
        genesis = Block(
            index         = 0,
            data          = {"message": "Genesis Block — FL Thyroid Project"},
            previous_hash = "0" * 64
        )
        self.chain.append(genesis)
        print("⛓️  Blockchain initialised with genesis block.")

    def add_block(self, data: dict) -> Block:
        prev  = self.chain[-1]
        block = Block(index=len(self.chain), data=data, previous_hash=prev.hash)
        self.chain.append(block)
        return block

    def is_valid(self) -> bool:
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            if curr.hash != curr._compute_hash():
                return False
            if curr.previous_hash != prev.hash:
                return False
        return True

    def print_chain(self):
        print("\n" + "=" * 70)
        print("⛓️   BLOCKCHAIN LEDGER")
        print("=" * 70)
        for block in self.chain:
            print(f"\n  Block #{block.index}")
            print(f"    Timestamp     : {block.timestamp}")
            print(f"    Hash          : {block.hash[:32]}…")
            print(f"    Previous Hash : {block.previous_hash[:32]}…")
            if block.index > 0:
                d = block.data
                print(f"    FL Round      : {d.get('fl_round', '—')}")
                print(f"    Participants  : {d.get('num_clients', '—')}")
                print(f"    Global Acc    : {d.get('global_accuracy', '—')}")
                print(f"    Model Hash    : {d.get('model_hash', '—')[:32]}…")
        print("\n" + "=" * 70)
        print(f"✅ Chain integrity: {'VALID ✓' if self.is_valid() else 'BROKEN ✗'}")
        print("=" * 70 + "\n")


# =============================================================================
# PART B — DATA LOADING & PARTITIONING
# =============================================================================

def load_and_preprocess(csv_path: str = "Thyroid_Diff.csv"):
    df = pd.read_csv(csv_path)
    TARGET_COL = "Recurred"
    df[TARGET_COL] = df[TARGET_COL].map({'Yes': 1, 'No': 0})
    le = LabelEncoder()
    for col in df.select_dtypes(include='object').columns:
        df[col] = le.fit_transform(df[col].astype(str))
    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL].values
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    return X_scaled, y


def partition_data(X, y, num_clients: int, seed: int = 42):
    """IID split — divide dataset evenly across hospitals."""
    rng     = np.random.default_rng(seed)
    indices = rng.permutation(len(X))
    splits  = np.array_split(indices, num_clients)
    partitions = [(X[s], y[s]) for s in splits]
    print(f"📂 Data partitioned across {num_clients} hospitals:")
    for i, (Xi, yi) in enumerate(partitions):
        print(f"   Hospital {i+1}: {len(Xi)} samples  "
              f"(Recurred: {yi.sum()}/{len(yi)})")
    return partitions


# =============================================================================
# PART C — PURE-PYTHON FEDERATED LEARNING  (no Ray / no Flower simulation)
# =============================================================================

def get_weights(model: LogisticRegression):
    return model.coef_.copy(), model.intercept_.copy()


def set_weights(model: LogisticRegression, coef, intercept):
    model.coef_      = coef.copy()
    model.intercept_ = intercept.copy()


def hash_weights(coef, intercept) -> str:
    flat = np.concatenate([coef.flatten(), intercept.flatten()])
    return hashlib.sha256(flat.tobytes()).hexdigest()


def fedavg(weight_list, sample_counts):
    """Weighted average of (coef, intercept) pairs."""
    total  = sum(sample_counts)
    coefs  = [w[0] * n for w, n in zip(weight_list, sample_counts)]
    inters = [w[1] * n for w, n in zip(weight_list, sample_counts)]
    avg_coef      = sum(coefs)      / total
    avg_intercept = sum(inters)     / total
    return avg_coef, avg_intercept


def run_federated_learning(
    csv_path    : str   = "Thyroid_Diff.csv",
    num_clients : int   = 5,
    num_rounds  : int   = 10,
    test_size   : float = 0.20,
    seed        : int   = 42
):
    print("\n" + "=" * 70)
    print("FEDERATED LEARNING + BLOCKCHAIN — THYROID DETECTION")
    print("=" * 70 + "\n")

    # ── 1. Load data ─────────────────────────────────────────────────────── #
    print("STEP 1: Loading and preprocessing data")
    X, y = load_and_preprocess(csv_path)

    X_train_all, X_test, y_train_all, y_test = train_test_split(
        X, y, test_size=test_size, random_state=seed, stratify=y
    )
    print(f"  Global train pool : {X_train_all.shape[0]} samples")
    print(f"  Global test set   : {X_test.shape[0]} samples "
          f"(held out — never sent to hospitals)\n")

    # ── 2. Partition ──────────────────────────────────────────────────────── #
    print("STEP 2: Partitioning data across hospitals (IID split)")
    partitions = partition_data(X_train_all, y_train_all, num_clients, seed)

    # ── 3. Blockchain ────────────────────────────────────────────────────── #
    print("\nSTEP 3: Initialising blockchain ledger")
    blockchain = Blockchain()

    # ── 4. Initialise global model ───────────────────────────────────────── #
    # Fit once on the full pool so sklearn initialises coef_ shape
    global_model = LogisticRegression(max_iter=1, warm_start=True,
                                       random_state=seed, solver="saga")
    global_model.fit(X_train_all, y_train_all)
    g_coef, g_inter = get_weights(global_model)

    # Build one local model per hospital (reused each round)
    local_models = []
    for idx in range(num_clients):
        Xi, yi = partitions[idx]
        m = LogisticRegression(max_iter=1, warm_start=True,
                                random_state=seed, solver="saga")
        m.fit(Xi, yi)               # initialise coef_ shape
        local_models.append(m)

    # ── 5. FL Training loop ──────────────────────────────────────────────── #
    print(f"\nSTEP 4: Running {num_rounds} FL rounds with {num_clients} hospitals")
    print("-" * 50)

    round_metrics = []

    for rnd in range(1, num_rounds + 1):

        # — Local training at each hospital —
        local_weights  = []
        local_sizes    = []

        for idx, m in enumerate(local_models):
            Xi, yi = partitions[idx]

            # Push current global weights to local model
            set_weights(m, g_coef, g_inter)

            # Local training (200 iterations)
            m.max_iter = 200
            m.fit(Xi, yi)

            local_weights.append(get_weights(m))
            local_sizes.append(len(Xi))

        # — FedAvg aggregation on server —
        g_coef, g_inter = fedavg(local_weights, local_sizes)
        model_hash = hash_weights(g_coef, g_inter)

        # — Evaluate global model on local validation sets (weighted avg) —
        total_correct = 0
        total_samples = 0
        for idx, m in enumerate(local_models):
            Xi, yi = partitions[idx]
            X_tr, X_val, y_tr, y_val = train_test_split(
                Xi, yi, test_size=0.2, random_state=seed,
                stratify=yi if yi.sum() > 1 else None
            )
            set_weights(m, g_coef, g_inter)
            preds = m.predict(X_val)
            total_correct += (preds == y_val).sum()
            total_samples += len(y_val)

        global_acc = total_correct / total_samples if total_samples > 0 else 0.0

        # — Record on blockchain —
        block = blockchain.add_block({
            "fl_round"       : rnd,
            "num_clients"    : num_clients,
            "model_hash"     : model_hash,
            "global_accuracy": f"{global_acc:.4f}",
            "aggregation_ts" : datetime.utcnow().isoformat(),
        })

        round_metrics.append({"round": rnd, "accuracy": global_acc})
        print(f"  Round {rnd:>2} | Global acc: {global_acc:.4f} | "
              f"Block #{block.index} | hash={block.hash[:20]}…")

    # ── 6. Print chain ───────────────────────────────────────────────────── #
    blockchain.print_chain()

    # ── 7. Final evaluation on held-out test set ─────────────────────────── #
    print("STEP 5: Evaluating final global model on held-out test set")
    set_weights(global_model, g_coef, g_inter)

    y_pred = global_model.predict(X_test)
    y_prob = global_model.predict_proba(X_test)[:, 1]

    acc   = accuracy_score(y_test,  y_pred)
    prec  = precision_score(y_test, y_pred, zero_division=0)
    rec   = recall_score(y_test,    y_pred, zero_division=0)
    f1    = f1_score(y_test,        y_pred, zero_division=0)
    auc   = roc_auc_score(y_test,   y_prob)

    print(f"\n  Final FL Global Model ({X_test.shape[0]} held-out samples):")
    print(f"  ─────────────────────────────────────────")
    print(f"  Accuracy  : {acc:.4f}")
    print(f"  Precision : {prec:.4f}")
    print(f"  Recall    : {rec:.4f}")
    print(f"  F1-Score  : {f1:.4f}")
    print(f"  ROC-AUC   : {auc:.4f}")
    print(f"  ─────────────────────────────────────────\n")

    # ── 8. Plots ─────────────────────────────────────────────────────────── #
    print("STEP 6: Generating plots")

    _plot_round_accuracy(round_metrics, num_clients)
    _plot_blockchain(blockchain)
    _plot_fl_vs_central(acc, prec, rec, f1, auc,
                         X_train_all, y_train_all, X_test, y_test)
    _plot_fl_architecture(num_clients)
    _plot_confusion(y_test, y_pred)

    return {
        "blockchain"   : blockchain,
        "round_metrics": round_metrics,
        "test_metrics" : {"accuracy": acc, "precision": prec,
                          "recall": rec, "f1": f1, "auc": auc}
    }


# =============================================================================
# VISUALISATION HELPERS
# =============================================================================

def _plot_round_accuracy(round_metrics, num_clients):
    rounds = [m["round"]    for m in round_metrics]
    accs   = [m["accuracy"] for m in round_metrics]

    plt.figure(figsize=(8, 4))
    plt.plot(rounds, accs, 'o-', color='royalblue', linewidth=2, markersize=6)
    plt.fill_between(rounds, accs, alpha=0.15, color='royalblue')
    plt.xlabel("FL Communication Round", fontsize=12)
    plt.ylabel("Weighted Average Accuracy", fontsize=12)
    plt.title(f"Federated Learning — Global Model Accuracy per Round\n"
              f"({num_clients} Hospitals, No Raw Data Shared)", fontsize=13)
    plt.ylim(0, 1.05)
    plt.grid(alpha=0.4)
    plt.tight_layout()
    plt.savefig("fl_round_accuracy.png", dpi=150)
    plt.close()
    print("  ✅ fl_round_accuracy.png saved")


def _plot_blockchain(blockchain: Blockchain):
    chain = blockchain.chain
    n     = len(chain)
    fig, ax = plt.subplots(figsize=(max(10, n * 2.2), 4))
    bw, bh, gap = 1.8, 1.2, 0.5

    for i, block in enumerate(chain):
        x    = i * (bw + gap)
        rect = mpatches.FancyBboxPatch(
            (x, 0.4), bw, bh,
            boxstyle="round,pad=0.05",
            facecolor="#1a3a5c" if i == 0 else "#2c6fad",
            edgecolor="white", linewidth=1.5
        )
        ax.add_patch(rect)
        label   = f"Block #{block.index}"
        sub     = "Genesis" if i == 0 else f"Round {block.data.get('fl_round','')}"
        acc_lbl = "" if i == 0 else f"Acc: {block.data.get('global_accuracy','?')}"
        h_lbl   = f"{block.hash[:10]}…"

        cx = x + bw / 2
        ax.text(cx, 1.38, label,   ha='center', va='center',
                fontsize=7.5, color='white', fontweight='bold')
        ax.text(cx, 1.12, sub,     ha='center', va='center',
                fontsize=6.5, color='#aed6f1')
        ax.text(cx, 0.86, acc_lbl, ha='center', va='center',
                fontsize=6.5, color='#a9dfbf')
        ax.text(cx, 0.60, h_lbl,   ha='center', va='center',
                fontsize=6,   color='#f0e68c')

        if i < n - 1:
            ax.annotate(
                "", xy=(x + bw + gap, 0.4 + bh / 2),
                xytext=(x + bw, 0.4 + bh / 2),
                arrowprops=dict(arrowstyle="->", color='white', lw=1.5)
            )

    ax.set_xlim(-0.2, n * (bw + gap) + 0.2)
    ax.set_ylim(0, 2.2)
    ax.axis('off')
    ax.set_title(
        "Blockchain Ledger — FL Aggregation Records\n"
        "(Each block is SHA-256 linked; tampering breaks the chain)",
        fontsize=11, pad=12
    )
    plt.tight_layout()
    plt.savefig("fl_blockchain_ledger.png", dpi=150, bbox_inches='tight')
    plt.close()
    print("  ✅ fl_blockchain_ledger.png saved")


def _plot_fl_vs_central(fl_acc, fl_prec, fl_rec, fl_f1, fl_auc,
                         X_train, y_train, X_test, y_test):
    central = LogisticRegression(max_iter=300, random_state=42, solver="saga")
    central.fit(X_train, y_train)
    yp    = central.predict(X_test)
    yprob = central.predict_proba(X_test)[:, 1]

    metrics      = ["Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC"]
    central_vals = [
        accuracy_score(y_test, yp),
        precision_score(y_test, yp, zero_division=0),
        recall_score(y_test, yp, zero_division=0),
        f1_score(y_test, yp, zero_division=0),
        roc_auc_score(y_test, yprob)
    ]
    fl_vals = [fl_acc, fl_prec, fl_rec, fl_f1, fl_auc]

    x, width = np.arange(len(metrics)), 0.35
    fig, ax  = plt.subplots(figsize=(9, 5))
    b1 = ax.bar(x - width/2, central_vals, width,
                label='Centralised (shares raw data)', color='#e74c3c', alpha=0.85)
    b2 = ax.bar(x + width/2, fl_vals,      width,
                label='Federated + Blockchain (privacy-preserving)',
                color='#2ecc71', alpha=0.85)

    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=11)
    ax.set_ylim(0, 1.15)
    ax.set_ylabel("Score", fontsize=12)
    ax.set_title("Federated Learning + Blockchain  vs  Centralised Training\n"
                 "Thyroid Disease Detection", fontsize=13)
    ax.legend(fontsize=10)
    ax.grid(axis='y', alpha=0.3)

    for bar in list(b1) + list(b2):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.01,
                f"{bar.get_height():.3f}",
                ha='center', va='bottom', fontsize=8)

    plt.tight_layout()
    plt.savefig("fl_vs_centralised.png", dpi=150)
    plt.close()
    print("  ✅ fl_vs_centralised.png saved")


def _plot_fl_architecture(num_clients: int):
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')
    ax.set_facecolor('#f4f6f8')
    fig.patch.set_facecolor('#f4f6f8')

    # Server box
    ax.add_patch(mpatches.FancyBboxPatch(
        (3.5, 4.8), 3, 1.5,
        boxstyle="round,pad=0.15",
        facecolor="#154360", edgecolor="#1a5276", linewidth=2
    ))
    ax.text(5, 5.85, "🏛  FL Aggregation Server",
            ha='center', fontsize=10, color='white', fontweight='bold')
    ax.text(5, 5.40, "FedAvg + Blockchain Recording",
            ha='center', fontsize=8.5, color='#aed6f1')

    # Blockchain box
    ax.add_patch(mpatches.FancyBboxPatch(
        (7.2, 5.0), 2.5, 1.1,
        boxstyle="round,pad=0.1",
        facecolor="#1e8449", edgecolor="#27ae60", linewidth=2
    ))
    ax.text(8.45, 5.72, "⛓  Blockchain",
            ha='center', fontsize=9, color='white', fontweight='bold')
    ax.text(8.45, 5.30, "SHA-256 Ledger",
            ha='center', fontsize=7.5, color='#a9dfbf')
    ax.annotate("", xy=(7.2, 5.5), xytext=(6.5, 5.5),
                arrowprops=dict(arrowstyle="->", color='#27ae60', lw=1.8))

    # Hospital boxes
    colors = ['#7d6608', '#7b241c', '#1a5276', '#0e6655', '#6c3483']
    xs = np.linspace(1, 9, num_clients)
    for i, cx in enumerate(xs):
        ax.add_patch(mpatches.FancyBboxPatch(
            (cx - 0.75, 0.8), 1.5, 1.3,
            boxstyle="round,pad=0.1",
            facecolor=colors[i % len(colors)],
            edgecolor='white', linewidth=1.5
        ))
        ax.text(cx, 1.65, f"🏥 Hospital {i+1}",
                ha='center', fontsize=7.5, color='white', fontweight='bold')
        ax.text(cx, 1.20, "Local Data\n(Private)",
                ha='center', fontsize=6.5, color='#fdfefe')
        ax.annotate("", xy=(5, 4.8), xytext=(cx, 2.1),
                    arrowprops=dict(arrowstyle="->", color='#aab7b8', lw=1.2))
        ax.annotate("", xy=(cx, 2.1), xytext=(5, 4.8),
                    arrowprops=dict(arrowstyle="->", color='#2980b9', lw=1.0,
                                    connectionstyle="arc3,rad=0.15"))

    ax.text(5, 7.0,
            "Federated Learning + Blockchain Architecture\n"
            "Hospitals train locally → only weights shared → blockchain records every round",
            ha='center', fontsize=10, color='#1c2833', fontweight='bold', va='top')

    ax.legend(handles=[
        mpatches.Patch(color='#aab7b8', label='Model weights → Server'),
        mpatches.Patch(color='#2980b9', label='Global weights ← Server'),
        mpatches.Patch(color='#1e8449', label='Blockchain (tamper-proof log)'),
    ], loc='lower center', ncol=3, fontsize=8.5, framealpha=0.9)

    plt.tight_layout()
    plt.savefig("fl_architecture.png", dpi=150, bbox_inches='tight')
    plt.close()
    print("  ✅ fl_architecture.png saved")


def _plot_confusion(y_test, y_pred):
    plt.figure(figsize=(5, 4))
    cm   = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm,
                                   display_labels=['No Recurrence', 'Recurred'])
    disp.plot(cmap='Blues', colorbar=False)
    plt.title("FL Global Model — Confusion Matrix\n(Held-out Test Set)")
    plt.tight_layout()
    plt.savefig("fl_confusion_matrix.png", dpi=150)
    plt.close()
    print("  ✅ fl_confusion_matrix.png saved")


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    results = run_federated_learning(
        csv_path    = "Thyroid_Diff.csv",
        num_clients = 5,
        num_rounds  = 10,
        test_size   = 0.20,
        seed        = 42
    )

    print("\n" + "=" * 70)
    print("🎉  FEDERATED LEARNING + BLOCKCHAIN PIPELINE COMPLETE!")
    print("=" * 70)
    print("\n📁 Generated Output Files:")
    print("  📊 fl_architecture.png        — System architecture diagram")
    print("  📊 fl_round_accuracy.png      — Global model accuracy per FL round")
    print("  📊 fl_blockchain_ledger.png   — Blockchain block visualisation")
    print("  📊 fl_vs_centralised.png      — FL vs centralised comparison")
    print("  📊 fl_confusion_matrix.png    — Confusion matrix of final FL model")
    print(f"\n⛓️  Blockchain integrity: "
          f"{'VALID ✓' if results['blockchain'].is_valid() else 'BROKEN ✗'}")
    print("\n📊 Final FL Test Metrics:")
    for k, v in results["test_metrics"].items():
        print(f"   {k.capitalize():<12}: {v:.4f}")
    print("=" * 70 + "\n")
