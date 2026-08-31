/**
 * Declaraciones de tipos para `bcrypt`.
 * Cubre la API mínima que usamos en el proyecto.
 * Independiente de la versión de `@types/bcrypt`.
 */
declare module "bcrypt" {
  /** Genera un salt. */
  export function genSaltSync(rounds?: number): string;

  /** Genera un hash a partir de un password y un salt. */
  export function hashSync(s: string, salt: string | number): string;
  export function hash(s: string, salt: string | number): Promise<string>;

  /** Compara un password plano contra un hash bcrypt (timing-safe). */
  export function compareSync(s: string, hash: string): boolean;
  export function compare(s: string, hash: string): Promise<boolean>;
}