-- FindIt: Smart Lost and Found Chatbot Schema
-- Database: SQLite3

DROP TABLE IF EXISTS claims;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS items;

-- Core Items Table
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    colour TEXT,
    description TEXT NOT NULL,
    secret_verification_detail TEXT,
    date_event TEXT NOT NULL,
    location TEXT NOT NULL,
    custody_location TEXT,
    item_type TEXT NOT NULL CHECK(item_type IN ('lost', 'found')),
    contact_info TEXT,
    reported_by TEXT DEFAULT 'Anonymous',
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'matched', 'claimed', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NLP Match Notifications Table
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    matched_item_id INTEGER NOT NULL,
    score REAL NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
    FOREIGN KEY (matched_item_id) REFERENCES items (id) ON DELETE CASCADE
);

-- Item Claims & Verification Table
CREATE TABLE claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    proof_description TEXT NOT NULL,
    claimant_contact TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
);

-- Indices for rapid query performance
CREATE INDEX idx_items_type ON items(item_type);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_status ON items(status);
