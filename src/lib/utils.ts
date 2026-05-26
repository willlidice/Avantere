// ============================================
// 🛠️ AVANTERE - FUNÇÕES UTILITÁRIAS
// ============================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// 🎨 CLASSES CSS (Tailwind)
// ============================================

/**
 * Combina classes CSS com suporte a condicionais e merge do Tailwind
 * Uso: cn("px-4 py-2", isActive && "bg-blue-500", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// 📅 DATA E HORA
// ============================================

/**
 * Formata data para exibição (pt-BR)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formata data e hora (pt-BR)
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Retorna tempo relativo (ex: "há 2 horas")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "agora";
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays} dias`;
  return formatDate(d);
}

// ============================================
// 💰 VALORES E NÚMEROS
// ============================================

/**
 * Formata valor monetário (BRL)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata número com separadores
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR").format(value);
}

/**
 * Formata porcentagem
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value.toFixed(0)}%`;
}

// ============================================
// 📁 ARQUIVOS
// ============================================

/**
 * Formata tamanho de arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Extrai extensão do arquivo
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Verifica se é imagem pelo MIME type
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

// ============================================
// 📝 STRINGS
// ============================================

/**
 * Gera slug a partir de texto
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Trunca texto com ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Capitaliza primeira letra
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Gera iniciais do nome (ex: "William Avila" -> "WA")
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================
// 🔧 UTILITÁRIOS GERAIS
// ============================================

/**
 * Aguarda X milissegundos
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gera ID único simples
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Remove propriedades undefined/null de objeto
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  ) as Partial<T>;
}

/**
 * Deep clone de objeto
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================
// 🏷️ LABELS E STATUS
// ============================================

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planejamento",
  IN_PROGRESS: "Em Andamento",
  ON_HOLD: "Pausado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "A Fazer",
  IN_PROGRESS: "Em Andamento",
  IN_REVIEW: "Em Revisão",
  DONE: "Concluído",
  CANCELLED: "Cancelado",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  KEYUSER: "Key User",
  GERENTE: "Gerente",
  PLANEJADOR: "Planejador",
  PRODUCAO: "Produção",
};

// ============================================
// 🎨 CORES POR STATUS
// ============================================

export const STATUS_COLORS: Record<string, string> = {
  // Project Status
  PLANNING: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  ON_HOLD: "bg-gray-100 text-gray-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  // Task Status
  TODO: "bg-slate-100 text-slate-800",
  IN_REVIEW: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};
