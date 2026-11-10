export type ItemType = 'lost' | 'found';
export type ItemStatus = 'open' | 'matched' | 'claimed' | 'resolved';

export const CAMPUS_CATEGORIES = [
  'Electronics & Gadgets',
  'Wallets, Bags & Purses',
  'Cards, IDs & Documents',
  'Keys & Vehicle Fobs',
  'Personal Accessories & Clothing',
  'Other'
] as const;

export type ItemCategory = typeof CAMPUS_CATEGORIES[number];

export interface Item {
  id: number;
  item_name: string;
  category: string;
  colour: string;
  description: string;
  /**
   * Secret distinctive proof known only to finder / legitimate owner.
   * NEVER displayed in public catalog or public search to prevent fraudulent claims!
   */
  secret_verification_detail?: string;
  date_event: string;
  location: string;
  /**
   * For found items: where the item is physically deposited for safekeeping
   * (e.g. "Central Library Circulation Desk", "Security Booth Gate 1", "Room 302")
   */
  custody_location?: string;
  item_type: ItemType;
  contact_info: string;
  contact_info_masked?: string;
  reported_by: string;
  status: ItemStatus;
  created_at: string;
}

export interface SharedTerm {
  term: string;
  weight1: number;
  weight2: number;
}

export interface MatchBreakdown {
  final_score: number;
  percentage: number;
  text_cosine_similarity: number;
  category_score: number;
  color_score: number;
  tokens1: string[];
  tokens2: string[];
  shared_terms: SharedTerm[];
  vector1: Record<string, number>;
  vector2: Record<string, number>;
}

export interface MatchResult {
  candidate: Item;
  similarity_score: number;
  similarity_percentage: number;
  breakdown: MatchBreakdown;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  sub_heading?: string;
  quick_replies?: string[];
  item_card?: Item;
  match_results?: MatchResult[];
  is_system?: boolean;
}

export interface NotificationItem {
  id: number;
  item_id: number;
  matched_item_id: number;
  score: number;
  message: string;
  is_read: boolean;
  timestamp: string;
}

export interface Claim {
  id: number;
  item_id: number;
  item_name: string;
  proof_description: string;
  claimant_contact: string;
  claimant_contact_masked?: string;
  finder_sealed_detail?: string;
  proof_similarity_score?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Statistics {
  total_items: number;
  total_lost: number;
  total_found: number;
  resolved_items: number;
  total_claims: number;
  resolution_rate: number;
}
