"""
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

# Mask sensitive personal information
def mask_contact(contact: str) -> str:
    if not contact:
        return "Protected"
    contact = contact.strip()
    if "@" in contact:
        parts = contact.split("@")
        name = parts[0]
        domain = parts[1]
        masked_name = name[0] + "***" if len(name) > 1 else name + "***"
        return f"{masked_name}@{domain}"
    if len(contact) >= 10:
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
    item_type = request.args.get("type")  # 'lost' or 'found'
    category = request.args.get("category")
    status = request.args.get("status")
    query = request.args.get("q", "").strip()

    items = db.get_items(item_type=item_type, category=category, status=status, query=query)
    
    # Mask contact in public response
    for item in items:
        item["contact_info_masked"] = mask_contact(item.get("contact_info", ""))
        del item["contact_info"]

    return jsonify({"success": True, "count": len(items), "data": items})

@app.route("/api/items/<int:item_id>", methods=["GET"])
def get_item_detail(item_id):
    """Retrieve details for a single item."""
    item = db.get_item_by_id(item_id)
    if not item:
        return jsonify({"success": False, "message": "Item not found"}), 404
    
    item["contact_info_masked"] = mask_contact(item.get("contact_info", ""))
    del item["contact_info"]
    
    # Find potential matches for this item
    opposite_type = "found" if item["item_type"] == "lost" else "lost"
    candidates = db.get_items(item_type=opposite_type, status="open")
    matches = matcher.find_matches(target_item=item, candidate_items=candidates, threshold=0.35)

    return jsonify({
        "success": True, 
        "data": item, 
        "matches": matches
    })

@app.route("/api/report", methods=["POST"])
def report_item():
    """Endpoint to submit a new lost or found item report."""
    data = request.get_json() or {}
    
    # Required validation
    required = ["item_name", "category", "item_type", "description", "location", "date_event"]
    for field in required:
        if not data.get(field):
            return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

    if data["item_type"] not in ["lost", "found"]:
        return jsonify({"success": False, "message": "item_type must be 'lost' or 'found'"}), 400

    new_id = db.add_item(
        item_name=data["item_name"],
        category=data["category"],
        colour=data.get("colour", ""),
        description=data["description"],
        date_event=data["date_event"],
        location=data["location"],
        item_type=data["item_type"],
        contact_info=data.get("contact_info", ""),
        reported_by=data.get("reported_by", "Anonymous")
    )

    created_item = db.get_item_by_id(new_id)

    # Automatically scan for matches in the opposite pool
    opposite_type = "found" if data["item_type"] == "lost" else "lost"
    candidates = db.get_items(item_type=opposite_type, status="open")
    matches = matcher.find_matches(target_item=created_item, candidate_items=candidates, threshold=0.35)

    # Save match notifications to database if strong matches exist
    for m in matches:
        if m["similarity_score"] >= 0.50:
            db.create_notification(
                item_id=new_id,
                matched_item_id=m["candidate_id"],
                score=m["similarity_score"],
                message=f"Possible match found: '{m['candidate_name']}' with {int(m['similarity_score'] * 100)}% confidence."
            )

    return jsonify({
        "success": True,
        "message": f"{data['item_type'].capitalize()} item report saved successfully.",
        "item_id": new_id,
        "matches_count": len(matches),
        "matches": matches
    }), 201

@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Intelligent chatbot interaction handler.
    Parses intent, assists in reporting items, searches database,
    and runs NLP matching directly from conversational inputs.
    """
    payload = request.get_json() or {}
    user_message = payload.get("message", "").strip()
    session_state = payload.get("state", {})

    if not user_message:
        return jsonify({"success": False, "message": "Empty message."}), 400

    response = matcher.process_chat_intent(user_message, session_state, db)
    return jsonify(response)

@app.route("/api/match/compare", methods=["POST"])
def compare_texts():
    """
    Live NLP evaluation endpoint to compare two arbitrary descriptions using TF-IDF and Cosine Similarity.
    Used for academic verification and the interactive NLP lab.
    """
    data = request.get_json() or {}
    text1 = data.get("text1", "").strip()
    text2 = data.get("text2", "").strip()
    category1 = data.get("category1", "")
    category2 = data.get("category2", "")
    color1 = data.get("color1", "")
    color2 = data.get("color2", "")

    if not text1 or not text2:
        return jsonify({"success": False, "message": "Both text1 and text2 are required."}), 400

    result = matcher.calculate_similarity_breakdown(
        text1, text2, 
        cat1=category1, cat2=category2,
        col1=color1, col2=color2
    )

    return jsonify({"success": True, "data": result})

@app.route("/api/claims", methods=["POST"])
def submit_claim():
    """Submit an ownership claim verification request."""
    data = request.get_json() or {}
    item_id = data.get("item_id")
    proof = data.get("proof_description", "").strip()
    claimant_contact = data.get("claimant_contact", "").strip()

    if not item_id or not proof or not claimant_contact:
        return jsonify({"success": False, "message": "Missing claim details."}), 400

    claim_id = db.add_claim(item_id, proof, claimant_contact)
    return jsonify({
        "success": True, 
        "message": "Claim submitted to administrator for verification.",
        "claim_id": claim_id
    })

@app.route("/api/admin/verify", methods=["POST"])
def admin_verify():
    """Admin action to verify an item or approve a match."""
    data = request.get_json() or {}
    item_id = data.get("item_id")
    action = data.get("action")  # 'verify', 'resolve', 'delete'

    if not item_id or not action:
        return jsonify({"success": False, "message": "Missing item_id or action"}), 400

    success = db.update_item_status(item_id, action)
    return jsonify({"success": success, "action": action, "item_id": item_id})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting FindIt Lost & Found Chatbot on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
