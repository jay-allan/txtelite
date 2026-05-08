import * as readline from 'readline';

// ── Types ──────────────────────────────────────────────────────────────────

interface SeedType     { w0: number; w1: number; w2: number; }
interface FastSeedType { a: number;  b: number;  c: number;  d: number; }

interface PlanSys {
  x: number; y: number; economy: number; govtype: number; techlev: number;
  population: number; productivity: number; radius: number;
  goatsoupseed: FastSeedType; name: string;
}

interface TradeGood {
  baseprice: number; gradient: number;
  basequant: number; maskbyte: number; units: number; name: string;
}

interface MarketType { quantity: number[]; price: number[]; }

// ── Constants ──────────────────────────────────────────────────────────────

const galsize    = 256;
const AlienItems = 16;
const lasttrade  = AlienItems;
const numforLave = 7;
const fuelcost   = 2;
const maxfuel    = 70;
const nocomms    = 14;

const base0: number = 0x5A4A;
const base1: number = 0x0248;
const base2: number = 0xB753;

// Version 1.5 combined pairs array for planet names (makesystem uses this)
const pairs = "..LEXEGEZACEBISO" +
              "USESARMAINDIREA." +
              "ERATENBERALAVETI" +
              "EDORQUANTEISRION";

// Version 1.5 pairs0 for goat_soup random names
const pairs0 = "ABOUSEITILETSTONLONUTHNO" +
               "ALLEXEGEZACEBISO" +
               "USESARMAINDIREA." +
               "ERATENBERALAVETI" +
               "EDORQUANTEISRION";

const govnames: string[] = [
  "Anarchy", "Feudal", "Multi-gov", "Dictatorship",
  "Communist", "Confederacy", "Democracy", "Corporate State",
];

const econnames: string[] = [
  "Rich Ind", "Average Ind", "Poor Ind", "Mainly Ind",
  "Mainly Agri", "Rich Agri", "Average Agri", "Poor Agri",
];

const unitnames: string[] = ["t", "kg", "g"];

const commodities: TradeGood[] = [
  { baseprice: 0x13, gradient: -0x02, basequant: 0x06, maskbyte: 0x01, units: 0, name: "Food        " },
  { baseprice: 0x14, gradient: -0x01, basequant: 0x0A, maskbyte: 0x03, units: 0, name: "Textiles    " },
  { baseprice: 0x41, gradient: -0x03, basequant: 0x02, maskbyte: 0x07, units: 0, name: "Radioactives" },
  { baseprice: 0x28, gradient: -0x05, basequant: 0xE2, maskbyte: 0x1F, units: 0, name: "Slaves      " },
  { baseprice: 0x53, gradient: -0x05, basequant: 0xFB, maskbyte: 0x0F, units: 0, name: "Liquor/Wines" },
  { baseprice: 0xC4, gradient: +0x08, basequant: 0x36, maskbyte: 0x03, units: 0, name: "Luxuries    " },
  { baseprice: 0xEB, gradient: +0x1D, basequant: 0x08, maskbyte: 0x78, units: 0, name: "Narcotics   " },
  { baseprice: 0x9A, gradient: +0x0E, basequant: 0x38, maskbyte: 0x03, units: 0, name: "Computers   " },
  { baseprice: 0x75, gradient: +0x06, basequant: 0x28, maskbyte: 0x07, units: 0, name: "Machinery   " },
  { baseprice: 0x4E, gradient: +0x01, basequant: 0x11, maskbyte: 0x1F, units: 0, name: "Alloys      " },
  { baseprice: 0x7C, gradient: +0x0D, basequant: 0x1D, maskbyte: 0x07, units: 0, name: "Firearms    " },
  { baseprice: 0xB0, gradient: -0x09, basequant: 0xDC, maskbyte: 0x3F, units: 0, name: "Furs        " },
  { baseprice: 0x20, gradient: -0x01, basequant: 0x35, maskbyte: 0x03, units: 0, name: "Minerals    " },
  { baseprice: 0x61, gradient: -0x01, basequant: 0x42, maskbyte: 0x07, units: 1, name: "Gold        " },
  { baseprice: 0xAB, gradient: -0x02, basequant: 0x37, maskbyte: 0x1F, units: 1, name: "Platinum    " },
  { baseprice: 0x2D, gradient: -0x01, basequant: 0xFA, maskbyte: 0x0F, units: 2, name: "Gem-Strones " },
  { baseprice: 0x35, gradient: +0x0F, basequant: 0xC0, maskbyte: 0x07, units: 0, name: "Alien Items " },
];

// desc_list for goat_soup (indexed 0x81-0xA4, i.e. index = c - 0x81)
const desc_list: string[][] = [
  /* 81 */ ["fabled", "notable", "well known", "famous", "noted"],
  /* 82 */ ["very", "mildly", "most", "reasonably", ""],
  /* 83 */ ["ancient", "\x95", "great", "vast", "pink"],
  /* 84 */ ["\x9E \x9D plantations", "mountains", "\x9C", "\x94 forests", "oceans"],
  /* 85 */ ["shyness", "silliness", "mating traditions", "loathing of \x86", "love for \x86"],
  /* 86 */ ["food blenders", "tourists", "poetry", "discos", "\x8E"],
  /* 87 */ ["talking tree", "crab", "bat", "lobst", "\xB2"],
  /* 88 */ ["beset", "plagued", "ravaged", "cursed", "scourged"],
  /* 89 */ ["\x96 civil war", "\x9B \x98 \x99s", "a \x9B disease", "\x96 earthquakes", "\x96 solar activity"],
  /* 8A */ ["its \x83 \x84", "the \xB1 \x98 \x99", "its inhabitants' \x9A \x85", "\xA1", "its \x8D \x8E"],
  /* 8B */ ["juice", "brandy", "water", "brew", "gargle blasters"],
  /* 8C */ ["\xB2", "\xB1 \x99", "\xB1 \xB2", "\xB1 \x9B", "\x9B \xB2"],
  /* 8D */ ["fabulous", "exotic", "hoopy", "unusual", "exciting"],
  /* 8E */ ["cuisine", "night life", "casinos", "sit coms", " \xA1 "],
  /* 8F */ ["\xB0", "The planet \xB0", "The world \xB0", "This planet", "This world"],
  /* 90 */ ["n unremarkable", " boring", " dull", " tedious", " revolting"],
  /* 91 */ ["planet", "world", "place", "little planet", "dump"],
  /* 92 */ ["wasp", "moth", "grub", "ant", "\xB2"],
  /* 93 */ ["poet", "arts graduate", "yak", "snail", "slug"],
  /* 94 */ ["tropical", "dense", "rain", "impenetrable", "exuberant"],
  /* 95 */ ["funny", "wierd", "unusual", "strange", "peculiar"],
  /* 96 */ ["frequent", "occasional", "unpredictable", "dreadful", "deadly"],
  /* 97 */ ["\x82 \x81 for \x8A", "\x82 \x81 for \x8A and \x8A", "\x88 by \x89", "\x82 \x81 for \x8A but \x88 by \x89", "a\x90 \x91"],
  /* 98 */ ["\x9B", "mountain", "edible", "tree", "spotted"],
  /* 99 */ ["\x9F", "\xA0", "\x87oid", "\x93", "\x92"],
  /* 9A */ ["ancient", "exceptional", "eccentric", "ingrained", "\x95"],
  /* 9B */ ["killer", "deadly", "evil", "lethal", "vicious"],
  /* 9C */ ["parking meters", "dust clouds", "ice bergs", "rock formations", "volcanoes"],
  /* 9D */ ["plant", "tulip", "banana", "corn", "\xB2weed"],
  /* 9E */ ["\xB2", "\xB1 \xB2", "\xB1 \x9B", "inhabitant", "\xB1 \xB2"],
  /* 9F */ ["shrew", "beast", "bison", "snake", "wolf"],
  /* A0 */ ["leopard", "cat", "monkey", "goat", "fish"],
  /* A1 */ ["\x8C \x8B", "\xB1 \x9F \xA2", "its \x8D \xA0 \xA2", "\xA3 \xA4", "\x8C \x8B"],
  /* A2 */ ["meat", "cutlet", "steak", "burgers", "soup"],
  /* A3 */ ["ice", "mud", "Zero-G", "vacuum", "\xB1 ultra"],
  /* A4 */ ["hockey", "cricket", "karate", "polo", "tennis"],
];

// ── Game state ─────────────────────────────────────────────────────────────

const galaxy: PlanSys[] = new Array(galsize);
let seed: SeedType = { w0: 0, w1: 0, w2: 0 };
let rnd_seed: FastSeedType = { a: 0, b: 0, c: 0, d: 0 };
let nativerand = true;

let shipshold: number[]    = new Array(lasttrade + 1).fill(0);
let currentplanet          = 0;
let galaxynum              = 1;
let cash                   = 0;
let fuel                   = 0;
let localmarket: MarketType = { quantity: [], price: [] };
let holdspace              = 0;

let tradnames: string[] = [];

// ── RNG ───────────────────────────────────────────────────────────────────

let nativeState = 0;
let lastrand    = 0;

function mysrand(s: number): void {
  nativeState = s;
  lastrand = s - 1;
}

function myrand(): number {
  if (nativerand) {
    // Portable ANSI C LCG substitute for rand()
    const next = (BigInt(nativeState) * 1103515245n + 12345n) & 0x7fffffffn;
    nativeState = Number(next);
    return nativeState;
  } else {
    // SAS Institute LCG (D McDonnell)
    let L = BigInt(lastrand);
    let r = (((((((((L << 3n) - L) << 3n) + L) << 1n) + L) << 4n) - L) << 1n) - L;
    r = (r + 0xe60n) & 0x7fffffffn;
    lastrand = Number(r) - 1;
    return Number(r);
  }
}

function randbyte(): number { return myrand() & 0xFF; }

// ── Math helpers ───────────────────────────────────────────────────────────

function ftoi(v: number): number { return Math.floor(v + 0.5); }
function mymin(a: number, b: number): number { return a < b ? a : b; }

function atoi(s: string): number {
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

function atof(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0.0 : n;
}

// ── String helpers ─────────────────────────────────────────────────────────

function eliteToupper(c: string): string {
  if (c >= 'a' && c <= 'z') return String.fromCharCode(c.charCodeAt(0) - 32);
  return c;
}

function eliteTolower(c: string): string {
  if (c >= 'A' && c <= 'Z') return String.fromCharCode(c.charCodeAt(0) + 32);
  return c;
}

function stripout(s: string, ch: string): string {
  return s.split(ch).join('');
}

function stringbeg(s: string, t: string): boolean {
  const l = s.length;
  if (l === 0) return false;
  let i = 0;
  while (i < l && eliteToupper(s.charAt(i)) === eliteToupper(t.charAt(i) || '\0')) i++;
  return i === l;
}

function stringmatch(s: string, arr: string[], n: number): number {
  for (let i = 0; i < n; i++) {
    if (stringbeg(s, arr[i])) return i + 1;
  }
  return 0;
}

// Returns { word: first token, rest: remainder after first space }
function spacesplit(s: string): { word: string; rest: string } {
  let i = 0;
  while (i < s.length && s[i] === ' ') i++;
  if (i === s.length) return { word: '', rest: '' };
  let j = i;
  while (j < s.length && s[j] !== ' ') j++;
  const word = s.slice(i, j);
  const rest = j + 1 < s.length ? s.slice(j + 1) : '';
  return { word, rest };
}

// ── Seed operations ────────────────────────────────────────────────────────

function tweakseed(s: SeedType): void {
  const temp = (s.w0 + s.w1 + s.w2) & 0xFFFF;
  s.w0 = s.w1;
  s.w1 = s.w2;
  s.w2 = temp;
}

function rotatel(x: number): number {
  const temp = x & 128;
  return (2 * (x & 127)) + (temp >> 7);
}

function twist(x: number): number {
  return (256 * rotatel(x >> 8)) + rotatel(x & 255);
}

function nextgalaxy(s: SeedType): void {
  s.w0 = twist(s.w0);
  s.w1 = twist(s.w1);
  s.w2 = twist(s.w2);
}

// ── Planet/galaxy generation ───────────────────────────────────────────────

function makesystem(s: SeedType): PlanSys {
  const longnameflag = s.w0 & 64;

  const x = (s.w1 >> 8) & 0xFF;
  const y = (s.w0 >> 8) & 0xFF;

  const govtype = (s.w1 >> 3) & 7;

  let economy = (s.w0 >> 8) & 7;
  if (govtype <= 1) economy |= 2;

  let techlev = ((s.w1 >> 8) & 3) + (economy ^ 7);
  techlev += govtype >> 1;
  if (govtype & 1) techlev += 1;

  const population  = 4 * techlev + economy + govtype + 1;
  const productivity = ((economy ^ 7) + 3) * (govtype + 4) * population * 8;
  const radius       = 256 * (((s.w2 >> 8) & 15) + 11) + x;

  const goatsoupseed: FastSeedType = {
    a: s.w1 & 0xFF,
    b: s.w1 >> 8,
    c: s.w2 & 0xFF,
    d: s.w2 >> 8,
  };

  const pair1 = 2 * ((s.w2 >> 8) & 31); tweakseed(s);
  const pair2 = 2 * ((s.w2 >> 8) & 31); tweakseed(s);
  const pair3 = 2 * ((s.w2 >> 8) & 31); tweakseed(s);
  const pair4 = 2 * ((s.w2 >> 8) & 31); tweakseed(s);

  let name = pairs[pair1] + pairs[pair1+1] +
             pairs[pair2] + pairs[pair2+1] +
             pairs[pair3] + pairs[pair3+1];
  if (longnameflag) name += pairs[pair4] + pairs[pair4+1];
  name = stripout(name, '.');

  return { x, y, economy, govtype, techlev, population, productivity, radius, goatsoupseed, name };
}

function buildgalaxy(gnum: number): void {
  seed.w0 = base0; seed.w1 = base1; seed.w2 = base2;
  for (let i = 1; i < gnum; i++) nextgalaxy(seed);
  for (let i = 0; i < galsize; i++) galaxy[i] = makesystem(seed);
}

// ── Market ─────────────────────────────────────────────────────────────────

function genmarket(fluct: number, p: PlanSys): MarketType {
  const market: MarketType = { quantity: new Array(lasttrade + 1), price: new Array(lasttrade + 1) };
  for (let i = 0; i <= lasttrade; i++) {
    const product  = p.economy * commodities[i].gradient;
    const changing = fluct & commodities[i].maskbyte;
    let q = (commodities[i].basequant + changing - product) & 0xFF;
    if (q & 0x80) q = 0;
    market.quantity[i] = q & 0x3F;
    q = (commodities[i].baseprice + changing + product) & 0xFF;
    market.price[i] = q * 4;
  }
  market.quantity[AlienItems] = 0;
  return market;
}

function displaymarket(m: MarketType): void {
  for (let i = 0; i <= lasttrade; i++) {
    process.stdout.write("\n");
    process.stdout.write(commodities[i].name);
    process.stdout.write("   " + (m.price[i] / 10).toFixed(1));
    process.stdout.write("   " + m.quantity[i]);
    process.stdout.write(unitnames[commodities[i].units]);
    process.stdout.write("   " + shipshold[i]);
  }
}

// ── Trading ────────────────────────────────────────────────────────────────

function gamebuy(i: number, a: number): number {
  let t: number;
  if (cash < 0) {
    t = 0;
  } else {
    t = mymin(localmarket.quantity[i], a);
    if (commodities[i].units === 0) t = mymin(holdspace, t);
    t = mymin(t, Math.floor(cash / localmarket.price[i]));
  }
  shipshold[i] += t;
  localmarket.quantity[i] -= t;
  cash -= t * localmarket.price[i];
  if (commodities[i].units === 0) holdspace -= t;
  return t;
}

function gamesell(i: number, a: number): number {
  const t = mymin(shipshold[i], a);
  shipshold[i] -= t;
  localmarket.quantity[i] += t;
  if (commodities[i].units === 0) holdspace += t;
  cash += t * localmarket.price[i];
  return t;
}

function gamefuel(f: number): number {
  if (f + fuel > maxfuel) f = maxfuel - fuel;
  if (fuelcost > 0 && f * fuelcost > cash) f = Math.floor(cash / fuelcost);
  fuel += f;
  cash -= fuelcost * f;
  return f;
}

// ── Navigation ─────────────────────────────────────────────────────────────

function gamejump(dest: number): void {
  currentplanet = dest;
  localmarket = genmarket(randbyte(), galaxy[dest]);
}

function distance(a: PlanSys, b: PlanSys): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return ftoi(4 * Math.sqrt(dx * dx + Math.floor(dy * dy / 4)));
}

function matchsys(s: string): number {
  let p = currentplanet;
  let d = 9999;
  for (let i = 0; i < galsize; i++) {
    if (stringbeg(s, galaxy[i].name)) {
      const dist = distance(galaxy[i], galaxy[currentplanet]);
      if (dist < d) { d = dist; p = i; }
    }
  }
  return p;
}

// ── Goat Soup ──────────────────────────────────────────────────────────────

function genRndNumber(): number {
  let x = (rnd_seed.a * 2) & 0xFF;
  let a = x + rnd_seed.c;
  if (rnd_seed.a > 127) a++;
  rnd_seed.a = a & 0xFF;
  rnd_seed.c = x;
  a = Math.floor(a / 256);
  x = rnd_seed.b;
  a = (a + x + rnd_seed.d) & 0xFF;
  rnd_seed.b = a;
  rnd_seed.d = x;
  return a;
}

function goatSoup(source: string, psy: PlanSys): void {
  for (let i = 0; i < source.length; i++) {
    const c = source.charCodeAt(i);
    if (c < 0x80) {
      process.stdout.write(String.fromCharCode(c));
    } else if (c <= 0xA4) {
      const rnd = genRndNumber();
      const idx = (rnd >= 0x33 ? 1 : 0) + (rnd >= 0x66 ? 1 : 0) +
                  (rnd >= 0x99 ? 1 : 0) + (rnd >= 0xCC ? 1 : 0);
      goatSoup(desc_list[c - 0x81][idx], psy);
    } else {
      switch (c) {
        case 0xB0:
          process.stdout.write(psy.name.charAt(0));
          for (let j = 1; j < psy.name.length; j++)
            process.stdout.write(eliteTolower(psy.name.charAt(j)));
          break;
        case 0xB1:
          process.stdout.write(psy.name.charAt(0));
          for (let j = 1; j < psy.name.length; j++) {
            const ch   = psy.name.charAt(j);
            const next = psy.name.charAt(j + 1);
            if (next !== '' || (ch !== 'E' && ch !== 'I'))
              process.stdout.write(eliteTolower(ch));
          }
          process.stdout.write("ian");
          break;
        case 0xB2: {
          const len = genRndNumber() & 3;
          for (let j = 0; j <= len; j++) {
            const x = genRndNumber() & 0x3E;
            if (j === 0) process.stdout.write(pairs0.charAt(x));
            else         process.stdout.write(eliteTolower(pairs0.charAt(x)));
            process.stdout.write(eliteTolower(pairs0.charAt(x + 1)));
          }
          break;
        }
        default:
          process.stdout.write(`<bad char in data [${c.toString(16).toUpperCase()}]>`);
          return;
      }
    }
  }
}

// ── Display ────────────────────────────────────────────────────────────────

function prisys(plsy: PlanSys, compressed: boolean): void {
  if (compressed) {
    process.stdout.write(plsy.name.padStart(10));
    process.stdout.write(" TL: " + String(plsy.techlev + 1).padStart(2) + " ");
    process.stdout.write(econnames[plsy.economy].padStart(12));
    process.stdout.write(" " + govnames[plsy.govtype].padStart(15));
  } else {
    process.stdout.write("\n\nSystem:  " + plsy.name);
    process.stdout.write("\nPosition (" + plsy.x + "," + plsy.y + ")");
    process.stdout.write("\nEconomy: (" + plsy.economy + ") " + econnames[plsy.economy]);
    process.stdout.write("\nGovernment: (" + plsy.govtype + ") " + govnames[plsy.govtype]);
    process.stdout.write("\nTech Level: " + String(plsy.techlev + 1).padStart(2));
    process.stdout.write("\nTurnover: " + plsy.productivity);
    process.stdout.write("\nRadius: " + plsy.radius);
    process.stdout.write("\nPopulation: " + (plsy.population >> 3) + " Billion");
    rnd_seed = { ...plsy.goatsoupseed };
    process.stdout.write("\n");
    goatSoup("\x8F is \x97.", plsy);
  }
}

// ── Command handlers ───────────────────────────────────────────────────────

function dotweakrand(_s: string): boolean {
  nativerand = !nativerand;
  return true;
}

function dolocal(_s: string): boolean {
  process.stdout.write("Galaxy number " + galaxynum);
  for (let i = 0; i < galsize; i++) {
    const d = distance(galaxy[i], galaxy[currentplanet]);
    if (d <= maxfuel) {
      if (d <= fuel) process.stdout.write("\n * ");
      else           process.stdout.write("\n - ");
      prisys(galaxy[i], true);
      process.stdout.write(" (" + (d / 10).toFixed(1) + " LY)");
    }
  }
  return true;
}

function dojump(s: string): boolean {
  const dest = matchsys(s);
  if (dest === currentplanet) { process.stdout.write("\nBad jump"); return false; }
  const d = distance(galaxy[dest], galaxy[currentplanet]);
  if (d > fuel) { process.stdout.write("\nJump to far"); return false; }
  fuel -= d;
  gamejump(dest);
  prisys(galaxy[currentplanet], false);
  return true;
}

function dosneak(s: string): boolean {
  const fuelkeep = fuel;
  fuel = 666;
  const b = dojump(s);
  fuel = fuelkeep;
  return b;
}

function dogalhyp(_s: string): boolean {
  galaxynum++;
  if (galaxynum === 9) galaxynum = 1;
  buildgalaxy(galaxynum);
  return true;
}

function doinfo(s: string): boolean {
  const dest = matchsys(s);
  prisys(galaxy[dest], false);
  return true;
}

function dohold(s: string): boolean {
  const a = atoi(s);
  let t = 0;
  for (let i = 0; i <= lasttrade; i++) {
    if (commodities[i].units === 0) t += shipshold[i];
  }
  if (t > a) { process.stdout.write("\nHold too full"); return false; }
  holdspace = a - t;
  return true;
}

function dosell(s: string): boolean {
  const { word: s2, rest } = spacesplit(s);
  let a = atoi(rest);
  if (a === 0) a = 1;
  const idx = stringmatch(s2, tradnames, lasttrade + 1);
  if (idx === 0) { process.stdout.write("\nUnknown trade good"); return false; }
  const i = idx - 1;
  const t = gamesell(i, a);
  if (t === 0) process.stdout.write("Cannot sell any ");
  else {
    process.stdout.write("\nSelling " + t);
    process.stdout.write(unitnames[commodities[i].units]);
    process.stdout.write(" of ");
  }
  process.stdout.write(tradnames[i]);
  return true;
}

function dobuy(s: string): boolean {
  const { word: s2, rest } = spacesplit(s);
  let a = atoi(rest);
  if (a === 0) a = 1;
  const idx = stringmatch(s2, tradnames, lasttrade + 1);
  if (idx === 0) { process.stdout.write("\nUnknown trade good"); return false; }
  const i = idx - 1;
  const t = gamebuy(i, a);
  if (t === 0) process.stdout.write("Cannot buy any ");
  else {
    process.stdout.write("\nBuying " + t);
    process.stdout.write(unitnames[commodities[i].units]);
    process.stdout.write(" of ");
  }
  process.stdout.write(tradnames[i]);
  return true;
}

function dofuel(s: string): boolean {
  const f = gamefuel(Math.floor(10 * atof(s)));
  if (f === 0) process.stdout.write("\nCan't buy any fuel");
  process.stdout.write("\nBuying " + (f / 10).toFixed(1) + "LY fuel");
  return true;
}

function docash(s: string): boolean {
  const a = Math.trunc(10 * atof(s));
  cash += a;
  if (a !== 0) return true;
  process.stdout.write("Number not understood");
  return false;
}

function domkt(_s: string): boolean {
  displaymarket(localmarket);
  process.stdout.write("\nFuel :" + (fuel / 10).toFixed(1));
  process.stdout.write("      Holdspace :" + holdspace + "t");
  return true;
}

function doquit(_s: string): boolean {
  process.exit(0);
  return false;
}

function dohelp(_s: string): boolean {
  process.stdout.write("\nCommands are:");
  process.stdout.write("\nBuy   tradegood ammount");
  process.stdout.write("\nSell  tradegood ammount");
  process.stdout.write("\nFuel  ammount    (buy ammount LY of fuel)");
  process.stdout.write("\nJump  planetname (limited by fuel)");
  process.stdout.write("\nSneak planetname (any distance - no fuel cost)");
  process.stdout.write("\nGalhyp           (jumps to next galaxy)");
  process.stdout.write("\nInfo  planetname (prints info on system");
  process.stdout.write("\nMkt              (shows market prices)");
  process.stdout.write("\nLocal            (lists systems within 7 light years)");
  process.stdout.write("\nCash number      (alters cash - cheating!)");
  process.stdout.write("\nHold number      (change cargo bay)");
  process.stdout.write("\nQuit or ^C       (exit)");
  process.stdout.write("\nHelp             (display this text)");
  process.stdout.write("\nRand             (toggle RNG)");
  process.stdout.write("\n\nAbbreviations allowed eg. b fo 5 = Buy Food 5, m= Mkt");
  return true;
}

const commands: string[] = [
  "buy", "sell", "fuel", "jump", "cash", "mkt", "help", "hold",
  "sneak", "local", "info", "galhyp", "quit", "rand",
];

const comfuncs: Array<(s: string) => boolean> = [
  dobuy, dosell, dofuel, dojump, docash, domkt, dohelp, dohold,
  dosneak, dolocal, doinfo, dogalhyp, doquit, dotweakrand,
];

function parser(s: string): boolean {
  const { word: c, rest } = spacesplit(s);
  const i = stringmatch(c, commands, nocomms);
  if (i) return comfuncs[i - 1](rest);
  process.stdout.write("\n Bad command (" + c + ")");
  return false;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  nativerand = false;   // default to SAS LCG for cross-platform determinism
  process.stdout.write("\nWelcome to Text Elite 1.5.\n");

  tradnames = commodities.map(c => c.name);

  mysrand(12345);
  galaxynum = 1;
  buildgalaxy(galaxynum);

  currentplanet = numforLave;
  localmarket   = genmarket(0x00, galaxy[numforLave]);
  fuel          = maxfuel;

  parser("hold 20");
  parser("cash +100");
  parser("help");

  const rl = readline.createInterface({ input: process.stdin, terminal: false });

  process.stdout.write("\n\nCash :" + (cash / 10).toFixed(1) + ">");

  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r/g, '');
    parser(line);
    process.stdout.write("\n\nCash :" + (cash / 10).toFixed(1) + ">");
  }

  process.exit(0);
}

main().catch(err => { process.stderr.write(String(err) + "\n"); process.exit(1); });
