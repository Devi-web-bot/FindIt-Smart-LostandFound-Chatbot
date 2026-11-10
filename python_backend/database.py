"""
FindIt – SQLite Database Management Module
Handles table creation, sample data seeding, queries, updates, and privacy masking.
"""

import sqlite3
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

SAMPLE_ITEMS = [
    {
        "item_name": "Navy Blue Dell Laptop",
        "category": "Electronics",
        "colour": "Blue",
        "description": "Dell Inspiron 15 inch navy blue metallic laptop with a GitHub Octocat sticker on the lid. Left near the charging station.",
        "date_event": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "location": "Central Library 2nd Floor Study Room",
        "item_type": "lost",
        "contact_info": "alex.mca24@university.edu",
        "reported_by": "Alex Sharma",
        "status": "open"
    },
    {
        "item_name": "Dark Blue Laptop Computer",
        "category": "Electronics",
        "colour": "Blue",
        "description": "Dark blue 15in laptop with code stickers on outer casing found plugged into the desk socket in the study hall.",
        "date_event": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "location": "University Library Level 2",
        "item_type": "found",
        "contact_info": "librarian.desk@university.edu",
        "reported_by": "Library Staff",
        "status": "open"
    },
    {
        "item_name": "Brown Leather Wallet",
        "category": "Wallets & Bags",
        "colour": "Brown",
        "description": "Men's bifold brown leather Tommy Hilfiger wallet containing college metro card and gym membership card.",
        "date_event": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
        "location": "Main Cafeteria Counter 3",
        "item_type": "lost",
        "contact_info": "rahul.gupta99@gmail.com",
        "reported_by": "Rahul Gupta",
        "status": "open"
    },
    {
        "item_name": "Tan Leather Purse / Billfold",
        "category": "Wallets & Bags",
        "colour": "Brown",
        "description": "Brown pocket wallet found on chair in dining area with various cards inside.",
        "date_event": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
        "location": "Campus Food Court",
        "item_type": "found",
        "contact_info": "cafeteria.supervisor@campus.org",
        "reported_by": "Cafeteria Security",
        "status": "open"
    },
    {
        "item_name": "Toyota Car Key with Red Fob",
        "category": "Keys",
        "colour": "Red",
        "description": "Single electronic car key for Toyota with a red rubber casing and a mini Sonic the Hedgehog keychain.",
        "date_event": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
        "location": "North Parking Lot Zone C",
        "item_type": "lost",
        "contact_info": "sarah.k@yahoo.com",
        "reported_by": "Sarah K",
        "status": "open"
    },
    {
        "item_name": "Car Remote Keys with Keychain",
        "category": "Keys",
        "colour": "Red",
        "description": "Vehicle smart key found near parking bay with red cover and cartoon character attached.",
        "date_event": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
        "location": "Parking Area North Wing",
        "item_type": "found",
        "contact_info": "security.booth1@campus.edu",
        "reported_by": "Campus Guard",
        "status": "open"
    },
    {
        "item_name": "Black Ray-Ban Sunglasses",
        "category": "Clothing",
        "colour": "Black",
        "description": "Classic black frame polarized Ray-Ban Wayfarer sunglasses in a black textured case.",
        "date_event": (datetime.now() - timedelta(days=4)).strftime("%Y-%m-%d"),
        "location": "Sports Complex Badminton Court",
        "item_type": "lost",
        "contact_info": "vikram.patel@gmail.com",
        "reported_by": "Vikram Patel",
        "status": "open"
    },
    {
        "item_name": "Titanium Apple Watch Series 8",
        "category": "Jewelry & Watches",
        "colour": "Silver / Grey",
        "description": "Silver smartwatch with green magnetic sport loop band. Password locked with custom photo watch face.",
        "date_event": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
        "location": "Auditorium Hall Row G",
        "item_type": "found",
        "contact_info": "av.technician@university.edu",
        "reported_by": "Tech Crew",
        "status": "open"
    }
]

class Database:
    def __init__(self, db_path: str = "findit.db"):
        self.db_path = db_path

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Initialize SQLite database tables and seed sample data."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Items table
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

            # Notifications table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER,
                matched_item_id INTEGER,
                score REAL,
                message TEXT,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES items (id),
                FOREIGN KEY (matched_item_id) REFERENCES items (id)
            );
            """)

            # Claims table
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

            # Seed if empty
            cursor.execute("SELECT COUNT(*) FROM items")
            if cursor.fetchone()[0] == 0:
                for item in SAMPLE_ITEMS:
                    cursor.execute("""
                    INSERT INTO items (item_name, category, colour, description, date_event, location, item_type, contact_info, reported_by, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        item["item_name"], item["category"], item["colour"],
                        item["description"], item["date_event"], item["location"],
                        item["item_type"], item["contact_info"], item["reported_by"],
                        item["status"]
                    ))
                conn.commit()

    def add_item(self, item_name: str, category: str, colour: str, description: str,
                 date_event: str, location: str, item_type: str, contact_info: str,
                 reported_by: str = "Anonymous") -> int:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO items (item_name, category, colour, description, date_event, location, item_type, contact_info, reported_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
            """, (item_name, category, colour, description, date_event, location, item_type, contact_info, reported_by))
            conn.commit()
            return cursor.lastrowid

    def get_items(self, item_type: Optional[str] = None, category: Optional[str] = None,
                  status: Optional[str] = None, query: Optional[str] = None) -> List[Dict[str, Any]]:
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
                sql += " AND (item_name LIKE ? OR description LIKE ? OR location LIKE ? OR colour LIKE ?)"
                pattern = f"%{query}%"
                params.extend([pattern, pattern, pattern, pattern])

            sql += " ORDER BY id DESC"
            cursor.execute(sql, params)
            return [dict(row) for row in cursor.fetchall()]

    def get_item_by_id(self, item_id: int) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_item_status(self, item_id: int, action: str) -> bool:
        status_map = {
            "verify": "open",
            "resolve": "resolved",
            "match": "matched"
        }
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if action == "delete":
                cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
            elif action in status_map:
                cursor.execute("UPDATE items SET status = ? WHERE id = ?", (status_map[action], item_id))
            conn.commit()
            return True

    def add_claim(self, item_id: int, proof_description: str, claimant_contact: str) -> int:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO claims (item_id, proof_description, claimant_contact, status)
            VALUES (?, ?, ?, 'pending')
            """, (item_id, proof_description, claimant_contact))
            cursor.execute("UPDATE items SET status = 'claimed' WHERE id = ?", (item_id,))
            conn.commit()
            return cursor.lastrowid

    def create_notification(self, item_id: int, matched_item_id: int, score: float, message: str):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO notifications (item_id, matched_item_id, score, message)
            VALUES (?, ?, ?, ?)
            """, (item_id, matched_item_id, score, message))
            conn.commit()

    def get_statistics(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM items WHERE item_type = 'lost'")
            total_lost = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM items WHERE item_type = 'found'")
            total_found = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM items WHERE status = 'resolved'")
            resolved_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM claims")
            total_claims = cursor.fetchone()[0]

            return {
                "total_items": total_lost + total_found,
                "total_lost": total_lost,
                "total_found": total_found,
                "resolved_items": resolved_count,
                "total_claims": total_claims,
                "resolution_rate": round((resolved_count / max(1, total_lost + total_found)) * 100, 1)
            }
