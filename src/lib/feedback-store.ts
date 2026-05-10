export type Feedback = {
  id: string;
  name: string;
  contact: string; // email or phone
  contactKind: "email" | "phone";
  message: string;
  tool?: string;
  createdAt: number;
};

const KEY = "turbopdf_feedback_v1";

export const getFeedback = (): Feedback[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};

export const addFeedback = (f: Omit<Feedback, "id" | "createdAt">) => {
  const list = getFeedback();
  const item: Feedback = { ...f, id: crypto.randomUUID(), createdAt: Date.now() };
  list.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500)));
  return item;
};

export const deleteFeedback = (id: string) => {
  localStorage.setItem(KEY, JSON.stringify(getFeedback().filter((f) => f.id !== id)));
};

export const clearFeedback = () => localStorage.removeItem(KEY);

// Admin auth (client-side only — for lightweight panel)
export const ADMIN_USER = "admin";
export const ADMIN_PASS = "turbopdf2025";
const ADMIN_KEY = "turbopdf_admin_v1";

export const isAdminAuthed = () => localStorage.getItem(ADMIN_KEY) === "1";
export const setAdminAuthed = (v: boolean) =>
  v ? localStorage.setItem(ADMIN_KEY, "1") : localStorage.removeItem(ADMIN_KEY);
