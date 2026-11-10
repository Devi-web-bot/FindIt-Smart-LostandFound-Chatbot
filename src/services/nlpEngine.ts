import { Item, MatchBreakdown, MatchResult } from '../types';

export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 
  'aren', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 
  'but', 'by', 'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 
  'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 
  'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 
  'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 
  'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 
  'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 
  'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'lost', 'found', 
  'item', 'please', 'help', 'got', 'near', 'yesterday', 'today', 'left', 'around'
]);

export const SYNONYMS: Record<string, string[]> = {
  backpack: ['bag', 'rucksack', 'knapsack', 'pack', 'bookbag'],
  rucksack: ['backpack', 'bag', 'knapsack', 'pack'],
  bag: ['backpack', 'rucksack', 'purse', 'handbag', 'tote'],
  wallet: ['purse', 'billfold', 'moneybag', 'pouch'],
  purse: ['wallet', 'bag', 'handbag', 'clutch'],
  phone: ['mobile', 'cellphone', 'smartphone', 'iphone', 'android', 'device'],
  mobile: ['phone', 'cellphone', 'smartphone', 'device'],
  smartphone: ['phone', 'mobile', 'iphone', 'android'],
  iphone: ['phone', 'mobile', 'smartphone', 'apple'],
  laptop: ['notebook', 'macbook', 'computer', 'pc', 'chromebook'],
  computer: ['laptop', 'pc', 'macbook', 'notebook'],
  keys: ['keychain', 'carkey', 'keyring', 'fob'],
  keychain: ['keys', 'keyring', 'key fob'],
  glasses: ['spectacles', 'eyewear', 'shades', 'sunglasses', 'frames'],
  spectacles: ['glasses', 'eyewear', 'sunglasses'],
  sunglasses: ['shades', 'glasses', 'spectacles', 'eyewear'],
  umbrella: ['parasol', 'rainshade'],
  watch: ['smartwatch', 'timepiece', 'wristband', 'applewatch', 'fitbit'],
  smartwatch: ['watch', 'timepiece', 'applewatch'],
  bottle: ['flask', 'thermos', 'sipper', 'waterbottle'],
  id: ['card', 'badge', 'identity', 'license', 'pass'],
  card: ['id', 'badge', 'pass'],
  earphones: ['headphones', 'airpods', 'earbuds', 'headset'],
  earbuds: ['airpods', 'earphones', 'headphones'],
  airpods: ['earbuds', 'earphones', 'headphones', 'apple'],
  jacket: ['coat', 'hoodie', 'sweater', 'cardigan', 'blazer'],
  red: ['crimson', 'scarlet', 'maroon', 'ruby', 'burgundy'],
  crimson: ['red', 'maroon', 'burgundy'],
  blue: ['navy', 'azure', 'cyan', 'cobalt', 'indigo', 'denim'],
  navy: ['blue', 'dark blue'],
  black: ['dark', 'charcoal', 'onyx', 'ebony'],
  white: ['light', 'ivory', 'pearl'],
  green: ['olive', 'emerald', 'lime', 'forest'],
  yellow: ['gold', 'amber', 'mustard']
};

export class NLPEngine {
  /**
   * Tokenize and clean text by removing punctuation and stop words.
   */
  static tokenize(text: string): string[] {
    if (!text) return [];
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const rawTokens = cleaned.split(/\s+/).filter(Boolean);
    return rawTokens.filter(t => !STOP_WORDS.has(t) && t.length > 1);
  }

  /**
   * Expand tokens with domain synonyms to bridge vocabulary mismatches.
   */
  static expandSynonyms(tokens: string[]): string[] {
    const expanded = [...tokens];
    for (const t of tokens) {
      if (SYNONYMS[t]) {
        for (const syn of SYNONYMS[t]) {
          expanded.push(syn);
        }
      }
    }
    return expanded;
  }

  /**
   * Compute Term Frequency (TF).
   */
  static computeTF(tokens: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const t of tokens) {
      counts[t] = (counts[t] || 0) + 1;
    }
    const total = tokens.length;
    if (total === 0) return {};

    const tf: Record<string, number> = {};
    for (const [term, count] of Object.entries(counts)) {
      tf[term] = count / total;
    }
    return tf;
  }

  /**
   * Compute Inverse Document Frequency (IDF) for a two-document or corpus comparison.
   */
  static computeIDF(corpus: string[][]): Record<string, number> {
    const nDocs = corpus.length;
    if (nDocs === 0) return {};

    const docFreq: Record<string, number> = {};
    for (const docTokens of corpus) {
      const unique = new Set(docTokens);
      for (const t of unique) {
        docFreq[t] = (docFreq[t] || 0) + 1;
      }
    }

    const idf: Record<string, number> = {};
    for (const [term, df] of Object.entries(docFreq)) {
      idf[term] = Math.log((1 + nDocs) / (1 + df)) + 1.0;
    }
    return idf;
  }

  /**
   * Calculate TF-IDF weight vector.
   */
  static getTFIDFVector(tokens: string[], idf: Record<string, number>): Record<string, number> {
    const tf = this.computeTF(tokens);
    const vector: Record<string, number> = {};
    for (const [term, tfVal] of Object.entries(tf)) {
      const idfVal = idf[term] || 1.4;
      vector[term] = tfVal * idfVal;
    }
    return vector;
  }

  /**
   * Calculate Cosine Similarity: (A · B) / (||A|| * ||B||)
   */
  static cosineSimilarity(vec1: Record<string, number>, vec2: Record<string, number>): number {
    const keys1 = Object.keys(vec1);
    const keys2 = new Set(Object.keys(vec2));
    const commonKeys = keys1.filter(k => keys2.has(k));

    if (commonKeys.length === 0) return 0;

    let dotProduct = 0;
    for (const k of commonKeys) {
      dotProduct += vec1[k] * vec2[k];
    }

    let norm1Sq = 0;
    for (const val of Object.values(vec1)) norm1Sq += val * val;

    let norm2Sq = 0;
    for (const val of Object.values(vec2)) norm2Sq += val * val;

    const norm1 = Math.sqrt(norm1Sq);
    const norm2 = Math.sqrt(norm2Sq);

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (norm1 * norm2);
  }

  /**
   * Full similarity breakdown with mathematical details for visualization and explanation.
   */
  static calculateBreakdown(
    text1: string,
    text2: string,
    cat1 = '',
    cat2 = '',
    col1 = '',
    col2 = ''
  ): MatchBreakdown {
    const rawTokens1 = this.tokenize(text1);
    const rawTokens2 = this.tokenize(text2);

    const tokens1 = this.expandSynonyms(rawTokens1);
    const tokens2 = this.expandSynonyms(rawTokens2);

    const corpus = [tokens1, tokens2];
    const idf = this.computeIDF(corpus);

    const vec1 = this.getTFIDFVector(tokens1, idf);
    const vec2 = this.getTFIDFVector(tokens2, idf);

    const textCosine = this.cosineSimilarity(vec1, vec2);

    // Category scoring
    let categoryScore = 0.5;
    if (cat1 && cat2) {
      if (cat1.trim().toLowerCase() === cat2.trim().toLowerCase()) {
        categoryScore = 1.0;
      } else if (cat1.toLowerCase().includes('other') || cat2.toLowerCase().includes('other')) {
        categoryScore = 0.5;
      } else {
        categoryScore = 0.0;
      }
    }

    // Color scoring
    let colorScore = 0.5;
    if (col1 && col2) {
      const c1 = col1.trim().toLowerCase();
      const c2 = col2.trim().toLowerCase();
      if (c1 === c2) {
        colorScore = 1.0;
      } else if (
        (SYNONYMS[c1] && SYNONYMS[c1].includes(c2)) ||
        (SYNONYMS[c2] && SYNONYMS[c2].includes(c1))
      ) {
        colorScore = 0.85;
      } else {
        colorScore = 0.0;
      }
    }

    // Identify shared terms
    const sharedTerms = Object.keys(vec1)
      .filter(k => vec2[k] !== undefined)
      .map(k => ({
        term: k,
        weight1: Number(vec1[k].toFixed(3)),
        weight2: Number(vec2[k].toFixed(3)),
      }))
      .sort((a, b) => Math.max(b.weight1, b.weight2) - Math.max(a.weight1, a.weight2));

    // Weighted composite score: 65% text semantics, 20% category, 15% color
    let finalScore = textCosine;
    if (cat1 && cat2 && col1 && col2) {
      finalScore = textCosine * 0.65 + categoryScore * 0.20 + colorScore * 0.15;
    } else if (cat1 && cat2) {
      finalScore = textCosine * 0.75 + categoryScore * 0.25;
    }

    const clampedScore = Math.min(1.0, Math.max(0.0, finalScore));

    const roundVec = (v: Record<string, number>) => {
      const res: Record<string, number> = {};
      for (const [k, val] of Object.entries(v)) {
        res[k] = Number(val.toFixed(3));
      }
      return res;
    };

    return {
      final_score: Number(clampedScore.toFixed(4)),
      percentage: Math.round(clampedScore * 100),
      text_cosine_similarity: Number(textCosine.toFixed(4)),
      category_score: categoryScore,
      color_score: colorScore,
      tokens1: rawTokens1,
      tokens2: rawTokens2,
      shared_terms: sharedTerms,
      vector1: roundVec(vec1),
      vector2: roundVec(vec2),
    };
  }

  /**
   * Find and rank matches in an item database.
   */
  static findMatches(target: Item, candidates: Item[], threshold = 0.35): MatchResult[] {
    const targetText = `${target.item_name} ${target.description} ${target.colour} ${target.location}`;

    const results: MatchResult[] = [];
    for (const cand of candidates) {
      if (cand.id === target.id) continue;
      // Compare opposite item types
      if (cand.item_type === target.item_type) continue;

      const candText = `${cand.item_name} ${cand.description} ${cand.colour} ${cand.location}`;
      const breakdown = this.calculateBreakdown(
        targetText,
        candText,
        target.category,
        cand.category,
        target.colour,
        cand.colour
      );

      if (breakdown.final_score >= threshold) {
        results.push({
          candidate: cand,
          similarity_score: breakdown.final_score,
          similarity_percentage: breakdown.percentage,
          breakdown,
        });
      }
    }

    results.sort((a, b) => b.similarity_score - a.similarity_score);
    return results;
  }
}
