# FindIt – Smart Lost and Found Chatbot
## MCA Major/Minor Project Documentation

An intelligent lost and found management platform powered by Natural Language Processing (NLP) with **TF-IDF (Term Frequency - Inverse Document Frequency)** and **Cosine Similarity**.

---

## 1. Project Overview & Motivation
In campuses, public transport hubs, airports, and universities, thousands of items are misplaced daily. Traditional bulletin boards and static lost-and-found registers suffer from:
1. **Vocabulary Mismatch**: A loser reports a *"navy blue rucksack"*, while the finder describes a *"dark blue backpack"*. Keyword search fails to bridge this gap.
2. **Delayed Reconnection**: Finder and loser don't cross paths in time.
3. **Privacy Vulnerability**: Phone numbers and personal IDs are publicly posted.

**FindIt** solves these challenges using:
- **Conversational Chatbot** for seamless, guided reporting.
- **TF-IDF & Cosine Similarity NLP Engine** with domain synonym expansion to catch semantic matches.
- **Privacy Masking**: Contact details are protected and only released upon admin verification of ownership claims.
- **Admin Dashboard**: For auditing, resolution management, and spam control.

---

## 2. System Architecture & DFD

### Data Flow Diagram (DFD Level 0 - Context Level):
```
[User / Student]
      |  (1) Report Lost / Found Item
      v
+------------------------------------------+
|  FindIt Smart Lost & Found Chatbot       |
|  - NLP Matcher (TF-IDF & Cosine Sim)     |
|  - SQLite Database Store                 |
+------------------------------------------+
      ^                      | (3) Match Alerts & Claims
      |                      v
[Administrator] <-------- [Finder / Owner]
```

### Mathematical Formulation:
1. **Term Frequency (TF)**:
   $$\text{TF}(t, d) = \frac{\text{count}(t, d)}{\sum_{t' \in d} \text{count}(t', d)}$$

2. **Inverse Document Frequency (IDF)**:
   $$\text{IDF}(t, D) = \ln\left(\frac{1 + |D|}{1 + |\{d \in D : t \in d\}|}\right) + 1$$

3. **TF-IDF Vector**:
   $$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \text{IDF}(t, D)$$

4. **Cosine Similarity**:
   $$\cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\|_2 \|\mathbf{B}\|_2} = \frac{\sum_{i=1}^n A_i B_i}{\sqrt{\sum_{i=1}^n A_i^2} \sqrt{\sum_{i=1}^n B_i^2}}$$

---

## 3. Directory Structure
```
findit-lost-and-found/
│
├── app.py                   # Main Flask application entrypoint & API endpoints
├── nlp_matcher.py           # NLP engine (TF-IDF, Cosine Similarity, Synonyms)
├── database.py              # SQLite database layer, seed data, queries
├── schema.sql               # SQLite schema definition script
├── requirements.txt         # Python package dependencies
├── templates/
│   └── index.html           # Web interface template
├── static/
│   ├── css/style.css        # Stylesheet
│   └── js/chat.js           # Chatbot logic & API calls
└── README.md                # Project documentation & execution guide
```

---

## 4. Setup and Execution Instructions

### Prerequisites:
- Python 3.9 or higher
- pip (Python package installer)

### Step 1: Clone or Extract the Project
```bash
cd findit-lost-and-found
```

### Step 2: Create and Activate Virtual Environment
```bash
# On Linux/macOS:
python3 -m venv venv
source venv/bin/activate

# On Windows:
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install Required Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the Application
```bash
python app.py
```
Open your browser and navigate to: `http://localhost:5000`

---

## 5. Top Viva Voce Questions & Answers (MCA Exam Defense)

1. **Q: Why use TF-IDF instead of simple string matching?**
   *A: String matching (e.g. `LIKE '%bag%'`) fails when synonyms or different phrasings are used. TF-IDF accounts for word importance by penalizing ubiquitous words ("the", "is") and boosting descriptive keywords ("jansport", "dell", "octocat"), enabling vector-space angle calculation.*

2. **Q: How does Cosine Similarity handle length disparity?**
   *A: Cosine similarity measures the angle between vectors, normalizing for vector magnitude ($\|\mathbf{A}\|_2 \times \|\mathbf{B}\|_2$). Thus, a 5-word description and a 30-word description can still yield high similarity if the core concept words overlap.*

3. **Q: Why SQLite instead of MySQL or PostgreSQL for this prototype?**
   *A: SQLite is serverless, zero-configuration, ACID-compliant, and stores the entire database in a single portable file (`findit.db`), making it ideal for self-contained desktop/campus deployment and academic demonstration.*

4. **Q: How is user privacy protected in FindIt?**
   *A: Public API queries return masked contact info (e.g. `al***@university.edu`). Full contact info is never exposed publicly; it is only revealed through administrator verification after a claimant submits proof of ownership.*
