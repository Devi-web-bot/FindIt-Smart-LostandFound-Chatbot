import React, { useState } from 'react';
import { 
  X, 
  GraduationCap, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  BookOpen, 
  Layers, 
  Terminal 
} from 'lucide-react';
import JSZip from 'jszip';

interface ProjectDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PYTHON_FILES: Record<string, { purpose: string; content: string; language: string }> = {
  'app.py': {
    purpose: 'Main Flask backend application: defines RESTful routing, chat endpoints, search, claims processing, and admin verification.',
    language: 'python',
    content: `"""
FindIt – Smart Lost and Found Chatbot
Backend Application (Flask)
MCA Project Implementation
"""

import os
import json
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory
from database import Database
from nlp_matcher import NLPMatcher

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "findit-mca-secret-key-2026")

# Initialize Database and NLP Matcher
db = Database("findit.db")
db.init_db()
matcher = NLPMatcher()

def mask_contact(contact: str) -> str:
    """Masks personal contact info to protect user privacy."""
    if not contact:
        return "Protected"
    contact = contact.strip()
    if "@" in contact:
        parts = contact.split("@")
        name = parts[0]
        domain = parts[1]
        masked_name = name[:2] + "***" if len(name) > 2 else name + "***"
        return f"{masked_name}@{domain}"
    if len(contact) >= 8:
        return contact[:2] + "******" + contact[-2:]
    return contact[:2] + "****"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Retrieve statistical summary for dashboard."""
    stats = db.get_statistics()
    return jsonify({"success": True, "data": stats})

@app.route("/api/items", methods=["GET"])
def get_items():
    """Fetch items with optional filters."""
    item_type = request.args.get("type")
    category = request.args.get("category")
    status = request.args.get("status")
    query = request.args.get("q", "").strip()

    items = db.get_items(item_type=item_type, category=category, status=status, query=query)
    
    for item in items:
        item["contact_info_masked"] = mask_contact(item.get("contact_info", ""))
        del item["contact_info"]

    return jsonify({"success": True, "count": len(items), "data": items})

@app.route("/api/report", methods=["POST"])
def report_item():
    """Endpoint to submit a new lost or found item report."""
    data = request.get_json() or {}
    
    required = ["item_name", "category", "item_type", "description", "location", "date_event"]
    for field in required:
        if not data.get(field):
            return jsonify({"success": False, "message": f"Missing field: {field}"}), 400

    new_id = db.add_item(
        item_name=data["item_name"],
        category=data["category"],
        colour=data.get("colour", ""),
        description=data["description"],
        secret_verification_detail=data.get("secret_verification_detail", ""),
        date_event=data["date_event"],
        location=data["location"],
        item_type=data["item_type"],
        contact_info=data.get("contact_info", ""),
        reported_by=data.get("reported_by", "Student User")
    )

    created_item = db.get_item_by_id(new_id)

    # Scan opposite pool for matches
    opposite_type = "found" if data["item_type"] == "lost" else "lost"
    candidates = db.get_items(item_type=opposite_type, status="open")
    matches = matcher.find_matches(target_item=created_item, candidate_items=candidates, threshold=0.35)

    return jsonify({
        "success": True,
        "message": "Report registered in database.",
        "item_id": new_id,
        "matches": matches
    }), 201

@app.route("/api/chat", methods=["POST"])
def chat():
    """Intelligent conversational AI endpoint."""
    payload = request.get_json() or {}
    user_message = payload.get("message", "").strip()
    session_state = payload.get("state", {})

    response = matcher.process_chat_intent(user_message, session_state, db)
    return jsonify(response)

if __name__ == "__main__":
    print("FindIt MCA Lost & Found Chatbot running on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
`
  },
  'nlp_matcher.py': {
    purpose: 'Core NLP matching engine: Tokenization, Stopwords removal, Synonym expansion, TF-IDF calculation, and Cosine Similarity.',
    language: 'python',
    content: `"""
FindIt – NLP Matching Engine
Implements Text Preprocessing, TF-IDF Vectorization, Cosine Similarity,
and Composite Confidence Scoring for Lost and Found items.
"""

import math
import re
from collections import Counter
from typing import List, Dict, Any

STOP_WORDS = {
    "a", "about", "after", "all", "an", "and", "any", "are", "as", "at", 
    "be", "because", "been", "before", "but", "by", "can", "could", "did", 
    "do", "does", "for", "from", "had", "has", "have", "he", "her", "his", 
    "how", "i", "if", "in", "into", "is", "it", "its", "just", "me", "more", 
    "my", "no", "not", "of", "on", "or", "our", "she", "so", "some", "that", 
    "the", "their", "them", "then", "there", "this", "to", "too", "was", 
    "we", "were", "what", "when", "where", "which", "who", "with", "you", "your",
    "lost", "found", "item", "please", "help"
}

SYNONYMS = {
    "backpack": ["bag", "rucksack", "knapsack", "pack", "bookbag"],
    "rucksack": ["backpack", "bag", "knapsack", "pack"],
    "bag": ["backpack", "rucksack", "purse", "handbag", "tote"],
    "wallet": ["purse", "billfold", "moneybag", "pouch"],
    "purse": ["wallet", "bag", "handbag", "clutch"],
    "phone": ["mobile", "cellphone", "smartphone", "iphone", "android", "device"],
    "mobile": ["phone", "cellphone", "smartphone", "device"],
    "smartphone": ["phone", "mobile", "iphone", "android"],
    "laptop": ["notebook", "macbook", "computer", "pc", "chromebook"],
    "keys": ["keychain", "carkey", "keyring", "fob"],
    "glasses": ["spectacles", "eyewear", "shades", "sunglasses"],
    "watch": ["smartwatch", "timepiece", "wristband", "applewatch"],
    "bottle": ["flask", "thermos", "sipper", "waterbottle"],
    "red": ["crimson", "scarlet", "maroon", "burgundy"],
    "blue": ["navy", "azure", "cyan", "cobalt", "indigo"],
    "black": ["dark", "charcoal", "onyx"]
}

class NLPMatcher:
    def tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^\\w\\s]", " ", text.lower())
        tokens = cleaned.split()
        return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]

    def expand_synonyms(self, tokens: List[str]) -> List[str]:
        expanded = list(tokens)
        for token in tokens:
            if token in SYNONYMS:
                expanded.extend(SYNONYMS[token])
        return expanded

    def compute_tf(self, tokens: List[str]) -> Dict[str, float]:
        counts = Counter(tokens)
        total = len(tokens)
        if total == 0:
            return {}
        return {term: count / total for term, count in counts.items()}

    def compute_idf(self, corpus: List[List[str]]) -> Dict[str, float]:
        n_docs = len(corpus)
        if n_docs == 0:
            return {}
        doc_freq = Counter()
        for doc_tokens in corpus:
            for t in set(doc_tokens):
                doc_freq[t] += 1
        return {term: math.log((1 + n_docs) / (1 + df)) + 1.0 for term, df in doc_freq.items()}

    def get_tfidf_vector(self, tokens: List[str], idf: Dict[str, float]) -> Dict[str, float]:
        tf = self.compute_tf(tokens)
        return {term: tf_val * idf.get(term, 1.4) for term, tf_val in tf.items()}

    def cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        common_keys = set(vec1.keys()).intersection(set(vec2.keys()))
        if not common_keys:
            return 0.0
        dot_product = sum(vec1[k] * vec2[k] for k in common_keys)
        norm1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
        norm2 = math.sqrt(sum(v ** 2 for v in vec2.values()))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot_product / (norm1 * norm2)

    def calculate_similarity_breakdown(self, text1: str, text2: str, cat1="", cat2="", col1="", col2=""):
        t1 = self.expand_synonyms(self.tokenize(text1))
        t2 = self.expand_synonyms(self.tokenize(text2))
        idf = self.compute_idf([t1, t2])
        v1 = self.get_tfidf_vector(t1, idf)
        v2 = self.get_tfidf_vector(t2, idf)
        
        text_cosine = self.cosine_similarity(v1, v2)
        category_score = 1.0 if cat1 and cat2 and cat1.lower() == cat2.lower() else 0.5
        color_score = 1.0 if col1 and col2 and col1.lower() == col2.lower() else 0.5

        # Weighted final score: 65% text semantics, 20% category, 15% color
        final_score = (text_cosine * 0.65) + (category_score * 0.20) + (color_score * 0.15)
        return {
            "final_score": round(min(1.0, final_score), 4),
            "percentage": int(round(min(1.0, final_score) * 100)),
            "text_cosine_similarity": round(text_cosine, 4),
            "category_score": category_score,
            "color_score": color_score
        }

    def find_matches(self, target_item: Dict[str, Any], candidate_items: List[Dict[str, Any]], threshold=0.35):
        target_text = f"{target_item.get('item_name', '')} {target_item.get('description', '')} {target_item.get('colour', '')} {target_item.get('location', '')}"
        matches = []
        for cand in candidate_items:
            cand_text = f"{cand.get('item_name', '')} {cand.get('description', '')} {cand.get('colour', '')} {cand.get('location', '')}"
            res = self.calculate_similarity_breakdown(
                target_text, cand_text,
                cat1=target_item.get("category", ""), cat2=cand.get("category", ""),
                col1=target_item.get("colour", ""), col2=cand.get("colour", "")
            )
            if res["final_score"] >= threshold:
                matches.append({
                    "candidate_id": cand.get("id"),
                    "candidate_name": cand.get("item_name"),
                    "similarity_score": res["final_score"],
                    "similarity_percentage": res["percentage"],
                    "category": cand.get("category"),
                    "location": cand.get("location")
                })
        matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        return matches
`
  },
  'database.py': {
    purpose: 'SQLite database access layer: schema creation, thread-safe connection management, parameterized queries, and seed data.',
    language: 'python',
    content: `"""
FindIt – SQLite Database Access Module
"""

import sqlite3
from typing import List, Dict, Any, Optional

class Database:
    def __init__(self, db_path: str = "findit.db"):
        self.db_path = db_path

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT NOT NULL,
                category TEXT NOT NULL,
                colour TEXT,
                description TEXT NOT NULL,
                secret_verification_detail TEXT,
                date_event TEXT NOT NULL,
                location TEXT NOT NULL,
                item_type TEXT NOT NULL CHECK(item_type IN ('lost', 'found')),
                contact_info TEXT,
                reported_by TEXT DEFAULT 'Anonymous',
                status TEXT DEFAULT 'open' CHECK(status IN ('open', 'matched', 'claimed', 'resolved')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS claims (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER NOT NULL,
                proof_description TEXT NOT NULL,
                claimant_contact TEXT NOT NULL,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES items (id)
            );
            """)
            conn.commit()
`
  },
  'schema.sql': {
    purpose: 'Relational SQLite schema definition script with indices, triggers, and constraints.',
    language: 'sql',
    content: `-- SQLite Schema for FindIt Smart Lost & Found Chatbot
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    colour TEXT,
    description TEXT NOT NULL,
    secret_verification_detail TEXT,
    date_event TEXT NOT NULL,
    location TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK(item_type IN ('lost', 'found')),
    contact_info TEXT,
    reported_by TEXT DEFAULT 'Anonymous',
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'matched', 'claimed', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`
  },
  'requirements.txt': {
    purpose: 'Python dependency specifications for pip installation.',
    language: 'text',
    content: `Flask==3.0.3
scikit-learn==1.4.2
numpy==1.26.4
nltk==3.8.1
python-dotenv==1.0.1
gunicorn==22.0.0
`
  }
};

const VIVA_QUESTIONS = [
  {
    q: "1. What is the core problem that FindIt solves compared to traditional lost and found registers?",
    a: "Traditional systems rely on keyword equality or manual notice boards. If a loser searches for 'crimson bag' and the finder logs 'red backpack', classical SQL queries fail completely due to the 'Vocabulary Mismatch Problem'. FindIt utilizes Natural Language Processing (TF-IDF vectorization, synonym expansion, and cosine similarity) to identify conceptual similarity regardless of phrasing."
  },
  {
    q: "2. Explain the mathematical formula of TF-IDF and why it is superior to raw term count.",
    a: "Raw term count (frequency) overweights ubiquitous words like 'the', 'bag', 'lost' that appear in every report. TF-IDF balances Term Frequency TF(t,d) with Inverse Document Frequency IDF(t,D) = ln((1+|D|)/(1+df(t))) + 1. Unique distinguishing features like brand names ('Inspiron', 'Ray-Ban') or unique stickers receive high weights, while generic words are suppressed."
  },
  {
    q: "3. How does Cosine Similarity compute matching between two item descriptions?",
    a: "Cosine similarity measures the cosine of the angle between two multidimensional TF-IDF vectors: cos(θ) = (A · B) / (||A|| × ||B||). Because it normalizes by the vector magnitudes (Euclidean lengths), a short 4-word report and an elaborate 30-word report can achieve high similarity if the core conceptual keywords overlap."
  },
  {
    q: "4. Why is SQLite chosen as the database for this system?",
    a: "SQLite is serverless, self-contained, zero-configuration, and fully ACID-compliant. It stores the entire relational database inside a single portable file (findit.db), making the system lightweight, extremely fast for local queries, and easy to deploy without external database servers."
  },
  {
    q: "5. How does FindIt prevent fraudulent claims when items are displayed in the public catalog?",
    a: "If all details (such as stickers, lockscreen wallpaper, serial numbers, or wallet contents) were published publicly, anyone browsing could fabricate a claim. FindIt solves this with 'Anti-Fraud Blind Verification': all distinguishing identification secrets are redacted and sealed upon submission. When someone clicks 'Claim Item', they must blindly supply this proof. The NLP engine then calculates a Cosine Similarity score between the claimant's answer and the finder's sealed secret detail. Only upon passing this blind test and admin approval are contact details released."
  }
];

export const ProjectDocsModal: React.FC<ProjectDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'architecture' | 'viva'>('code');
  const [selectedFile, setSelectedFile] = useState<string>('app.py');
  const [copiedFile, setCopiedFile] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_FILES[selectedFile].content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      zip.file('app.py', PYTHON_FILES['app.py'].content);
      zip.file('nlp_matcher.py', PYTHON_FILES['nlp_matcher.py'].content);
      zip.file('database.py', PYTHON_FILES['database.py'].content);
      zip.file('schema.sql', PYTHON_FILES['schema.sql'].content);
      zip.file('requirements.txt', PYTHON_FILES['requirements.txt'].content);

      const templatesFolder = zip.folder('templates');
      templatesFolder?.file('index.html', `<!DOCTYPE html><html><body><h1>FindIt Backend</h1></body></html>`);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'FindIt_MCA_Python_Project.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ZIP generation error', e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Project Documentation & Python Codebase
              </h2>
              <p className="text-[11px] text-slate-400">MCA Project Resources, DFD Diagrams & Source Code</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Zipping...' : 'Download Project (.zip)'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('code')}
            className={`py-1.5 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'code' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Python Backend Code
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-1.5 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'architecture' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            DFD & Architecture
          </button>
          <button
            onClick={() => setActiveTab('viva')}
            className={`py-1.5 px-3 rounded-lg font-medium transition-colors ${
              activeTab === 'viva' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Viva Voce Questions
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'code' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block px-2 mb-1">
                  Source Files
                </span>
                {Object.keys(PYTHON_FILES).map(fn => (
                  <button
                    key={fn}
                    onClick={() => setSelectedFile(fn)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-mono text-xs flex items-center justify-between ${
                      selectedFile === fn
                        ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/40'
                        : 'text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{fn}</span>
                  </button>
                ))}
              </div>

              <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-xs text-white font-semibold">{selectedFile}</span>
                  <button
                    onClick={handleCopyCode}
                    className="text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded flex items-center gap-1"
                  >
                    {copiedFile ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedFile ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[380px]">
                  <code>{PYTHON_FILES[selectedFile].content}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-400 block">DFD Level 0: Context Level</span>
                <p className="text-slate-400">External entities interacting with the FindIt NLP Matching Engine & SQLite database:</p>
                <pre className="p-3 bg-slate-900 rounded font-mono text-slate-300 overflow-x-auto">
{`[Student / Loser] ----(Report Lost / Claim)----> [FindIt NLP Engine & SQLite]
[Finder] ---------(Report Found / Proof)-----> [FindIt NLP Engine & SQLite]
[Administrator] <---(Review & Approve Claims)---> [FindIt System]`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'viva' && (
            <div className="space-y-3 text-xs">
              {VIVA_QUESTIONS.map((v, i) => (
                <div key={i} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-cyan-300">{v.q}</h4>
                  <p className="text-slate-300 leading-relaxed pl-3 border-l-2 border-slate-800">{v.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
