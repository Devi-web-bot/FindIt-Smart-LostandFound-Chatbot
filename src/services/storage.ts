import { Item, Claim, NotificationItem, Statistics, ItemType, ItemStatus } from '../types';
import { NLPEngine } from './nlpEngine';

export const INITIAL_ITEMS: Item[] = [
  {
    id: 1,
    item_name: 'Navy Blue Dell Laptop',
    category: 'Electronics & Gadgets',
    colour: 'Blue',
    description: 'Dell Inspiron 15-inch navy blue laptop left near study room charging station.',
    secret_verification_detail: 'Has a GitHub Octocat sticker holding a coffee mug on the top lid. User account name is Alex.',
    date_event: '2026-11-02',
    location: 'Central Library 2nd Floor Study Room',
    item_type: 'lost',
    contact_info: 'alex.mca24@university.edu',
    contact_info_masked: 'al***@university.edu',
    reported_by: 'Alex Sharma',
    status: 'open',
    created_at: '2026-11-02T10:30:00Z',
  },
  {
    id: 2,
    item_name: 'Laptop Computer (15-inch)',
    category: 'Electronics & Gadgets',
    colour: 'Blue',
    description: '15in laptop found plugged into desk socket in the study hall. Distinctive lid stickers and brand model withheld for ownership verification.',
    secret_verification_detail: 'Dark blue Dell Inspiron laptop with a GitHub Octocat sticker on the lid. Sticker has code illustration.',
    date_event: '2026-11-02',
    location: 'University Library Level 2',
    custody_location: 'Central Library Circulation Desk (Locker #3)',
    item_type: 'found',
    contact_info: 'librarian.desk@university.edu',
    contact_info_masked: 'li***@university.edu',
    reported_by: 'Library Desk Staff',
    status: 'open',
    created_at: '2026-11-02T14:15:00Z',
  },
  {
    id: 3,
    item_name: 'Brown Leather Wallet',
    category: 'Wallets, Bags & Purses',
    colour: 'Brown',
    description: "Men's bifold brown wallet lost in cafeteria near Counter 3.",
    secret_verification_detail: 'Tommy Hilfiger brown leather wallet containing university metro card for Rahul Gupta and a gym membership card.',
    date_event: '2026-11-01',
    location: 'Main Cafeteria Counter 3',
    item_type: 'lost',
    contact_info: 'rahul.gupta99@gmail.com',
    contact_info_masked: 'ra***@gmail.com',
    reported_by: 'Rahul Gupta',
    status: 'open',
    created_at: '2026-11-01T13:40:00Z',
  },
  {
    id: 4,
    item_name: 'Leather Pocket Wallet / Billfold',
    category: 'Wallets, Bags & Purses',
    colour: 'Brown',
    description: 'Pocket leather wallet found on chair in dining area. Internal card names and exact brand withheld for anti-fraud verification.',
    secret_verification_detail: 'Tommy Hilfiger brown bifold with college metro pass belonging to Rahul and gym access pass.',
    date_event: '2026-11-01',
    location: 'Campus Food Court',
    custody_location: 'Food Court Administration Office (Security Desk)',
    item_type: 'found',
    contact_info: 'cafeteria.supervisor@campus.org',
    contact_info_masked: 'ca***@campus.org',
    reported_by: 'Cafeteria Security',
    status: 'open',
    created_at: '2026-11-01T15:00:00Z',
  },
  {
    id: 5,
    item_name: 'Toyota Car Key with Red Fob',
    category: 'Keys & Vehicle Fobs',
    colour: 'Red',
    description: 'Single electronic car key with red rubber casing and cartoon keychain lost near North Parking.',
    secret_verification_detail: 'Toyota logo on back, red rubber sleeve, keychain has a mini Sonic the Hedgehog figurine.',
    date_event: '2026-10-31',
    location: 'North Parking Lot Zone C',
    item_type: 'lost',
    contact_info: 'sarah.k@yahoo.com',
    contact_info_masked: 'sa***@yahoo.com',
    reported_by: 'Sarah K',
    status: 'open',
    created_at: '2026-10-31T09:20:00Z',
  },
  {
    id: 6,
    item_name: 'Vehicle Remote Key with Keychain',
    category: 'Keys & Vehicle Fobs',
    colour: 'Red',
    description: 'Vehicle smart key found near parking bay with red protective sleeve. Attached character charm and vehicle logo withheld.',
    secret_verification_detail: 'Toyota electronic remote key with red casing and blue cartoon game character (Sonic) keychain attached.',
    date_event: '2026-10-31',
    location: 'Parking Area North Wing',
    custody_location: 'Campus Security Main Gate 1 Post',
    item_type: 'found',
    contact_info: 'security.booth1@campus.edu',
    contact_info_masked: 'se***@campus.edu',
    reported_by: 'Campus Guard',
    status: 'open',
    created_at: '2026-10-31T11:45:00Z',
  },
  {
    id: 7,
    item_name: 'Black Ray-Ban Sunglasses',
    category: 'Personal Accessories & Clothing',
    colour: 'Black',
    description: 'Classic black polarized sunglasses lost at badminton court.',
    secret_verification_detail: 'Ray-Ban Wayfarer polarized black sunglasses with slight hairline scratch on right temple.',
    date_event: '2026-10-30',
    location: 'Sports Complex Badminton Court',
    item_type: 'lost',
    contact_info: 'vikram.patel@gmail.com',
    contact_info_masked: 'vi***@gmail.com',
    reported_by: 'Vikram Patel',
    status: 'open',
    created_at: '2026-10-30T17:10:00Z',
  },
  {
    id: 8,
    item_name: 'Smartwatch with Loop Band',
    category: 'Personal Accessories & Clothing',
    colour: 'Silver / Grey',
    description: 'Smartwatch found on auditorium floor row G. Screen lock photo and model details withheld to verify genuine owner.',
    secret_verification_detail: 'Titanium Apple Watch Series 8 with green magnetic sport loop band, password locked with photo of golden retriever dog.',
    date_event: '2026-10-29',
    location: 'Auditorium Hall Row G',
    custody_location: 'Auditorium AV Tech Control Room 102',
    item_type: 'found',
    contact_info: 'av.technician@university.edu',
    contact_info_masked: 'av***@university.edu',
    reported_by: 'Tech Crew',
    status: 'open',
    created_at: '2026-10-29T18:00:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    item_id: 1,
    matched_item_id: 2,
    score: 0.88,
    message: "High Match (88%): 'Navy Blue Dell Laptop' matches 'Laptop Computer (15-inch)' at University Library.",
    is_read: false,
    timestamp: '2026-11-02T14:16:00Z',
  },
  {
    id: 2,
    item_id: 3,
    matched_item_id: 4,
    score: 0.82,
    message: "Strong Match (82%): 'Brown Leather Wallet' matches 'Leather Pocket Wallet / Billfold' at Food Court.",
    is_read: false,
    timestamp: '2026-11-01T15:02:00Z',
  },
  {
    id: 3,
    item_id: 5,
    matched_item_id: 6,
    score: 0.85,
    message: "Match Identified (85%): 'Toyota Car Key with Red Fob' matches 'Vehicle Remote Key with Keychain'.",
    is_read: true,
    timestamp: '2026-10-31T11:50:00Z',
  },
];

export const INITIAL_CLAIMS: Claim[] = [
  {
    id: 1,
    item_id: 2,
    item_name: 'Laptop Computer (15-inch)',
    proof_description: 'I can provide the serial number CN-0982-K and unlock the Windows password in person. Top lid has a GitHub Octocat sticker holding a coffee mug.',
    claimant_contact: 'alex.mca24@university.edu',
    claimant_contact_masked: 'al***@university.edu',
    finder_sealed_detail: 'Dark blue Dell Inspiron laptop with a GitHub Octocat sticker on the lid. Sticker has code illustration.',
    proof_similarity_score: 0.91,
    status: 'pending',
    created_at: '2026-11-02T16:00:00Z',
  },
];

const STORAGE_KEYS = {
  ITEMS: 'findit_items_v5',
  NOTIFICATIONS: 'findit_notifications_v5',
  CLAIMS: 'findit_claims_v5',
};

export function maskContact(contact: string): string {
  if (!contact) return 'Protected';
  const c = contact.trim();
  if (c.includes('@')) {
    const [name, domain] = c.split('@');
    const masked = name.length > 2 ? `${name.slice(0, 2)}***` : `${name}***`;
    return `${masked}@${domain}`;
  }
  if (c.length >= 8) {
    return `${c.slice(0, 2)}******${c.slice(-2)}`;
  }
  return `${c.slice(0, 2)}****`;
}

export class StorageService {
  static getItems(): Item[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
        return INITIAL_ITEMS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ITEMS;
    }
  }

  static saveItems(items: Item[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save items to storage', e);
    }
  }

  static addItem(
    itemData: Omit<Item, 'id' | 'created_at' | 'status' | 'contact_info_masked'>
  ): Item {
    const items = this.getItems();
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    const newItem: Item = {
      ...itemData,
      id: newId,
      status: 'open',
      contact_info_masked: maskContact(itemData.contact_info),
      created_at: new Date().toISOString(),
    };
    items.unshift(newItem);
    this.saveItems(items);
    return newItem;
  }

  static updateItemStatus(id: number, status: ItemStatus): void {
    const items = this.getItems().map(item =>
      item.id === id ? { ...item, status } : item
    );
    this.saveItems(items);
  }

  static deleteItem(id: number): void {
    const items = this.getItems().filter(item => item.id !== id);
    this.saveItems(items);
  }

  static getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
        return INITIAL_NOTIFICATIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  static saveNotifications(notifs: NotificationItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }

  static addNotification(item_id: number, matched_item_id: number, score: number, message: string): NotificationItem {
    const notifs = this.getNotifications();
    const newId = notifs.length > 0 ? Math.max(...notifs.map(n => n.id)) + 1 : 1;
    const newNotif: NotificationItem = {
      id: newId,
      item_id,
      matched_item_id,
      score,
      message,
      is_read: false,
      timestamp: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    this.saveNotifications(notifs);
    return newNotif;
  }

  static markAllNotificationsRead(): void {
    const notifs = this.getNotifications().map(n => ({ ...n, is_read: true }));
    this.saveNotifications(notifs);
  }

  static getClaims(): Claim[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLAIMS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(INITIAL_CLAIMS));
        return INITIAL_CLAIMS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CLAIMS;
    }
  }

  static saveClaims(claims: Claim[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
    } catch (e) {
      console.error('Failed to save claims', e);
    }
  }

  static addClaim(itemId: number, itemName: string, proof: string, contact: string): Claim {
    const claims = this.getClaims();
    const items = this.getItems();
    const targetItem = items.find(i => i.id === itemId);

    let proofScore = 0.5;
    let sealedDetail = targetItem?.secret_verification_detail || 'No secret detail recorded by finder';

    if (targetItem?.secret_verification_detail) {
      // Calculate NLP similarity between claimant's proof and finder's sealed secret detail!
      const breakdown = NLPEngine.calculateBreakdown(
        proof,
        targetItem.secret_verification_detail,
        targetItem.category,
        targetItem.category,
        targetItem.colour,
        targetItem.colour
      );
      proofScore = breakdown.final_score;
    }

    const newId = claims.length > 0 ? Math.max(...claims.map(c => c.id)) + 1 : 1;
    const newClaim: Claim = {
      id: newId,
      item_id: itemId,
      item_name: itemName,
      proof_description: proof,
      claimant_contact: contact,
      claimant_contact_masked: maskContact(contact),
      finder_sealed_detail: sealedDetail,
      proof_similarity_score: Number(proofScore.toFixed(3)),
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    claims.unshift(newClaim);
    this.saveClaims(claims);

    this.updateItemStatus(itemId, 'claimed');
    return newClaim;
  }

  static updateClaimStatus(claimId: number, status: 'approved' | 'rejected'): void {
    const claims = this.getClaims();
    const claim = claims.find(c => c.id === claimId);
    if (claim) {
      claim.status = status;
      this.saveClaims(claims);
      if (status === 'approved') {
        this.updateItemStatus(claim.item_id, 'resolved');
      } else {
        this.updateItemStatus(claim.item_id, 'open');
      }
    }
  }

  static getStats(): Statistics {
    const items = this.getItems();
    const claims = this.getClaims();
    const total_lost = items.filter(i => i.item_type === 'lost').length;
    const total_found = items.filter(i => i.item_type === 'found').length;
    const resolved_items = items.filter(i => i.status === 'resolved').length;
    const total_items = items.length;
    const resolution_rate = total_items > 0 ? Number(((resolved_items / total_items) * 100).toFixed(1)) : 0;

    return {
      total_items,
      total_lost,
      total_found,
      resolved_items,
      total_claims: claims.length,
      resolution_rate,
    };
  }

  static resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(INITIAL_CLAIMS));
  }
}
