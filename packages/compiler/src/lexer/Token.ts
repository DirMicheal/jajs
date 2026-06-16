import { TokenType } from './TokenType';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  raw?: string;
}

export function createToken(type: TokenType, value: string, line: number, column: number, raw?: string): Token {
  return { type, value, line, column, raw };
}
