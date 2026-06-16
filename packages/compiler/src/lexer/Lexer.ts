import { TokenType } from './TokenType';
import { Token, createToken } from './Token';

const KEYWORDS: Record<string, TokenType> = {
  class: TokenType.CLASS,
  interface: TokenType.INTERFACE,
  enum: TokenType.ENUM,
  public: TokenType.PUBLIC,
  private: TokenType.PRIVATE,
  protected: TokenType.PROTECTED,
  static: TokenType.STATIC,
  final: TokenType.FINAL,
  abstract: TokenType.ABSTRACT,
  extends: TokenType.EXTENDS,
  implements: TokenType.IMPLEMENTS,
  new: TokenType.NEW,
  this: TokenType.THIS,
  super: TokenType.SUPER,
  return: TokenType.RETURN,
  if: TokenType.IF,
  else: TokenType.ELSE,
  for: TokenType.FOR,
  while: TokenType.WHILE,
  do: TokenType.DO,
  switch: TokenType.SWITCH,
  case: TokenType.CASE,
  default: TokenType.DEFAULT,
  break: TokenType.BREAK,
  continue: TokenType.CONTINUE,
  throw: TokenType.THROW,
  try: TokenType.TRY,
  catch: TokenType.CATCH,
  finally: TokenType.FINALLY,
  import: TokenType.IMPORT,
  package: TokenType.PACKAGE,
  function: TokenType.FUNCTION,
  let: TokenType.LET,
  const: TokenType.CONST,
  var: TokenType.VAR,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  null: TokenType.NULL,
  instanceof: TokenType.INSTANCEOF,
  in: TokenType.IN,
  of: TokenType.OF,
  int: TokenType.INT,
  long: TokenType.LONG,
  float: TokenType.FLOAT,
  double: TokenType.DOUBLE,
  boolean: TokenType.BOOLEAN,
  char: TokenType.CHAR,
  byte: TokenType.BYTE,
  short: TokenType.SHORT,
  String: TokenType.STRING,
  void: TokenType.VOID,
};

export class LexerError extends Error {
  constructor(message: string, public line: number, public column: number) {
    super(`[Line ${line}, Column ${column}] ${message}`);
    this.name = 'LexerError';
  }
}

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): Token[] {
    while (this.pos < this.source.length) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.source.length) break;
      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }
    this.tokens.push(createToken(TokenType.EOF, '', this.line, this.column));
    return this.tokens;
  }

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
      } else if (ch === '\n') {
        this.advance();
        this.line++;
        this.column = 1;
      } else if (ch === '/' && this.peek() === '/') {
        this.skipSingleLineComment();
      } else if (ch === '/' && this.peek() === '*') {
        this.skipMultiLineComment();
      } else {
        break;
      }
    }
  }

  private skipSingleLineComment(): void {
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      this.advance();
    }
  }

  private skipMultiLineComment(): void {
    this.advance();
    this.advance();
    while (this.pos < this.source.length) {
      if (this.source[this.pos] === '*' && this.peek() === '/') {
        this.advance();
        this.advance();
        return;
      }
      if (this.source[this.pos] === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }
    throw new LexerError('Unterminated multi-line comment', this.line, this.column);
  }

  private nextToken(): Token | null {
    const startLine = this.line;
    const startColumn = this.column;
    const ch = this.source[this.pos];

    if (ch === '"') return this.readStringLiteral(startLine, startColumn);
    if (ch === "'") return this.readCharLiteral(startLine, startColumn);
    if (this.isDigit(ch)) return this.readNumberLiteral(startLine, startColumn);
    if (this.isAlpha(ch) || ch === '_') return this.readIdentifierOrKeyword(startLine, startColumn);

    return this.readOperatorOrDelimiter(startLine, startColumn);
  }

  private readStringLiteral(startLine: number, startColumn: number): Token {
    this.advance();
    let value = '';
    while (this.pos < this.source.length && this.source[this.pos] !== '"') {
      if (this.source[this.pos] === '\\') {
        this.advance();
        value += this.readEscapeSequence();
      } else if (this.source[this.pos] === '\n') {
        throw new LexerError('Unterminated string literal', startLine, startColumn);
      } else {
        value += this.source[this.pos];
        this.advance();
      }
    }
    if (this.pos >= this.source.length) {
      throw new LexerError('Unterminated string literal', startLine, startColumn);
    }
    this.advance();
    return createToken(TokenType.STRING_LITERAL, value, startLine, startColumn);
  }

  private readCharLiteral(startLine: number, startColumn: number): Token {
    this.advance();
    let value = '';
    if (this.source[this.pos] === '\\') {
      this.advance();
      value = this.readEscapeSequence();
    } else if (this.source[this.pos] !== "'" && this.source[this.pos] !== '\n') {
      value = this.source[this.pos];
      this.advance();
    }
    if (this.source[this.pos] !== "'") {
      throw new LexerError('Unterminated char literal', startLine, startColumn);
    }
    this.advance();
    return createToken(TokenType.CHAR_LITERAL, value, startLine, startColumn);
  }

  private readEscapeSequence(): string {
    const ch = this.source[this.pos];
    this.advance();
    switch (ch) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case '\\': return '\\';
      case '"': return '"';
      case "'": return "'";
      case '0': return '\0';
      default: return ch;
    }
  }

  private readNumberLiteral(startLine: number, startColumn: number): Token {
    let value = '';
    while (this.pos < this.source.length && (this.isDigit(this.source[this.pos]) || this.source[this.pos] === '.')) {
      value += this.source[this.pos];
      this.advance();
    }
    if (this.source[this.pos] === 'e' || this.source[this.pos] === 'E') {
      value += this.source[this.pos];
      this.advance();
      if (this.source[this.pos] === '+' || this.source[this.pos] === '-') {
        value += this.source[this.pos];
        this.advance();
      }
      while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
        value += this.source[this.pos];
        this.advance();
      }
    }
    return createToken(TokenType.NUMBER_LITERAL, value, startLine, startColumn);
  }

  private readIdentifierOrKeyword(startLine: number, startColumn: number): Token {
    let value = '';
    while (this.pos < this.source.length && (this.isAlphaNumeric(this.source[this.pos]) || this.source[this.pos] === '_')) {
      value += this.source[this.pos];
      this.advance();
    }
    const keywordType = KEYWORDS[value];
    if (keywordType !== undefined) {
      if (keywordType === TokenType.TRUE || keywordType === TokenType.FALSE) {
        return createToken(TokenType.BOOLEAN_LITERAL, value, startLine, startColumn);
      }
      if (keywordType === TokenType.NULL) {
        return createToken(TokenType.NULL_LITERAL, value, startLine, startColumn);
      }
      return createToken(keywordType, value, startLine, startColumn);
    }
    return createToken(TokenType.IDENTIFIER, value, startLine, startColumn);
  }

  private readOperatorOrDelimiter(startLine: number, startColumn: number): Token | null {
    const ch = this.source[this.pos];
    const next = this.peek();

    const twoChar = ch + next;
    const twoCharTokens: Record<string, TokenType> = {
      '==': TokenType.EQUAL_EQUAL,
      '!=': TokenType.NOT_EQUAL,
      '<=': TokenType.LESS_EQUAL,
      '>=': TokenType.GREATER_EQUAL,
      '&&': TokenType.AND_AND,
      '||': TokenType.OR_OR,
      '++': TokenType.INCREMENT,
      '--': TokenType.DECREMENT,
      '+=': TokenType.PLUS_ASSIGN,
      '-=': TokenType.MINUS_ASSIGN,
      '*=': TokenType.STAR_ASSIGN,
      '/=': TokenType.SLASH_ASSIGN,
      '%=': TokenType.PERCENT_ASSIGN,
      '<<': TokenType.LEFT_SHIFT,
      '>>': TokenType.RIGHT_SHIFT,
      '->': TokenType.ARROW,
    };

    if (twoCharTokens[twoChar]) {
      this.advance();
      this.advance();
      return createToken(twoCharTokens[twoChar], twoChar, startLine, startColumn);
    }

    const singleCharTokens: Record<string, TokenType> = {
      '+': TokenType.PLUS,
      '-': TokenType.MINUS,
      '*': TokenType.STAR,
      '/': TokenType.SLASH,
      '%': TokenType.PERCENT,
      '=': TokenType.ASSIGN,
      '<': TokenType.LESS,
      '>': TokenType.GREATER,
      '!': TokenType.NOT,
      '&': TokenType.BITWISE_AND,
      '|': TokenType.BITWISE_OR,
      '^': TokenType.BITWISE_XOR,
      '~': TokenType.BITWISE_NOT,
      '(': TokenType.LPAREN,
      ')': TokenType.RPAREN,
      '{': TokenType.LBRACE,
      '}': TokenType.RBRACE,
      '[': TokenType.LBRACKET,
      ']': TokenType.RBRACKET,
      ';': TokenType.SEMICOLON,
      ',': TokenType.COMMA,
      '.': TokenType.DOT,
      ':': TokenType.COLON,
      '?': TokenType.QUESTION,
      '@': TokenType.AT,
    };

    if (singleCharTokens[ch]) {
      this.advance();
      return createToken(singleCharTokens[ch], ch, startLine, startColumn);
    }

    throw new LexerError(`Unexpected character: '${ch}'`, startLine, startColumn);
  }

  private advance(): void {
    this.pos++;
    this.column++;
  }

  private peek(): string {
    return this.pos + 1 < this.source.length ? this.source[this.pos + 1] : '';
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isAlpha(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }

  private isAlphaNumeric(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }
}
