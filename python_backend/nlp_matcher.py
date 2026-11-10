"""
FindIt – NLP Matching Engine
Implements Text Preprocessing, TF-IDF Vectorization, Cosine Similarity,
and Composite Confidence Scoring for Lost and Found items.
"""

import math
import re
from collections import Counter
from typing import List, Dict, Any, Tuple

# Comprehensive English stop words list
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", 
    "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", 
    "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", 
    "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", 
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", 
    "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", 
    "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", 
    "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", 
    "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", 
    "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", 
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", 
    "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", 
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", 
    "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", 
    "you're", "you've", "your", "yours", "yourself", "yourselves", "lost", "found", "item", "please", "help"
}

# Domain Synonyms for Lost & Found items (bridges different vocabulary used by finders and losers)
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
    "keychain": ["keys", "keyring", "key fob"],
    "glasses": ["spectacles", "eyewear", "shades", "sunglasses", "frames"],
    "spectacles": ["glasses", "eyewear", "sunglasses"],
    "sunglasses": ["shades", "sunglass", "glasses", "spectacles"],
    "umbrella": ["parasol", "rainshade"],
    "watch": ["smartwatch", "timepiece", "wristband", "applewatch", "fitbit"],
    "bottle": ["flask", "thermos", "sipper", "waterbottle"],
    "id": ["card", "badge", "identity", "license", "pass"],
    "earphones": ["headphones", "airpods", "earbuds", "headset"],
    "earbuds": ["airpods", "earphones", "headphones"],
    "jacket": ["coat", "hoodie", "sweater", "cardigan", "blazer"],
    "red": ["crimson", "scarlet", "maroon", "ruby", "burgundy"],
    "crimson": ["red", "maroon", "burgundy"],
    "blue": ["navy", "azure", "cyan", "cobalt", "indigo", "denim"],
    "navy": ["blue", "dark blue"],
    "black": ["dark", "charcoal", "onyx", "ebony"],
    "white": ["light", "ivory", "pearl"],
    "green": ["olive", "emerald", "lime", "forest"],
    "yellow": ["gold", "amber", "mustard"]
}

class NLPMatcher:
    """
    NLP Engine utilizing TF-IDF, Cosine Similarity, and domain heuristic boosting.
    """

    def __init__(self):
        pass

    def tokenize(self, text: str) -> List[str]:
        """Convert text into normalized lower-case tokens without punctuation."""
        if not text:
            return []
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        tokens = cleaned.split()
        # Filter stop words and single characters
        return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]

    def expand_synonyms(self, tokens: List[str]) -> List[str]:
        """Expand tokens with known domain synonyms to bridge vocabulary gaps."""
        expanded = list(tokens)
        for token in tokens:
            if token in SYNONYMS:
                for syn in SYNONYMS[token]:
                    expanded.append(syn)
        return expanded

    def compute_tf(self, tokens: List[str]) -> Dict[str, float]:
        """
        Compute Term Frequency (TF) using sublinear scaling:
        tf(t, d) = 1 + log(count) if count > 0 else 0
        """
        counts = Counter(tokens)
        total = len(tokens)
        if total == 0:
            return {}
        
        tf = {}
        for term, count in counts.items():
            # Normalized frequency
            tf[term] = count / total
        return tf

    def compute_idf(self, corpus: List[List[str]]) -> Dict[str, float]:
        """
        Compute Inverse Document Frequency (IDF):
        idf(t) = log(1 + (N / (1 + df(t)))) + 1
        """
        n_docs = len(corpus)
        if n_docs == 0:
            return {}
            
        doc_freq = Counter()
        for doc_tokens in corpus:
            unique_terms = set(doc_tokens)
            for t in unique_terms:
                doc_freq[t] += 1

        idf = {}
        for term, df in doc_freq.items():
            idf[term] = math.log((1 + n_docs) / (1 + df)) + 1.0
        return idf

    def get_tfidf_vector(self, tokens: List[str], idf: Dict[str, float]) -> Dict[str, float]:
        """Generate TF-IDF weight vector for a list of tokens."""
        tf = self.compute_tf(tokens)
        vector = {}
        for term, tf_val in tf.items():
            # Use default idf if term is rare/new
            idf_val = idf.get(term, 1.5)
            vector[term] = tf_val * idf_val
        return vector

    def cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        """
        Calculate Cosine Similarity between two sparse TF-IDF vectors:
        Cosine = (A . B) / (||A|| * ||B||)
        """
        common_keys = set(vec1.keys()).intersection(set(vec2.keys()))
        if not common_keys:
            return 0.0

        dot_product = sum(vec1[k] * vec2[k] for k in common_keys)
        norm1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
        norm2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def calculate_similarity_breakdown(
        self, text1: str, text2: str,
        cat1: str = "", cat2: str = "",
        col1: str = "", col2: str = ""
    ) -> Dict[str, Any]:
        """
        Computes detailed similarity score with human-explainable factors.
        """
        raw_tokens1 = self.tokenize(text1)
        raw_tokens2 = self.tokenize(text2)

        tokens1 = self.expand_synonyms(raw_tokens1)
        tokens2 = self.expand_synonyms(raw_tokens2)

        # Build local 2-document corpus for IDF
        corpus = [tokens1, tokens2]
        idf = self.compute_idf(corpus)

        vec1 = self.get_tfidf_vector(tokens1, idf)
        vec2 = self.get_tfidf_vector(tokens2, idf)

        text_cosine = self.cosine_similarity(vec1, vec2)

        # Category match evaluation
        category_score = 0.0
        if cat1 and cat2:
            if cat1.strip().lower() == cat2.strip().lower():
                category_score = 1.0
            elif "other" in [cat1.lower(), cat2.lower()]:
                category_score = 0.5
            else:
                category_score = 0.0
        else:
            category_score = 0.5

        # Color match evaluation
        color_score = 0.0
        if col1 and col2:
            c1 = col1.strip().lower()
            c2 = col2.strip().lower()
            if c1 == c2:
                color_score = 1.0
            elif (c1 in SYNONYMS.get(c2, [])) or (c2 in SYNONYMS.get(c1, [])):
                color_score = 0.85
            else:
                color_score = 0.0
        else:
            color_score = 0.5

        # Shared matched keywords
        shared_terms = [
            {"term": k, "weight1": round(vec1.get(k, 0), 3), "weight2": round(vec2.get(k, 0), 3)}
            for k in set(vec1.keys()).intersection(set(vec2.keys()))
        ]
        shared_terms.sort(key=lambda x: max(x["weight1"], x["weight2"]), reverse=True)

        # Weighted final score: 65% text semantics, 20% category, 15% color
        if cat1 and cat2 and col1 and col2:
            final_score = (text_cosine * 0.65) + (category_score * 0.20) + (color_score * 0.15)
        elif cat1 and cat2:
            final_score = (text_cosine * 0.75) + (category_score * 0.25)
        else:
            final_score = text_cosine

        return {
            "final_score": round(min(1.0, final_score), 4),
            "percentage": int(round(min(1.0, final_score) * 100)),
            "text_cosine_similarity": round(text_cosine, 4),
            "category_score": category_score,
            "color_score": color_score,
            "tokens1": raw_tokens1,
            "tokens2": raw_tokens2,
            "shared_terms": shared_terms,
            "vector1": {k: round(v, 3) for k, v in vec1.items()},
            "vector2": {k: round(v, 3) for k, v in vec2.items()}
        }

    def find_matches(self, target_item: Dict[str, Any], candidate_items: List[Dict[str, Any]], threshold: float = 0.35) -> List[Dict[str, Any]]:
        """
        Compare target item against all candidate items and rank potential matches.
        """
        target_text = f"{target_item.get('item_name', '')} {target_item.get('description', '')} {target_item.get('colour', '')} {target_item.get('location', '')}"
        
        matches = []
        for cand in candidate_items:
            cand_text = f"{cand.get('item_name', '')} {cand.get('description', '')} {cand.get('colour', '')} {cand.get('location', '')}"
            breakdown = self.calculate_similarity_breakdown(
                target_text,
                cand_text,
                cat1=target_item.get("category", ""),
                cat2=cand.get("category", ""),
                col1=target_item.get("colour", ""),
                col2=cand.get("colour", "")
            )

            if breakdown["final_score"] >= threshold:
                matches.append({
                    "candidate_id": cand.get("id"),
                    "candidate_name": cand.get("item_name"),
                    "candidate_type": cand.get("item_type"),
                    "category": cand.get("category"),
                    "colour": cand.get("colour"),
                    "location": cand.get("location"),
                    "date_event": cand.get("date_event"),
                    "description": cand.get("description"),
                    "similarity_score": breakdown["final_score"],
                    "similarity_percentage": breakdown["percentage"],
                    "breakdown": breakdown
                })

        # Sort descending by similarity score
        matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        return matches

    def process_chat_intent(self, message: str, state: Dict[str, Any], db: Any) -> Dict[str, Any]:
        """
        Stateful rule and entity extraction for the conversational chatbot.
        Allows users to either report items conversationally or search the registry.
        """
        msg_lower = message.lower().strip()
        step = state.get("step", "idle")
        collected = state.get("data", {})

        # Greetings & Help
        if any(w in msg_lower for w in ["hi", "hello", "hey", "start", "namaste"]) and step == "idle":
            return {
                "reply": "Hello! I am FindIt, your AI Lost and Found Assistant. I can help you report a lost belonging, register an item you found, or scan our database using AI NLP matching. What would you like to do?",
                "quick_replies": ["Report Lost Item", "Report Found Item", "Search Database", "Explain Smart Matching"],
                "state": {"step": "idle", "data": {}}
            }

        if "explain smart matching" in msg_lower or "how does matching work" in msg_lower:
            return {
                "reply": "FindIt uses Natural Language Processing (NLP) with TF-IDF (Term Frequency-Inverse Document Frequency) and Cosine Similarity! Even if you say 'crimson bag' and someone reports 'red backpack', our engine extracts key features, computes cosine similarity vectors, and identifies the match! Would you like to report an item now?",
                "quick_replies": ["Report Lost Item", "Report Found Item", "Search Database"],
                "state": {"step": "idle", "data": {}}
            }

        # User wants to report lost
        if ("lost" in msg_lower and "report" in msg_lower) or msg_lower == "report lost item" or ("i lost" in msg_lower and step == "idle"):
            return {
                "reply": "I'm sorry you lost something! Let's get it reported right away. What item did you lose? (e.g., 'Blue Dell Inspiron Laptop', 'Brown Leather Wallet')",
                "quick_replies": ["Blue Backpack", "HP Laptop", "Keys with Keychain", "Titanium Watch", "Student ID Card"],
                "state": {"step": "awaiting_name", "data": {"item_type": "lost"}}
            }

        # User wants to report found
        if ("found" in msg_lower and "report" in msg_lower) or msg_lower == "report found item" or ("i found" in msg_lower and step == "idle"):
            return {
                "reply": "Thank you for being honest and helpful! What item did you find? (e.g., 'Stainless Steel Water Bottle', 'Black Ray-Ban Sunglasses')",
                "quick_replies": ["iPhone 14 Black", "Leather Wallet", "Room Keys", "Casio Calculator", "Spectacles"],
                "state": {"step": "awaiting_name", "data": {"item_type": "found"}}
            }

        # Step-based collection flow
        if step == "awaiting_name":
            collected["item_name"] = message
            return {
                "reply": f"Got it: '{message}'. Which category best describes it?",
                "quick_replies": ["Electronics", "Wallets & Bags", "Documents & IDs", "Keys", "Jewelry & Watches", "Clothing", "Books & Stationery", "Other"],
                "state": {"step": "awaiting_category", "data": collected}
            }

        if step == "awaiting_category":
            collected["category"] = message
            return {
                "reply": f"Category noted as '{message}'. What is the primary color or shade? (e.g., 'Midnight Blue', 'Silver', 'Matte Black')",
                "quick_replies": ["Black", "Blue", "Red", "Silver / Grey", "Brown", "White", "Gold", "Multi-colored"],
                "state": {"step": "awaiting_colour", "data": collected}
            }

        if step == "awaiting_colour":
            collected["colour"] = message
            return {
                "reply": f"Color '{message}' saved. Please provide a brief description with any unique identifiers or marks (e.g., stickers, scratches, brand name, contents):",
                "quick_replies": ["Has Apple logo sticker on cover", "Contains student library card", "Has slight scratch on front edge", "No special marks"],
                "state": {"step": "awaiting_description", "data": collected}
            }

        if step == "awaiting_description":
            collected["description"] = message
            action_word = "lost" if collected.get("item_type") == "lost" else "found"
            return {
                "reply": f"Description saved. Where was it {action_word}? (e.g., 'Library 2nd Floor Study Hall', 'Main Cafeteria Table 4', 'Bus Stop near Gate 2')",
                "quick_replies": ["University Central Library", "Campus Cafeteria", "Computer Lab B", "Sports Complex", "Auditorium Hall"],
                "state": {"step": "awaiting_location", "data": collected}
            }

        if step == "awaiting_location":
            collected["location"] = message
            return {
                "reply": "When did this occur? You can say 'Today', 'Yesterday', or enter a date (YYYY-MM-DD):",
                "quick_replies": ["Today", "Yesterday", "2 days ago"],
                "state": {"step": "awaiting_date", "data": collected}
            }

        if step == "awaiting_date":
            date_val = message
            if "today" in date_val.lower():
                date_val = datetime.now().strftime("%Y-%m-%d")
            elif "yesterday" in date_val.lower():
                date_val = datetime.now().strftime("%Y-%m-%d")
            collected["date_event"] = date_val

            return {
                "reply": "Finally, please provide your contact email or phone number. (Note: Your personal information is kept strictly private and masked from public view):",
                "quick_replies": ["student@university.edu", "contact@domain.com"],
                "state": {"step": "awaiting_contact", "data": collected}
            }

        if step == "awaiting_contact":
            collected["contact_info"] = message
            # Save to database
            new_id = db.add_item(
                item_name=collected["item_name"],
                category=collected["category"],
                colour=collected.get("colour", ""),
                description=collected["description"],
                date_event=collected["date_event"],
                location=collected["location"],
                item_type=collected["item_type"],
                contact_info=collected["contact_info"]
            )

            # Run NLP matching against opposite pool
            opposite_type = "found" if collected["item_type"] == "lost" else "lost"
            candidates = db.get_items(item_type=opposite_type, status="open")
            matches = self.find_matches(target_item=collected, candidate_items=candidates, threshold=0.35)

            match_msg = ""
            if matches:
                top = matches[0]
                match_msg = f"\n\n🔍 NLP MATCH ALERT: We found a potential match with {top['similarity_percentage']}% confidence ('{top['candidate_name']}' at '{top['location']}')."

            return {
                "reply": f"🎉 Thank you! Your {collected['item_type']} report #{new_id} for '{collected['item_name']}' has been registered in the database.{match_msg}",
                "item_created": True,
                "item_id": new_id,
                "matches": matches,
                "quick_replies": ["View Match Details", "Search Database", "Report Another Item"],
                "state": {"step": "idle", "data": {}}
            }

        # Fallback search or inquiry
        items = db.get_items(query=message)
        if items:
            return {
                "reply": f"I searched the registry for '{message}' and found {len(items)} relevant item(s). You can explore them in the catalog below.",
                "search_results": items[:5],
                "quick_replies": ["Report Lost Item", "Report Found Item", "Search Database"],
                "state": {"step": "idle", "data": {}}
            }

        return {
            "reply": "I can help you report a lost or found item, search our database, or explain our TF-IDF matching engine. What would you like to do?",
            "quick_replies": ["Report Lost Item", "Report Found Item", "Search Database", "Explain Smart Matching"],
            "state": {"step": "idle", "data": {}}
        }
