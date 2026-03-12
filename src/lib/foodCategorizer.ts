import { FOOD_ITEMS, type FoodCategory } from '@/data/foodItems';

const FOOD_NAME_MAP = new Map<string, FoodCategory>();
FOOD_ITEMS.forEach(item => {
  FOOD_NAME_MAP.set(item.name.toLowerCase(), item.category);
});

const CATEGORY_KEYWORDS: [FoodCategory, string[]][] = [
  ['Frugt & Grønt', ['frugt', 'grønt', 'grøntsag', 'salat', 'banan', 'æble', 'tomat', 'agurk', 'gulerod', 'kartoffel', 'broccoli', 'avocado', 'peberfrugt', 'citron', 'appelsin', 'pære', 'løg', 'hvidløg', 'squash', 'spinat', 'blomkål', 'champignon', 'svampe', 'melon', 'mango', 'ananas', 'jordbær', 'blåbær', 'hindbær']],
  ['Mejeriprodukter', ['mælk', 'ost', 'smør', 'yoghurt', 'skyr', 'fløde', 'creme', 'æg', 'mejer', 'kefir', 'ricotta', 'mozzarella', 'parmesan']],
  ['Brød & Korn', ['brød', 'rugbrød', 'franskbrød', 'pasta', 'ris', 'havre', 'korn', 'mel', 'müsli', 'knækbrød', 'bolle', 'toast', 'gryn', 'quinoa', 'bulgur', 'couscous']],
  ['Kød & Fisk', ['kylling', 'okse', 'svin', 'laks', 'fisk', 'kød', 'pølse', 'leverpostej', 'tun', 'rejer', 'frikadelle', 'bacon', 'skinke', 'kalv', 'and', 'lam', 'torsk', 'rødspætte', 'makrel', 'hakket']],
  ['Snacks & Drikkevarer', ['chips', 'chokolade', 'slik', 'kaffe', 'juice', 'øl', 'vin', 'sodavand', 'te', 'nødder', 'proteinbar', 'snack', 'popcorn', 'is', 'kage', 'cookie']],
];

export function categorizeFoodItem(name: string): FoodCategory {
  const lower = name.toLowerCase();

  const exact = FOOD_NAME_MAP.get(lower);
  if (exact) return exact;

  for (const [itemName, category] of FOOD_NAME_MAP.entries()) {
    if (lower.includes(itemName) || itemName.includes(lower)) return category;
  }

  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return category;
    }
  }

  return 'Andet';
}
