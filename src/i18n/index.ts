import type { Locale } from "~/types/locales";
import { en, type MessageKey, type Messages } from "./en";
import { es } from "./es";

const MESSAGES: Record<Locale, Messages> = { en, es };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

export type { MessageKey, Messages };

export function makeT(locale: Locale): (key: MessageKey) => string {
  const dict = MESSAGES[locale];
  return (key) => dict[key];
}
