const KEY = "mf:mvp:v1";
export type AppState = {
  loanAmount: number;
  apr: number;
  remainingYears: number;
  targetYears: number;
};

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

export function saveState(s: AppState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}
