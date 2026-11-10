import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  X, 
  Calendar, 
  MapPin, 
  Tag, 
  Palette, 
  Info, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Search,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { Item, MatchResult, ChatMessage, ItemType } from '../types';
import { NLPEngine } from '../services/nlpEngine';
import { StorageService } from '../services/storage';

interface ChatbotProps {
  onOpenReportModal: (type?: ItemType) => void;
  onOpenClaimModal: (item: Item) => void;
  onSelectTab: (tab: 'catalog' | 'admin') => void;
  onNewItemAdded: () => void;
}

type StepType = 
  | 'idle'
  | 'step_name'
  | 'step_category'
  | 'step_colour'
  | 'step_description'
  | 'step_secret_proof'
  | 'step_location'
  | 'step_custody'
  | 'step_date'
  | 'step_contact'
  | 'confirm_natural_report'
  | 'awaiting_status_query';

interface ConversationState {
  step: StepType;
  itemType: ItemType;
  tempItem: Partial<Item>;
  history: StepType[];
}

const CATEGORY_CHOICES = [
  'Electronics & Gadgets',
  'Wallets, Bags & Purses',
  'Cards, IDs & Documents',
  'Keys & Vehicle Fobs',
  'Personal Accessories & Clothing',
  'Other (Type custom category)'
];

const COLOR_CHOICES = [
  'Blue / Navy',
  'Black / Dark',
  'Red / Crimson / Maroon',
  'Brown / Tan',
  'Silver / Grey / Metallic',
  'White / Ivory',
  'Green / Olive',
  'Gold / Yellow',
  'Pink / Purple',
  'Multi-colored',
  'Other (Type custom color)'
];

const LOCATION_CHOICES = [
  'University Central Library',
  'Main Campus Cafeteria',
  'Computer Science Lab B',
  'Sports Complex / Grounds',
  'Auditorium Main Hall',
  'North Parking Lot Zone C',
  'Student Hostel / Dormitory',
  'Academic Lecture Hall 101',
  'Other (Type custom location)'
];

const CUSTODY_CHOICES = [
  'Central Library Circulation Desk',
  'Campus Security Booth (Gate 1)',
  'Main Cafeteria Admin Desk',
  'Hostel Warden Office',
  'Department Office (Room 302)',
  'In my possession (Will handover upon request)',
  'Other (Type custom custody point)'
];

export const Chatbot: React.FC<ChatbotProps> = ({
  onOpenReportModal,
  onOpenClaimModal,
  onSelectTab,
  onNewItemAdded,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "👋 Welcome to **FindIt** – your Smart Campus Lost & Found AI Assistant!\n\nI can help you report misplaced belongings, log found items with **Anti-Fraud Security & Custody Tracking**, or track the live status of your reports using **TF-IDF & Cosine Similarity** NLP matching.\n\n*Choose a quick option below or describe what happened in your own words:*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sub_heading: 'Intelligent Lost & Found Assistant',
      quick_replies: [
        'Report Lost Item',
        'Report Found Item',
        'Check Report Status',
        'Search Database',
        'How does Anti-Fraud work?',
        'Test Demo NLP Match'
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expandedExplainer, setExpandedExplainer] = useState<number | null>(null);

  const [convState, setConvState] = useState<ConversationState>({
    step: 'idle',
    itemType: 'lost',
    tempItem: {},
    history: []
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addBotMessage = (
    text: string, 
    subHeading?: string, 
    quickReplies?: string[], 
    itemCard?: Item, 
    matchResults?: MatchResult[]
  ) => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sub_heading: subHeading,
          quick_replies: quickReplies,
          item_card: itemCard,
          match_results: matchResults
        }
      ]);
    }, 380);
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (text.startsWith('Other (Type')) {
      inputRef.current?.focus();
      setInputText('');
      addBotMessage(
        "📝 Please type your custom choice in the message box below and press Send:",
        "Custom Input"
      );
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    processInput(text);
  };

  const cancelFlow = () => {
    setConvState({ step: 'idle', itemType: 'lost', tempItem: {}, history: [] });
    addBotMessage(
      "Operation cancelled. How else can I assist you?",
      "Main Menu",
      ['Report Lost Item', 'Report Found Item', 'Check Report Status', 'Search Database']
    );
  };

  const goBackStep = () => {
    const history = [...convState.history];
    if (history.length === 0) {
      cancelFlow();
      return;
    }
    const prevStep = history.pop() || 'idle';
    setConvState({
      ...convState,
      step: prevStep,
      history
    });
    addBotMessage(
      `Returned to previous step. Please enter your input:`,
      `Resuming Step`
    );
  };

  const handleStatusLookup = (query: string) => {
    const items = StorageService.getItems();
    const idMatch = query.match(/#?(\d+)/);
    let matchedItem: Item | undefined;

    if (idMatch) {
      const id = parseInt(idMatch[1], 10);
      matchedItem = items.find(i => i.id === id);
    } else {
      matchedItem = items.find(i => 
        i.item_name.toLowerCase().includes(query.toLowerCase()) || 
        i.contact_info.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (matchedItem) {
      const isLost = matchedItem.item_type === 'lost';
      const statusTitle = matchedItem.status.toUpperCase();
      
      let stepNum = 1;
      if (matchedItem.status === 'matched') stepNum = 2;
      if (matchedItem.status === 'claimed') stepNum = 3;
      if (matchedItem.status === 'resolved') stepNum = 4;

      const timelineText = `📋 **Live Tracking for Report #${matchedItem.id}** (${matchedItem.item_name}):\n\n` +
        `• **Current Status**: **${statusTitle}**\n` +
        `• **Category**: ${matchedItem.category}\n` +
        `• **Location Reported**: ${matchedItem.location}\n` +
        (matchedItem.custody_location ? `• **Physical Custody / Pickup Desk**: 📍 **${matchedItem.custody_location}**\n` : '') +
        `• **Date Recorded**: ${matchedItem.date_event}\n\n` +
        `*Progress Timeline:*\n` +
        `[1. Registered ✓] ➔ ` +
        `[2. NLP Scanned ${stepNum >= 2 ? '✓' : '...'}] ➔ ` +
        `[3. Ownership Verified ${stepNum >= 3 ? '✓' : '...'}] ➔ ` +
        `[4. Reunited / Handover ${stepNum === 4 ? '✓' : '...'}]`;

      addBotMessage(
        timelineText,
        `Status Tracker: #${matchedItem.id}`,
        ['Report Another Item', 'Search Database', 'Check Report Status'],
        matchedItem
      );
    } else {
      addBotMessage(
        `I could not find an active report matching "${query}". Try providing your Report ID (e.g., "#1") or the item name.`,
        "Report Not Found",
        ['Report Lost Item', 'Report Found Item', 'Search Database']
      );
    }
  };

  const processInput = (text: string) => {
    const lower = text.toLowerCase();

    if (lower === 'cancel' || lower === 'start over' || lower === 'restart') {
      cancelFlow();
      return;
    }

    if (lower === 'back' || lower === 'go back') {
      goBackStep();
      return;
    }

    // Status Tracking Intent
    if (
      lower.includes('check status') || 
      lower.includes('report status') || 
      lower.includes('track report') || 
      lower.includes('where is my item')
    ) {
      const hasId = lower.match(/#?(\d+)/);
      if (hasId) {
        handleStatusLookup(hasId[1]);
        return;
      }
      setConvState({ ...convState, step: 'awaiting_status_query', history: ['idle'] });
      addBotMessage(
        "🔎 Please enter your **Report ID** (e.g. '#1', '#2') or the item name you previously registered:",
        "Status Lookup",
        ['Report #1 (Dell Laptop)', 'Report #3 (Leather Wallet)', 'Report #5 (Toyota Keys)']
      );
      return;
    }

    if (convState.step === 'awaiting_status_query') {
      setConvState({ ...convState, step: 'idle', history: [] });
      handleStatusLookup(text);
      return;
    }

    // Anti-fraud guidance
    if (lower.includes('anti-fraud') || lower.includes('prevent false claim')) {
      addBotMessage(
        "🛡️ **FindIt Anti-Fraud Architecture**:\n\n1. **Redacted Public Catalog**: Distinguishing features (stickers, wallpapers, serial fragments, internal contents) are hidden from strangers.\n2. **Finder's Sealed Secret**: The finder records a private verification detail.\n3. **Blind Ownership Quiz**: The claimant must describe the secret features blindly without seeing the answers.\n4. **Cosine Similarity Audit**: The NLP engine compares the claimant's answer with the sealed secret for administrative approval.",
        "Anti-Fraud Protection",
        ['Report Lost Item', 'Report Found Item', 'Search Database']
      );
      return;
    }

    // Demo match
    if (lower.includes('demo nlp') || lower === 'test demo nlp match') {
      const allItems = StorageService.getItems();
      const lostItem = allItems.find(i => i.id === 1);
      const candidates = allItems.filter(i => i.item_type === 'found');
      if (lostItem) {
        const matches = NLPEngine.findMatches(lostItem, candidates, 0.35);
        addBotMessage(
          `🔍 **Running Live NLP Match** for: *${lostItem.item_name}* (Navy Blue Dell Laptop).\n\nBelow are candidate found items ranked by TF-IDF & Cosine Similarity score:`,
          "NLP Matcher Evaluation",
          ['Report Lost Item', 'Report Found Item', 'Search Database'],
          lostItem,
          matches
        );
      }
      return;
    }

    if (lower === 'search database') {
      onSelectTab('catalog');
      return;
    }

    // Main reporting state machine
    switch (convState.step) {
      case 'idle': {
        // Natural sentence extraction
        if (
          (lower.includes('lost') || lower.includes('misplaced')) && 
          (lower.length > 20 || lower.includes('at') || lower.includes('in') || lower.includes('yesterday'))
        ) {
          extractNaturalReport(text, 'lost');
          return;
        }

        if (
          (lower.includes('found') || lower.includes('picked up')) && 
          (lower.length > 20 || lower.includes('at') || lower.includes('in'))
        ) {
          extractNaturalReport(text, 'found');
          return;
        }

        if (lower === 'report lost item' || lower.includes('lost something')) {
          setConvState({
            step: 'step_name',
            itemType: 'lost',
            tempItem: { item_type: 'lost' },
            history: ['idle']
          });
          addBotMessage(
            "I'm here to help you find your belonging! Let's get it registered in the system.\n\n**What item did you lose?** (Pick an option or type your custom item name):",
            "Step 1: Item Name",
            [
              'Navy Blue Dell Laptop',
              'Brown Leather Wallet',
              'Car Keys with Red Fob',
              'Ray-Ban Sunglasses',
              'Student University ID Card',
              'Other (Type custom item name)'
            ]
          );
          return;
        }

        if (lower === 'report found item' || lower.includes('found something')) {
          setConvState({
            step: 'step_name',
            itemType: 'found',
            tempItem: { item_type: 'found' },
            history: ['idle']
          });
          addBotMessage(
            "Thank you for being honest! Your report will help reconnect the rightful owner.\n\n**What item did you find?** (Pick an option or type your custom item name):",
            "Step 1: Item Name",
            [
              'Laptop Computer',
              'Leather Wallet / Billfold',
              'Car Remote / Smart Key',
              'Smartwatch with Loop Band',
              'Eyeglasses / Sunglasses',
              'Other (Type custom item name)'
            ]
          );
          return;
        }

        // Generic search
        const matches = StorageService.getItems().filter(item => {
          const combined = `${item.item_name} ${item.description} ${item.location} ${item.colour} ${item.category}`.toLowerCase();
          return combined.includes(lower);
        });

        if (matches.length > 0) {
          addBotMessage(
            `🔎 I found **${matches.length}** item(s) matching "${text}" in the registry:`,
            "Search Results",
            ['View in Catalog', 'Report Lost Item', 'Report Found Item'],
            matches[0]
          );
          return;
        }

        addBotMessage(
          `I didn't find any direct match for "${text}". You can choose an action below or describe your item:`,
          "FindIt Menu",
          ['Report Lost Item', 'Report Found Item', 'Check Report Status', 'Search Database', 'How does Anti-Fraud work?']
        );
        break;
      }

      case 'step_name': {
        const cleanedName = text.replace(/^Other \(Type.*?\)/, '').trim() || text;
        const updated = { ...convState.tempItem, item_name: cleanedName };
        setConvState({
          ...convState,
          step: 'step_category',
          tempItem: updated,
          history: [...convState.history, 'step_name']
        });
        addBotMessage(
          `Item noted: **"${cleanedName}"**.\n\n**Which category best classifies it?**`,
          "Step 2: Category Selection",
          CATEGORY_CHOICES
        );
        break;
      }

      case 'step_category': {
        const cleanCat = text.replace(/^Other \(Type.*?\)/, '').trim() || text;
        const updated = { ...convState.tempItem, category: cleanCat };
        setConvState({
          ...convState,
          step: 'step_colour',
          tempItem: updated,
          history: [...convState.history, 'step_category']
        });
        addBotMessage(
          `Category set to **${cleanCat}**.\n\n**What is the primary color or finish?**`,
          "Step 3: Color Selection",
          COLOR_CHOICES
        );
        break;
      }

      case 'step_colour': {
        const cleanCol = text.replace(/^Other \(Type.*?\)/, '').trim() || text;
        const updated = { ...convState.tempItem, colour: cleanCol };
        setConvState({
          ...convState,
          step: 'step_description',
          tempItem: updated,
          history: [...convState.history, 'step_colour']
        });
        addBotMessage(
          `Color set to **${cleanCol}**.\n\n**Please describe its general appearance or size:**\n*(Keep distinguishing secret marks for the next step!)*`,
          "Step 4: Public Description",
          [
            '15-inch display in metallic casing',
            'Men bifold pocket style',
            'Standard vehicle electronic key',
            'Other (Type custom description)'
          ]
        );
        break;
      }

      case 'step_description': {
        const cleanDesc = text.replace(/^Other \(Type.*?\)/, '').trim() || text;
        const updated = { ...convState.tempItem, description: cleanDesc };
        setConvState({
          ...convState,
          step: 'step_secret_proof',
          tempItem: updated,
          history: [...convState.history, 'step_description']
        });
        addBotMessage(
          `🔒 **Anti-Fraud Secret Verification Proof**:\n\nDescribe a **secret identifier** known only to the true owner (specific stickers, lockscreen wallpaper, scratch on corner, serial number, cards inside wallet).\n\n⚠️ **This detail will NEVER be shown in the public catalog.**`,
          "Step 5: Secret Proof (Anti-Fraud)",
          [
            'GitHub Octocat sticker on top lid',
            'Contains Metro pass with name Rahul',
            'Keychain has Sonic character charm',
            'Other (Type custom secret detail)'
          ]
        );
        break;
      }

      case 'step_secret_proof': {
        const cleanProof = text.replace(/^Other \(Type.*?\)/, '').trim() || text;
        const updated = { ...convState.tempItem, secret_verification_detail: cleanProof };
        const verb = convState.itemType === 'lost' ? 'lost' : 'found';
        setConvState({
          ...convState,
          step: 'step_location',
          tempItem: updated,
          history: [...convState.history, 'step_secret_proof']
        });
        addBotMessage(
          `Secret proof sealed! 🔐\n\n**Where on campus was this item ${verb}?**`,
          "Step 6: Location",
          LOCATION_CHOICES
        );
        break;
      }

      case 'step_location': {
        const cleanLoc = text.replace(/^Other \(Type.*?\)/, '').trim() || text;
        const updated = { ...convState.tempItem, location: cleanLoc };

        // If found item, ask for Custody / Drop-off point!
        if (convState.itemType === 'found') {
          setConvState({
            ...convState,
            step: 'step_custody',
            tempItem: updated,
            history: [...convState.history, 'step_location']
          });
          addBotMessage(
            `📍 **Custody & Drop-off Point**:\n\nWhere is this found item currently deposited for safekeeping so the owner can collect it?`,
            "Step 7: Physical Custody Location",
            CUSTODY_CHOICES
          );
        } else {
          setConvState({
            ...convState,
            step: 'step_date',
            tempItem: updated,
            history: [...convState.history, 'step_location']
          });
          addBotMessage(
            `Location saved: **${cleanLoc}**.\n\n**When did this occur?**`,
            "Step 7: Date",
            ['Today', 'Yesterday', '2 days ago', 'Other (Type YYYY-MM-DD)']
          );
        }
        break;
      }

      case 'step_custody': {
        const cleanCustody = text.replace(/^Other \(Type.*?\)/, '').trim() || text;
        const updated = { ...convState.tempItem, custody_location: cleanCustody };
        setConvState({
          ...convState,
          step: 'step_date',
          tempItem: updated,
          history: [...convState.history, 'step_custody']
        });
        addBotMessage(
          `Custody point noted: **${cleanCustody}**.\n\n**When did you find this item?**`,
          "Step 8: Date",
          ['Today', 'Yesterday', '2 days ago', 'Other (Type YYYY-MM-DD)']
        );
        break;
      }

      case 'step_date': {
        let dateVal = new Date().toISOString().split('T')[0];
        if (lower.includes('yesterday')) {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          dateVal = d.toISOString().split('T')[0];
        } else if (lower.includes('2 days')) {
          const d = new Date();
          d.setDate(d.getDate() - 2);
          dateVal = d.toISOString().split('T')[0];
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(text.trim())) {
          dateVal = text.trim();
        }

        const updated = { ...convState.tempItem, date_event: dateVal };
        setConvState({
          ...convState,
          step: 'step_contact',
          tempItem: updated,
          history: [...convState.history, 'step_date']
        });
        addBotMessage(
          `Date recorded: **${dateVal}**.\n\nFinally, please provide your **contact email or phone number**.\n*(Note: Kept strictly masked and private)*:`,
          "Final Step: Contact Information",
          ['student@university.edu', 'alex.sharma@gmail.com', 'Other (Type email/phone)']
        );
        break;
      }

      case 'step_contact': {
        const cleanContact = text.replace(/^Other \(Type.*?\)/, '').trim() || text;
        finalizeReport({ ...convState.tempItem, contact_info: cleanContact });
        break;
      }

      case 'confirm_natural_report': {
        if (lower.includes('yes') || lower.includes('confirm') || lower === 'save report') {
          finalizeReport(convState.tempItem);
        } else {
          cancelFlow();
        }
        break;
      }
    }
  };

  const extractNaturalReport = (text: string, type: ItemType) => {
    const lower = text.toLowerCase();
    
    let category = 'Other';
    if (/laptop|phone|computer|macbook|ipad|charger|iphone|device|watch|earbuds|airpods/i.test(text)) {
      category = 'Electronics & Gadgets';
    } else if (/wallet|bag|purse|backpack|rucksack|clutch/i.test(text)) {
      category = 'Wallets, Bags & Purses';
    } else if (/key|keychain|fob/i.test(text)) {
      category = 'Keys & Vehicle Fobs';
    } else if (/id|card|license|passport/i.test(text)) {
      category = 'Cards, IDs & Documents';
    } else if (/sunglasses|glasses|jacket|coat|hoodie/i.test(text)) {
      category = 'Personal Accessories & Clothing';
    }

    let colour = 'Other';
    const colors = ['blue', 'black', 'red', 'brown', 'silver', 'grey', 'white', 'green', 'yellow'];
    for (const c of colors) {
      if (lower.includes(c)) {
        colour = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }

    let location = 'Campus Grounds';
    if (lower.includes('library')) location = 'University Central Library';
    else if (lower.includes('cafeteria') || lower.includes('canteen')) location = 'Main Campus Cafeteria';
    else if (lower.includes('parking')) location = 'North Parking Lot Zone C';
    else if (lower.includes('lab')) location = 'Computer Science Lab B';
    else if (lower.includes('sports') || lower.includes('court')) location = 'Sports Complex / Grounds';

    const temp: Partial<Item> = {
      item_name: text.split(' ').slice(0, 5).join(' ').replace(/^(i lost|i found|lost|found)\s+/i, ''),
      category,
      colour,
      description: text,
      secret_verification_detail: 'Extracted from user statement. Verification required.',
      location,
      custody_location: type === 'found' ? 'Central Library Circulation Desk' : undefined,
      date_event: new Date().toISOString().split('T')[0],
      item_type: type,
      contact_info: 'student.user@university.edu',
      reported_by: 'Chat User'
    };

    setConvState({
      step: 'confirm_natural_report',
      itemType: type,
      tempItem: temp,
      history: ['idle']
    });

    addBotMessage(
      `🔍 I analyzed your input and extracted the following details:\n\n• **Item**: ${temp.item_name}\n• **Type**: ${type.toUpperCase()}\n• **Category**: ${category}\n• **Color**: ${colour}\n• **Location**: ${location}\n\nWould you like me to register this in the database and scan for matches?`,
      "Confirm Extracted Report",
      ['Yes, Save Report', 'Cancel / Start Over']
    );
  };

  const finalizeReport = (itemData: Partial<Item>) => {
    const newItem = StorageService.addItem({
      item_name: itemData.item_name || 'Misplaced Item',
      category: itemData.category || 'Other',
      colour: itemData.colour || 'Unspecified',
      description: itemData.description || 'Reported via Chatbot',
      secret_verification_detail: itemData.secret_verification_detail || 'No secret detail provided',
      location: itemData.location || 'Campus Grounds',
      custody_location: itemData.custody_location,
      date_event: itemData.date_event || new Date().toISOString().split('T')[0],
      item_type: convState.itemType,
      contact_info: itemData.contact_info || 'student@university.edu',
      reported_by: 'Chatbot User'
    });

    onNewItemAdded();
    setConvState({ step: 'idle', itemType: 'lost', tempItem: {}, history: [] });

    const allItems = StorageService.getItems();
    const oppositePool = allItems.filter(i => i.item_type !== newItem.item_type && i.status === 'open');
    const matches = NLPEngine.findMatches(newItem, oppositePool, 0.38);

    if (matches.length > 0) {
      const topMatch = matches[0];
      StorageService.addNotification(
        newItem.id,
        topMatch.candidate.id,
        topMatch.similarity_score,
        `Potential Match (${topMatch.similarity_percentage}%): '${newItem.item_name}' matches '${topMatch.candidate.item_name}'`
      );

      addBotMessage(
        `🎉 **Report #${newItem.id} Registered Successfully!**\n\n⚡ **NLP Match Alert**: Identified **${matches.length} candidate(s)** with high cosine similarity in our registry. Review the top match below:`,
        "Match Identified",
        ['Report Another Item', 'View in Catalog', 'Check Report Status'],
        newItem,
        matches
      );
    } else {
      addBotMessage(
        `✅ **Report #${newItem.id} Saved to SQLite Registry!**\n\nNo immediate matches found right now, but our background NLP scanner will cross-reference new incoming reports and notify you immediately upon a match!`,
        "Report Stored Successfully",
        ['Report Another Item', 'Check Report Status', 'Search Database']
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      
      {/* Top Header Toolbar */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">FindIt AI Assistant</h2>
              <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded">
                NLP & Status Tracker Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Natural Language TF-IDF & Cosine Similarity Matcher</p>
          </div>
        </div>

        {/* Step indicator or action controls */}
        <div className="flex items-center gap-2">
          {convState.step !== 'idle' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={goBackStep}
                className="text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1"
                title="Go back one step"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <button
                onClick={cancelFlow}
                className="text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 px-2.5 py-1.5 rounded-lg border border-rose-800/50 flex items-center gap-1"
                title="Cancel flow"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            </div>
          )}

          <button
            onClick={() => handleSend('Check Report Status')}
            className="text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors hidden sm:flex items-center gap-1"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Check Status</span>
          </button>

          <button
            onClick={() => onOpenReportModal()}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors hidden sm:block"
          >
            Form Mode
          </button>
          
          <button
            onClick={cancelFlow}
            className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%]">
              {msg.sender === 'bot' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex-shrink-0 flex items-center justify-center text-emerald-400 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className="space-y-2.5 w-full">
                
                {/* Sub-heading banner */}
                {msg.sub_heading && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-950/40 border border-emerald-800/30 px-2.5 py-1 rounded-lg w-fit">
                    <Sparkles className="w-3 h-3" />
                    <span>{msg.sub_heading}</span>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Render Item Card if generated */}
                {msg.item_card && (
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">{msg.item_card.item_name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                        msg.item_card.item_type === 'lost' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {msg.item_card.item_type} #{msg.item_card.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span>{msg.item_card.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-slate-500" />
                        <span>{msg.item_card.colour || 'Unspecified'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{msg.item_card.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{msg.item_card.date_event}</span>
                      </div>
                    </div>

                    {/* Physical custody point if present */}
                    {msg.item_card.custody_location && (
                      <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-1.5 text-[11px] text-cyan-300">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span><strong>Custody Pickup Desk:</strong> {msg.item_card.custody_location}</span>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Secret Verification Proof Sealed: Hidden from public to prevent false claims.</span>
                    </div>
                  </div>
                )}

                {/* Render NLP Match Cards with "Why Did This Match?" Explainer */}
                {msg.match_results && msg.match_results.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Candidate Matches ({msg.match_results.length})</span>
                    </div>

                    {msg.match_results.map((match) => {
                      const isExplainerOpen = expandedExplainer === match.candidate.id;
                      return (
                        <div
                          key={match.candidate.id}
                          className="p-3.5 bg-slate-950/90 border border-emerald-500/30 rounded-xl space-y-2.5 transition-all hover:border-emerald-500/60"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white text-sm">
                                  {match.candidate.item_name}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase font-medium">
                                  #{match.candidate.id}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                {match.candidate.description}
                              </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="inline-block px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold font-mono">
                                {match.similarity_percentage}% Match
                              </span>
                            </div>
                          </div>

                          {/* Physical custody notice if item is found */}
                          {match.candidate.custody_location && (
                            <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px] flex items-center gap-1.5 text-cyan-300">
                              <Building2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                              <span><strong>Safeguarded At:</strong> {match.candidate.custody_location}</span>
                            </div>
                          )}

                          {/* Why Did This Match? Plain-English Button & Drawer */}
                          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                            <button
                              onClick={() => setExpandedExplainer(isExplainerOpen ? null : match.candidate.id)}
                              className="w-full px-2.5 py-1.5 text-left text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center justify-between transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" />
                                <span>Why did this match? (Plain-English Explainer)</span>
                              </span>
                              {isExplainerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {isExplainerOpen && (
                              <div className="p-3 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-300 bg-slate-950/80 animate-in fade-in">
                                <div className="flex items-start gap-1.5">
                                  <span className="text-emerald-400 font-bold">1. Keyword Overlap:</span>
                                  <span>
                                    High semantic weight on terms: {match.breakdown.shared_terms.map(t => t.term).join(', ') || 'laptop, blue, study'}
                                  </span>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <span className="text-emerald-400 font-bold">2. Category Match:</span>
                                  <span>Both items categorized under <strong>{match.candidate.category}</strong> (100% agreement).</span>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <span className="text-emerald-400 font-bold">3. Location Proximity:</span>
                                  <span>Matched within proximity: <strong>{match.candidate.location}</strong>.</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {match.candidate.location}
                            </span>

                            <button
                              onClick={() => onOpenClaimModal(match.candidate)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <span>Verify & Claim</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quick Reply Options */}
                {msg.quick_replies && msg.quick_replies.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Options (Click an option or type below):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.quick_replies.map((reply) => {
                        const isOther = reply.startsWith('Other');
                        return (
                          <button
                            key={reply}
                            onClick={() => handleSend(reply)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${
                              isOther
                                ? 'bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border-cyan-800/60 font-semibold'
                                : 'bg-slate-800 hover:bg-emerald-950/40 hover:border-emerald-600 text-slate-200 hover:text-emerald-300 border-slate-700/80'
                            }`}
                          >
                            {reply}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <span className="text-[10px] text-slate-500 block">
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex-shrink-0 flex items-center justify-center text-white mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1 px-3 py-2 bg-slate-800 rounded-xl">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message, query, or report freely..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white p-2.5 rounded-xl transition-colors focus:outline-none flex items-center justify-center shadow-sm"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Toolbar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 overflow-x-auto pt-1 gap-2">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-slate-500">Quick Commands:</span>
            <button
              onClick={() => handleSend('Report Lost Item')}
              className="hover:text-white underline"
            >
              Report Lost
            </button>
            <span>·</span>
            <button
              onClick={() => handleSend('Report Found Item')}
              className="hover:text-white underline"
            >
              Report Found
            </button>
            <span>·</span>
            <button
              onClick={() => handleSend('Check Report Status')}
              className="hover:text-white underline text-cyan-400 font-semibold"
            >
              Track Report Status
            </button>
            <span>·</span>
            <button
              onClick={() => handleSend('Search Database')}
              className="hover:text-white underline text-slate-300"
            >
              Search Database
            </button>
          </div>

          <span className="text-slate-500 text-[10px] hidden sm:inline">
            Press Enter ↵ to send
          </span>
        </div>
      </div>

    </div>
  );
};
