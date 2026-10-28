import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines conditional class names using clsx and resolves Tailwind CSS conflicts with twMerge.
 *
 * @param {...any} inputs - Class names, expressions, objects, or arrays.
 * @returns {string} The merged class string.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
