export interface User {
  email: string;
  passwordHash: string;
  createdAt: string;
}

const USERS_KEY = 'clipflow_users';
const SESSION_KEY = 'clipflow_session';

function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function hashPassword(password: string): string {
  return btoa(password);
}

export function register(email: string, password: string): { success: boolean; error?: string } {
  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    return { success: false, error: 'Cet email est déjà utilisé.' };
  }
  if (!email.includes('@')) {
    return { success: false, error: 'Veuillez entrer un email valide.' };
  }
  if (password.length < 4) {
    return { success: false, error: 'Le mot de passe doit faire au moins 4 caractères.' };
  }
  users.push({
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  });
  saveUsers(users);
  try {
    localStorage.setItem(SESSION_KEY, email);
  } catch {
    // ignore
  }
  return { success: true };
}

export function login(email: string, password: string): { success: boolean; error?: string } {
  const users = getUsers();
  const user = users.find((u) => u.email === email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return { success: false, error: 'Email ou mot de passe incorrect.' };
  }
  try {
    localStorage.setItem(SESSION_KEY, email);
  } catch {
    // ignore
  }
  return { success: true };
}

export function logout(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function getCurrentUser(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getCurrentUser();
}
