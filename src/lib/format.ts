export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `Rp ${safe.toLocaleString("id-ID")}`;
}

export function formatOrderDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function generateOrderId(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(100 + Math.random() * 900));
  return `ORD-${yy}${mm}${dd}-${rand}`;
}

export function suggestCategoryPrefix(name: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .toUpperCase();

  if (!cleaned) return "";

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .slice(0, 4);
  }

  const single = words[0];
  if (single.length <= 2) return single;

  // Prefer first char + first consonant after index 0 (e.g. Hairpin -> HP, Keychain -> KC)
  const consonants = single.slice(1).replace(/[AEIOU]/g, "");
  if (consonants.length >= 1) {
    return `${single[0]}${consonants[0]}`;
  }
  return single.slice(0, 2);
}
