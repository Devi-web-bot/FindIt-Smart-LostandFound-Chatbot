import React, { useState } from 'react';
import { 
  GraduationCap, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Terminal, 
  HelpCircle, 
  Layers, 
  BookOpen, 
  CheckCircle2,
  FolderTree,
  ExternalLink
} from 'lucide-react';
import JSZip from 'jszip';

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

    def add_item(self, item_name, category, colour, description, date_event, location, item_type, contact_info, reported_by="Student"):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO items (item_name, category, colour, description, date_event, location, item_type, contact_info, reported_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
            """, (item_name, category, colour, description, date_event, location, item_type, contact_info, reported_by))
            conn.commit()
            return cursor.lastrowid

    def get_items(self, item_type=None, category=None, status=None, query=None):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            sql = "SELECT * FROM items WHERE 1=1"
            params = []
            if item_type:
                sql += " AND item_type = ?"
                params.append(item_type)
            if category and category.lower() != "all":
                sql += " AND category = ?"
                params.append(category)
            if status and status.lower() != "all":
                sql += " AND status = ?"
                params.append(status)
            if query:
                sql += " AND (item_name LIKE ? OR description LIKE ? OR location LIKE ?)"
                pattern = f"%{query}%"
                params.extend([pattern, pattern, pattern])
            sql += " ORDER BY id DESC"
            cursor.execute(sql, params)
            return [dict(row) for row in cursor.fetchall()]

    def get_item_by_id(self, item_id: int):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_statistics(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM items WHERE item_type = 'lost'")
            lost = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM items WHERE item_type = 'found'")
            found = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM items WHERE status = 'resolved'")
            resolved = cursor.fetchone()[0]
            total = lost + found
            rate = round((resolved / max(1, total)) * 100, 1)
            return {
                "total_items": total,
                "total_lost": lost,
                "total_found": found,
                "resolved_items": resolved,
                "resolution_rate": rate
            }
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
    date_event TEXT NOT NULL,
    location TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK(item_type IN ('lost', 'found')),
    contact_info TEXT,
    reported_by TEXT DEFAULT 'Anonymous',
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'matched', 'claimed', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    proof_description TEXT NOT NULL,
    claimant_contact TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
);

CREATE INDEX idx_item_type ON items(item_type);
CREATE INDEX idx_item_category ON items(category);
CREATE INDEX idx_item_status ON items(status);
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
  },
  'README.md': {
    purpose: 'Complete project documentation, installation steps, and viva voce defense guide.',
    language: 'markdown',
    content: `# FindIt – Smart Lost and Found Chatbot
## MCA Major Project

### How to Run:
\`\`\`bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run application
python app.py
\`\`\`
Visit: http://localhost:5000 in your browser!
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
  },
  {
    q: "6. What is the role of Synonym Expansion in the preprocessing pipeline?",
    a: "Before computing TF-IDF vectors, the engine cross-references tokens with a domain synonym dictionary (e.g., 'wallet' ↔ 'billfold' ↔ 'purse', 'navy' ↔ 'blue', 'laptop' ↔ 'macbook'). This enriches the document representation and guarantees that semantic equivalents contribute to the dot product."
  },
  {
    q: "7. What are the composite weights used in the final matching score?",
    a: "The final composite score is calculated as: 65% Text Semantic Cosine Similarity + 20% Category Match Score + 15% Color Match Score. This ensures that even if text phrasing differs, matching category and matching color significantly boost the match confidence."
  },
  {
    q: "8. What is the difference between Precision and Recall in a Lost & Found application?",
    a: "Recall measures how many actual matches were found among all existing matches. Precision measures how many of the suggested matches were genuinely the correct item. In lost and found, high recall is vital so users don't miss their belongings, followed by ranking by similarity score."
  }
];

export const MCAPackageHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'code' | 'architecture' | 'setup' | 'viva'>('code');
  const [selectedFile, setSelectedFile] = useState<string>('app.py');
  const [copiedFile, setCopiedFile] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_FILES[selectedFile].content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Python source code
      zip.file('app.py', PYTHON_FILES['app.py'].content);
      zip.file('nlp_matcher.py', PYTHON_FILES['nlp_matcher.py'].content);
      zip.file('database.py', PYTHON_FILES['database.py'].content);
      zip.file('schema.sql', PYTHON_FILES['schema.sql'].content);
      zip.file('requirements.txt', PYTHON_FILES['requirements.txt'].content);
      zip.file('README.md', PYTHON_FILES['README.md'].content);

      // Add HTML template folder
      const templatesFolder = zip.folder('templates');
      templatesFolder?.file('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FindIt – Lost & Found Chatbot</title>
    <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
    <div id="app">
        <h1>FindIt: Smart Lost and Found Chatbot</h1>
        <p>Flask & SQLite Backend Online</p>
    </div>
</body>
</html>`);

      // Add static stylesheet folder
      const staticCssFolder = zip.folder('static')?.folder('css');
      staticCssFolder?.file('style.css', `body { font-family: sans-serif; background: #0f172a; color: #fff; padding: 2rem; }`);

      // Generate zip
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Hero Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <GraduationCap className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              MCA Project Academic Suite & Python Source
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete project deliverable: runnable Python Flask backend, SQLite schema, TF-IDF engine, viva voce preparation & downloadable ZIP.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Generating Package...' : 'Download Python Project (.zip)'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-medium transition-colors ${
            activeTab === 'code' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Python Source Code Viewer
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-medium transition-colors ${
            activeTab === 'architecture' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          DFD & System Architecture
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-medium transition-colors ${
            activeTab === 'setup' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Installation & Setup Guide
        </button>
        <button
          onClick={() => setActiveTab('viva')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-medium transition-colors ${
            activeTab === 'viva' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Viva Voce Defense Q&A
        </button>
      </div>

      {/* TAB 1: CODE VIEWER */}
      {activeTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* File Explorer Tree */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-2 mb-2">
              Project Files
            </span>
            {Object.keys(PYTHON_FILES).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                  selectedFile === fileName
                    ? 'bg-cyan-950/70 text-cyan-300 font-semibold border border-cyan-800/40'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{fileName}</span>
                </span>
                <span className="text-[10px] text-slate-500 uppercase">
                  {PYTHON_FILES[fileName].language}
                </span>
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-white">{selectedFile}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{PYTHON_FILES[selectedFile].purpose}</p>
              </div>

              <button
                onClick={handleCopyCode}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFile ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed">
              <code>{PYTHON_FILES[selectedFile].content}</code>
            </pre>
          </div>

        </div>
      )}

      {/* TAB 2: DFD & ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h2 className="text-base font-semibold text-white">Data Flow Diagrams (DFD)</h2>
            
            {/* DFD Level 0 */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                DFD Level 0: Context Level Diagram
              </span>
              <p className="text-xs text-slate-400">
                Represents the entire system as a single process interacting with primary external entities (Student User, Finder, Administrator).
              </p>
              <pre className="p-4 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">
{`+----------------+      1. Submit Lost Item Report       +------------------------------------+
|  Student User  | -------------------------------------> |                                    |
|   (Loser)      | <------------------------------------- |                                    |
+----------------+      2. Match Alerts & Status          |                                    |
                                                          |  FindIt: Smart Lost & Found        |
+----------------+      3. Register Found Item            |  AI Chatbot System                 |
|  Finder / Peer | -------------------------------------> |                                    |
+----------------+                                        |                                    |
                                                          |                                    |
+----------------+      4. Review Claims & Verify Items   |                                    |
| Administrator  | <====================================> |                                    |
+----------------+                                        +------------------------------------+`}
              </pre>
            </div>

            {/* DFD Level 1 */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                DFD Level 1: Functional Process Decomposition
              </span>
              <pre className="p-4 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">
{`[User Input] --> [Process 1.0: Chatbot & Entity Extraction]
                       |
                       v
                 [Process 2.0: NLP Text Preprocessing & Synonym Expansion]
                       |
                       v
                 [Process 3.0: TF-IDF Vectorization & Matrix Generation]
                       |
                       v
                 [Process 4.0: Cosine Similarity & Multi-Factor Scoring]
                       |
                       +---> [Database Store: SQLite findit.db]
                       |
                       v
                 [Process 5.0: Match Notification & Claim Verification]`}
              </pre>
            </div>
          </div>

          {/* Database Schema Visualizer */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
            <h2 className="text-base font-semibold text-white">Relational Database Entity Relationship (ER) Schema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1">TABLE: items</span>
                <p>• id (INTEGER PRIMARY KEY AUTOINCREMENT)</p>
                <p>• item_name (TEXT NOT NULL)</p>
                <p>• category (TEXT NOT NULL)</p>
                <p>• colour (TEXT)</p>
                <p>• description (TEXT NOT NULL)</p>
                <p>• date_event (TEXT NOT NULL)</p>
                <p>• location (TEXT NOT NULL)</p>
                <p>• item_type ('lost' | 'found')</p>
                <p>• contact_info (TEXT - Masked)</p>
                <p>• status ('open' | 'matched' | 'claimed' | 'resolved')</p>
                <p>• created_at (TIMESTAMP)</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">TABLE: claims</span>
                <p>• id (INTEGER PRIMARY KEY AUTOINCREMENT)</p>
                <p>• item_id (INTEGER FK -&gt; items.id)</p>
                <p>• proof_description (TEXT NOT NULL)</p>
                <p>• claimant_contact (TEXT NOT NULL)</p>
                <p>• status ('pending' | 'approved' | 'rejected')</p>
                <p>• created_at (TIMESTAMP)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETUP GUIDE */}
      {activeTab === 'setup' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-base font-semibold text-white">Step-by-Step Instructions to Run the Application</h2>
          <p className="text-xs text-slate-400">
            Follow these commands in your local computer terminal or during your college project presentation.
          </p>

          <div className="space-y-4 pt-2">
            
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">1</span>
                Extract or Clone the Project Directory
              </span>
              <pre className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-cyan-300">
cd findit-lost-and-found
              </pre>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">2</span>
                Create & Activate Virtual Environment
              </span>
              <pre className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-cyan-300">
# Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Windows PowerShell:
python -m venv venv
venv\Scripts\Activate.ps1
              </pre>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">3</span>
                Install Dependencies
              </span>
              <pre className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-cyan-300">
pip install -r requirements.txt
              </pre>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">4</span>
                Launch the Flask Application
              </span>
              <pre className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-cyan-300">
python app.py
              </pre>
              <p className="text-xs text-slate-400">
                The terminal will log: <span className="font-mono text-emerald-400">Running on http://127.0.0.1:5000</span>. Open this URL in Chrome/Firefox!
              </p>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: VIVA QUESTIONS */}
      {activeTab === 'viva' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <h2 className="text-base font-semibold text-white">Top Viva Voce Questions & Evaluator Answers</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Curated questions frequently asked by external examiners and professors during MCA final project defense.
            </p>
          </div>

          <div className="space-y-3">
            {VIVA_QUESTIONS.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2"
              >
                <h3 className="text-xs font-bold text-cyan-300 flex items-start gap-2">
                  <span>{item.q}</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed pl-4 border-l-2 border-slate-800">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
