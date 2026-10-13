/**
 * High-Performance Algorithmic Headline Transformer
 * Synthesizes viral, high-tension, click-worthy 2-line canvas banner headlines
 * from raw news wire feeds, guaranteeing the headline is NEVER raw unedited news text.
 */

// Noise prefixes to strip from raw press releases
const NOISE_PREFIXES = [
  /^(ukmto|centcom|idf|iaf|pentagon|kremlin|white house|nato|un|iaea)\s+(confirms?|reports?|says?|warns?|announces?|claims?)\s+/i,
  /^(breaking|alert|update|exclusive|just in|bulletin|flash|report|urgent):\s*/i,
  /^(officials?|spokespersons?|ministry|military|authorities)\s+(say|confirm|state|claim|announce)\s+that\s+/i,
  /^(according to|sources say|reports indicate)\s+/i,
  /\s*[-–—|]\s*(Reuters|AP|BBC|Al Jazeera|CNN|Bloomberg|AFP|TASS|Sputnik|Kyiv Independent|Ukrinform|Times of Israel|Haaretz|Jerusalem Post|WSJ|NYT|Politico|Defense News|Naval News).*$/i,
];

// High-impact tactical keywords for automatic white contrast highlight badge
export const TACTICAL_IMPACT_KEYWORDS = [
  'MISSILE', 'MISSILES', 'DRONE', 'DRONES', 'AIRSTRIKE', 'AIRSTRIKES',
  'DEFENSE', 'WARSHIP', 'SUBMARINE', 'HORMUZ', 'RED SEA', 'ZAPORIZHZHIA',
  'CRIMEA', 'TAIWAN', 'BEIRUT', 'TEHRAN', 'KYIV', 'MOSCOW', 'INTERCEPT',
  'BALLISTIC', 'RADAR', 'AIRSPACE', 'CARRIER', 'HYPERSONIC', 'WARHEAD',
  'OFFENSIVE', 'BLOCKADE', 'EXPLOSIONS', 'WARFARE', 'FIGHTER', 'BARRAGE',
  'RETALIATION', 'CHAOS', 'STRIKE', 'STRUCK', 'ATTACK', 'DESTROYED', 'OBLITERATED'
];

/**
 * Clean source noise and press agency artifacts from raw news title
 */
export function cleanRawTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  let cleaned = rawTitle.trim();

  for (const regex of NOISE_PREFIXES) {
    cleaned = cleaned.replace(regex, '');
  }

  // Remove surrounding quotes, brackets, and extra spaces
  cleaned = cleaned
    .replace(/^["'‘“]+|["'’”]+$/g, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Automatically balances any text into exactly 2 lines at the optimal center space
 */
export function balanceTwoLines(text: string): string {
  const clean = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').filter(Boolean);
  if (words.length <= 1) return clean.toUpperCase();
  if (words.length === 2) return `${words[0]}\n${words[1]}`.toUpperCase();

  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');
  return `${line1}\n${line2}`.toUpperCase();
}

/**
 * Extract location or subject candidate from title
 */
function extractEntities(cleaned: string): { subject: string; action: string; location: string } {
  const lower = cleaned.toLowerCase();
  let location = '';
  if (lower.includes('hormuz')) location = 'HORMUZ';
  else if (lower.includes('red sea')) location = 'RED SEA';
  else if (lower.includes('zaporizhzhia')) location = 'ZAPORIZHZHIA';
  else if (lower.includes('kyiv')) location = 'KYIV';
  else if (lower.includes('crimea')) location = 'CRIMEA';
  else if (lower.includes('beirut')) location = 'BEIRUT';
  else if (lower.includes('tehran')) location = 'TEHRAN';
  else if (lower.includes('taiwan')) location = 'TAIWAN';
  else if (lower.includes('gaza')) location = 'GAZA';
  else if (lower.includes('black sea')) location = 'BLACK SEA';

  let action = '';
  if (lower.includes('missile') || lower.includes('glide bomb')) action = 'MISSILE STRIKE';
  else if (lower.includes('drone')) action = 'DRONE SWARM';
  else if (lower.includes('airstrike') || lower.includes('strike')) action = 'AIRSTRIKE';
  else if (lower.includes('struck') || lower.includes('attack')) action = 'MASSIVE ATTACK';
  else if (lower.includes('intercept')) action = 'DEFENSE INTERCEPT';
  else if (lower.includes('blockade')) action = 'NAVAL BLOCKADE';

  return { subject: '', action, location };
}

/**
 * 1. 🔥 VIRAL HOOK (Viral, Sensasional & Bikin Penasaran)
 */
export function toViralHook(rawTitle: string): string {
  const cleaned = cleanRawTitle(rawTitle);
  const words = cleaned.toUpperCase().split(/\s+/).filter(Boolean);
  const { action, location } = extractEntities(cleaned);

  if (location && action) {
    return `CHAOS IN ${location}:\n${action} ROCKS THE REGION`;
  }
  if (location) {
    const keyAction = words.slice(0, 4).join(' ');
    return `RED ALERT IN ${location}:\n${keyAction}`;
  }

  // General high-engagement viral hook
  const punchyRest = words.slice(0, 6).join(' ');
  const mid = Math.ceil(words.length / 2);
  const l1 = words.slice(0, Math.min(3, mid)).join(' ');
  const l2 = words.slice(Math.min(3, mid), Math.min(7, words.length)).join(' ');
  return `MASSIVE ESCALATION:\n${l1} ${l2}`.trim();
}

/**
 * 2. ⚡ PUNCHY IMPACT (2 Baris Tajam & Padat, Tanpa Basa-basi)
 */
export function toImpactHeadline(rawTitle: string): string {
  const cleaned = cleanRawTitle(rawTitle);
  const words = cleaned.toUpperCase().split(/\s+/).filter(Boolean);

  // Take most punchy words (up to 7 words)
  const selected = words.slice(0, Math.min(7, words.length));
  return balanceTwoLines(selected.join(' '));
}

/**
 * 3. 🎯 TACTICAL OSINT (Gaya Laporan Kawat Militer / Intel)
 */
export function toTacticalOSINT(rawTitle: string): string {
  const cleaned = cleanRawTitle(rawTitle);
  const words = cleaned.toUpperCase().split(/\s+/).filter(Boolean);
  const { location } = extractEntities(cleaned);

  if (location) {
    const subWords = words.filter(w => !w.includes(location)).slice(0, 4).join(' ');
    return `THEATER UPDATE [${location}]:\n${subWords || 'TACTICAL STRIKES REPORTED'}`;
  }

  const mid = Math.ceil(Math.min(6, words.length) / 2);
  return `TACTICAL WIRE CONFIRMED:\n${words.slice(0, 5).join(' ')}`;
}

/**
 * 4. 💥 DRAMATIC ALERT (Nada Krisis & Genting)
 */
export function toDramaticAlert(rawTitle: string): string {
  const cleaned = cleanRawTitle(rawTitle);
  const words = cleaned.toUpperCase().split(/\s+/).filter(Boolean);
  const { location } = extractEntities(cleaned);

  if (location) {
    return `POINT OF NO RETURN:\n${location} STRUCK IN INTENSE ASSAULT`;
  }

  return `CRITICAL TURNING POINT:\n${words.slice(0, 5).join(' ')}`;
}

/**
 * 5. 🇮🇩 VIRAL INDO (Gaya Akun Berita Militer Viral Indonesia)
 */
export function toIndoViral(rawTitle: string): string {
  const cleaned = cleanRawTitle(rawTitle);
  const { location, action } = extractEntities(cleaned);

  if (location && action) {
    return `SITUASI MENCEKAM!\n${action} HANTAM WILAYAH ${location}`;
  }
  if (location) {
    return `GEMPAR DI ${location}!\nSERANGAN BESAR-BESARAN DILANCARKAN`;
  }

  // Indonesian translated viral style
  const words = cleaned.toUpperCase().split(/\s+/).filter(Boolean);
  return `PERINGATAN KERAS!\n${words.slice(0, 4).join(' ')} MEMANAS`;
}

/**
 * 6. ✂️ ULTRA SHORT (3-4 Kata Super Padat)
 */
export function toUltraShort(rawTitle: string): string {
  const cleaned = cleanRawTitle(rawTitle);
  const words = cleaned.toUpperCase().split(/\s+/).filter(Boolean);
  const shortList = words.slice(0, 4);
  return balanceTwoLines(shortList.join(' '));
}

/**
 * Synthesizes all 6 viral variations instantly on the client
 */
export function generateAllViralVariations(rawTitle: string): {
  viral: string;
  impact: string;
  tactical: string;
  dramatic: string;
  indo: string;
  short: string;
} {
  return {
    viral: toViralHook(rawTitle),
    impact: toImpactHeadline(rawTitle),
    tactical: toTacticalOSINT(rawTitle),
    dramatic: toDramaticAlert(rawTitle),
    indo: toIndoViral(rawTitle),
    short: toUltraShort(rawTitle),
  };
}

/**
 * Automatically extracts 1-3 best highlight words from a headline for white badge
 */
export function extractViralHighlights(headline: string): string[] {
  const words = headline
    .replace(/\n/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/[^\w\s-]/g, '').trim())
    .filter(Boolean);

  const matched = words.filter(w =>
    TACTICAL_IMPACT_KEYWORDS.some(k => w.toUpperCase().includes(k))
  );

  if (matched.length > 0) {
    return matched.slice(0, 2);
  }

  // Fallback to last line or first 2 words
  return words.slice(0, Math.min(2, words.length));
}
