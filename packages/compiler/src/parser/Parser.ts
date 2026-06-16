import { Token } from '../lexer/Token';
import { TokenType } from '../lexer/TokenType';
import {
  CompilationUnit,
  ImportDeclaration,
  ClassDeclaration,
  InterfaceDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  Parameter,
  TypeReference,
  BlockStatement,
  VariableDeclaration,
  IfStatement,
  ForStatement,
  WhileStatement,
  DoWhileStatement,
  ReturnStatement,
  ExpressionStatement,
  AssignmentExpression,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  MemberExpression,
  NewExpression,
  Identifier,
  Literal,
  ThisExpression,
  SuperExpression,
  ArrayLiteral,
  TryCatchStatement,
  ThrowStatement,
  BreakStatement,
  ContinueStatement,
  Statement,
  Expression,
  Annotation,
  Position,
} from './ast/AST';

export class ParserError extends Error {
  constructor(message: string, public line: number, public column: number) {
    super(`[Line ${line}, Column ${column}] ${message}`);
    this.name = 'ParserError';
  }
}

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): CompilationUnit {
    const imports: ImportDeclaration[] = [];
    const declarations: (ClassDeclaration | InterfaceDeclaration)[] = [];
    const startPos = this.currentPos();

    while (this.check(TokenType.IMPORT)) {
      imports.push(this.parseImportDeclaration());
    }

    while (!this.isAtEnd()) {
      const annotations = this.parseAnnotations();
      if (this.check(TokenType.CLASS) || this.isClassModifier()) {
        declarations.push(this.parseClassDeclaration(annotations));
      } else if (this.check(TokenType.INTERFACE) || this.isInterfaceModifier()) {
        declarations.push(this.parseInterfaceDeclaration(annotations));
      } else {
        throw this.error(`Unexpected token: ${this.peek().value}`, this.peek());
      }
    }

    return {
      type: 'CompilationUnit',
      imports,
      declarations,
      pos: startPos,
    };
  }

  private parseAnnotations(): Annotation[] {
    const annotations: Annotation[] = [];
    while (this.check(TokenType.AT)) {
      annotations.push(this.parseAnnotation());
    }
    return annotations;
  }

  private parseAnnotation(): Annotation {
    const pos = this.currentPos();
    this.consume(TokenType.AT, 'Expected @');
    const name = this.consume(TokenType.IDENTIFIER, 'Expected annotation name').value;
    let args: Expression[] | undefined;
    if (this.check(TokenType.LPAREN)) {
      this.advance();
      args = [];
      if (!this.check(TokenType.RPAREN)) {
        do {
          args.push(this.parseExpression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RPAREN, 'Expected )');
    }
    return { type: 'Annotation', name, arguments: args, pos };
  }

  private parseImportDeclaration(): ImportDeclaration {
    const pos = this.currentPos();
    this.consume(TokenType.IMPORT, 'Expected import keyword');
    let path = '';
    path += this.consume(TokenType.IDENTIFIER, 'Expected import path').value;
    while (this.match(TokenType.DOT)) {
      path += '.';
      if (this.check(TokenType.STAR)) {
        path += this.advance().value;
        break;
      }
      path += this.consume(TokenType.IDENTIFIER, 'Expected identifier').value;
    }
    this.consume(TokenType.SEMICOLON, 'Expected ; after import');
    return { type: 'ImportDeclaration', path, pos };
  }

  private isClassModifier(): boolean {
    return this.checkOneOf(
      TokenType.PUBLIC,
      TokenType.PRIVATE,
      TokenType.PROTECTED,
      TokenType.STATIC,
      TokenType.FINAL,
      TokenType.ABSTRACT,
    );
  }

  private isInterfaceModifier(): boolean {
    return this.checkOneOf(TokenType.PUBLIC, TokenType.PRIVATE, TokenType.PROTECTED, TokenType.STATIC, TokenType.ABSTRACT);
  }

  private parseModifiers(): string[] {
    const modifiers: string[] = [];
    while (this.isClassModifier()) {
      modifiers.push(this.advance().value);
    }
    return modifiers;
  }

  private parseClassDeclaration(annotations: Annotation[]): ClassDeclaration {
    const pos = this.currentPos();
    const modifiers = this.parseModifiers();
    const isAbstract = modifiers.includes('abstract');
    this.consume(TokenType.CLASS, 'Expected class keyword');
    const name = this.consume(TokenType.IDENTIFIER, 'Expected class name').value;

    let superClass: TypeReference | undefined;
    if (this.match(TokenType.EXTENDS)) {
      superClass = this.parseTypeReference();
    }

    const interfaces: TypeReference[] = [];
    if (this.match(TokenType.IMPLEMENTS)) {
      do {
        interfaces.push(this.parseTypeReference());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.LBRACE, 'Expected {');
    const members: (FieldDeclaration | MethodDeclaration)[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const memberAnnotations = this.parseAnnotations();
      members.push(this.parseClassMember(memberAnnotations));
    }
    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'ClassDeclaration',
      name,
      modifiers,
      isAbstract,
      superClass,
      interfaces,
      members,
      annotations,
      pos,
    };
  }

  private parseInterfaceDeclaration(annotations: Annotation[]): InterfaceDeclaration {
    const pos = this.currentPos();
    const modifiers = this.parseModifiers();
    this.consume(TokenType.INTERFACE, 'Expected interface keyword');
    const name = this.consume(TokenType.IDENTIFIER, 'Expected interface name').value;

    const extendsList: TypeReference[] = [];
    if (this.match(TokenType.EXTENDS)) {
      do {
        extendsList.push(this.parseTypeReference());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.LBRACE, 'Expected {');
    const members: MethodDeclaration[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const memberAnnotations = this.parseAnnotations();
      const member = this.parseClassMember(memberAnnotations);
      if (member.type === 'MethodDeclaration') {
        members.push(member);
      }
    }
    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'InterfaceDeclaration',
      name,
      modifiers,
      extends: extendsList,
      members,
      annotations,
      pos,
    };
  }

  private parseClassMember(annotations: Annotation[]): FieldDeclaration | MethodDeclaration {
    const pos = this.currentPos();
    const modifiers = this.parseModifiers();
    const isStatic = modifiers.includes('static');

    const returnType = this.parseTypeReference();

    if (this.check(TokenType.LPAREN)) {
      const name = returnType.name;
      const params = this.parseParameters();
      let body: BlockStatement | undefined;
      let isAbstract = modifiers.includes('abstract');
      if (this.check(TokenType.SEMICOLON)) {
        this.advance();
        isAbstract = true;
      } else {
        body = this.parseBlockStatement();
      }
      return {
        type: 'MethodDeclaration',
        name,
        returnType: returnType,
        parameters: params,
        modifiers,
        isStatic,
        isAbstract,
        body,
        annotations,
        pos,
      };
    }

    const name = this.consume(TokenType.IDENTIFIER, 'Expected member name').value;

    if (this.check(TokenType.LPAREN)) {
      const params = this.parseParameters();
      let body: BlockStatement | undefined;
      let isAbstract = modifiers.includes('abstract');
      if (this.check(TokenType.SEMICOLON)) {
        this.advance();
        isAbstract = true;
      } else {
        body = this.parseBlockStatement();
      }
      return {
        type: 'MethodDeclaration',
        name,
        returnType,
        parameters: params,
        modifiers,
        isStatic,
        isAbstract,
        body,
        annotations,
        pos,
      };
    }

    let initializer: Expression | undefined;
    if (this.match(TokenType.ASSIGN)) {
      initializer = this.parseExpression();
    }
    this.consume(TokenType.SEMICOLON, 'Expected ;');

    return {
      type: 'FieldDeclaration',
      name,
      fieldType: returnType,
      modifiers,
      isStatic,
      initializer,
      annotations,
      pos,
    };
  }

  private parseParameters(): Parameter[] {
    const params: Parameter[] = [];
    this.consume(TokenType.LPAREN, 'Expected (');
    if (!this.check(TokenType.RPAREN)) {
      do {
        params.push(this.parseParameter());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, 'Expected )');
    return params;
  }

  private parseParameter(): Parameter {
    const pos = this.currentPos();
    const paramType = this.parseTypeReference();
    const name = this.consume(TokenType.IDENTIFIER, 'Expected parameter name').value;
    return { type: 'Parameter', name, paramType, pos };
  }

  private isTypeToken(): boolean {
    return this.checkOneOf(
      TokenType.INT,
      TokenType.LONG,
      TokenType.FLOAT,
      TokenType.DOUBLE,
      TokenType.BOOLEAN,
      TokenType.CHAR,
      TokenType.BYTE,
      TokenType.SHORT,
      TokenType.STRING,
      TokenType.VOID,
      TokenType.IDENTIFIER,
    );
  }

  private parseTypeReference(): TypeReference {
    const pos = this.currentPos();
    if (!this.isTypeToken()) {
      throw this.error('Expected type name', this.peek());
    }
    let name = this.advance().value;

    let genericArgs: TypeReference[] | undefined;
    if (this.match(TokenType.LESS)) {
      genericArgs = [];
      if (!this.check(TokenType.GREATER)) {
        do {
          genericArgs.push(this.parseTypeReference());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.GREATER, 'Expected >');
    }

    let isArray = false;
    while (this.check(TokenType.LBRACKET)) {
      this.advance();
      this.consume(TokenType.RBRACKET, 'Expected ]');
      isArray = true;
    }

    return { type: 'TypeReference', name, isArray, genericArgs, pos };
  }

  private parseBlockStatement(): BlockStatement {
    const pos = this.currentPos();
    this.consume(TokenType.LBRACE, 'Expected {');
    const statements: Statement[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      statements.push(this.parseStatement());
    }
    this.consume(TokenType.RBRACE, 'Expected }');
    return { type: 'BlockStatement', statements, pos };
  }

  private parseStatement(): Statement {
    const pos = this.currentPos();
    if (this.check(TokenType.LBRACE)) {
      return this.parseBlockStatement();
    }
    if (this.match(TokenType.IF)) {
      return this.parseIfStatement();
    }
    if (this.match(TokenType.FOR)) {
      return this.parseForStatement();
    }
    if (this.match(TokenType.WHILE)) {
      return this.parseWhileStatement();
    }
    if (this.match(TokenType.DO)) {
      return this.parseDoWhileStatement();
    }
    if (this.match(TokenType.RETURN)) {
      let arg: Expression | undefined;
      if (!this.check(TokenType.SEMICOLON)) {
        arg = this.parseExpression();
      }
      this.consume(TokenType.SEMICOLON, 'Expected ;');
      return { type: 'ReturnStatement', argument: arg, pos };
    }
    if (this.match(TokenType.TRY)) {
      return this.parseTryCatchStatement();
    }
    if (this.match(TokenType.THROW)) {
      const arg = this.parseExpression();
      this.consume(TokenType.SEMICOLON, 'Expected ;');
      return { type: 'ThrowStatement', argument: arg, pos };
    }
    if (this.match(TokenType.BREAK)) {
      this.consume(TokenType.SEMICOLON, 'Expected ;');
      return { type: 'BreakStatement', pos };
    }
    if (this.match(TokenType.CONTINUE)) {
      this.consume(TokenType.SEMICOLON, 'Expected ;');
      return { type: 'ContinueStatement', pos };
    }

    return this.parseVariableOrExpressionStatement();
  }

  private parseVariableOrExpressionStatement(): Statement {
    const pos = this.currentPos();
    const savePos = this.pos;

    try {
      const varType = this.parseTypeReference();
      if (this.check(TokenType.IDENTIFIER)) {
        const name = this.advance().value;
        let initializer: Expression | undefined;
        if (this.match(TokenType.ASSIGN)) {
          initializer = this.parseExpression();
        }
        this.consume(TokenType.SEMICOLON, 'Expected ;');
        return { type: 'VariableDeclaration', name, varType, initializer, pos };
      }
      this.pos = savePos;
    } catch (e) {
      this.pos = savePos;
    }

    const expr = this.parseExpression();
    this.consume(TokenType.SEMICOLON, 'Expected ;');
    return { type: 'ExpressionStatement', expression: expr, pos: pos };
  }

  private parseIfStatement(): IfStatement {
    const pos = this.currentPos();
    this.consume(TokenType.LPAREN, 'Expected (');
    const condition = this.parseExpression();
    this.consume(TokenType.RPAREN, 'Expected )');
    const consequent = this.parseStatement();
    let alternate: Statement | undefined;
    if (this.match(TokenType.ELSE)) {
      alternate = this.parseStatement();
    }
    return { type: 'IfStatement', condition, consequent, alternate, pos };
  }

  private parseForStatement(): ForStatement {
    const pos = this.currentPos();
    this.consume(TokenType.LPAREN, 'Expected (');
    let init: VariableDeclaration | Expression | undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      const savePos = this.pos;
      try {
        const varType = this.parseTypeReference();
        if (this.check(TokenType.IDENTIFIER)) {
          const name = this.advance().value;
          let initializer: Expression | undefined;
          if (this.match(TokenType.ASSIGN)) {
            initializer = this.parseExpression();
          }
          init = { type: 'VariableDeclaration', name, varType, initializer, pos };
        } else {
          throw new Error();
        }
      } catch (e) {
        this.pos = savePos;
        init = this.parseExpression();
      }
    }
    this.consume(TokenType.SEMICOLON, 'Expected ;');
    let condition: Expression | undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.parseExpression();
    }
    this.consume(TokenType.SEMICOLON, 'Expected ;');
    let update: Expression | undefined;
    if (!this.check(TokenType.RPAREN)) {
      update = this.parseExpression();
    }
    this.consume(TokenType.RPAREN, 'Expected )');
    const body = this.parseStatement();
    return { type: 'ForStatement', init, condition, update, body, pos };
  }

  private parseWhileStatement(): WhileStatement {
    const pos = this.currentPos();
    this.consume(TokenType.LPAREN, 'Expected (');
    const condition = this.parseExpression();
    this.consume(TokenType.RPAREN, 'Expected )');
    const body = this.parseStatement();
    return { type: 'WhileStatement', condition, body, pos };
  }

  private parseDoWhileStatement(): DoWhileStatement {
    const pos = this.currentPos();
    const body = this.parseStatement();
    this.consume(TokenType.WHILE, 'Expected while');
    this.consume(TokenType.LPAREN, 'Expected (');
    const condition = this.parseExpression();
    this.consume(TokenType.RPAREN, 'Expected )');
    this.consume(TokenType.SEMICOLON, 'Expected ;');
    return { type: 'DoWhileStatement', body, condition, pos };
  }

  private parseTryCatchStatement(): TryCatchStatement {
    const pos = this.currentPos();
    const tryBlock = this.parseBlockStatement();
    let catchParam: Parameter | undefined;
    let catchBlock: BlockStatement | undefined;
    let finallyBlock: BlockStatement | undefined;
    if (this.match(TokenType.CATCH)) {
      this.consume(TokenType.LPAREN, 'Expected (');
      const catchType = this.parseTypeReference();
      const catchName = this.consume(TokenType.IDENTIFIER, 'Expected catch parameter name').value;
      catchParam = { type: 'Parameter', name: catchName, paramType: catchType, pos: this.currentPos() };
      this.consume(TokenType.RPAREN, 'Expected )');
      catchBlock = this.parseBlockStatement();
    }
    if (this.match(TokenType.FINALLY)) {
      finallyBlock = this.parseBlockStatement();
    }
    return { type: 'TryCatchStatement', tryBlock, catchParam, catchBlock, finallyBlock, pos };
  }

  private parseExpression(): Expression {
    return this.parseAssignment();
  }

  private parseAssignment(): Expression {
    const pos = this.currentPos();
    const left = this.parseTernary();
    if (this.checkOneOf(
      TokenType.ASSIGN,
      TokenType.PLUS_ASSIGN,
      TokenType.MINUS_ASSIGN,
      TokenType.STAR_ASSIGN,
      TokenType.SLASH_ASSIGN,
      TokenType.PERCENT_ASSIGN,
    )) {
      const operator = this.advance().value;
      const right = this.parseAssignment();
      return { type: 'AssignmentExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseTernary(): Expression {
    const pos = this.currentPos();
    const left = this.parseOr();
    if (this.match(TokenType.QUESTION)) {
      const consequent = this.parseExpression();
      this.consume(TokenType.COLON, 'Expected :');
      const alternate = this.parseTernary();
      return {
        type: 'BinaryExpression',
        operator: '?:',
        left,
        right: { type: 'BinaryExpression', operator: ',', left: consequent, right: alternate, pos },
        pos,
      };
    }
    return left;
  }

  private parseOr(): Expression {
    const pos = this.currentPos();
    let left = this.parseAnd();
    while (this.match(TokenType.OR_OR)) {
      const operator = '||';
      const right = this.parseAnd();
      left = { type: 'BinaryExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseAnd(): Expression {
    const pos = this.currentPos();
    let left = this.parseBitwiseOr();
    while (this.match(TokenType.AND_AND)) {
      const operator = '&&';
      const right = this.parseBitwiseOr();
      left = { type: 'BinaryExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseBitwiseOr(): Expression {
    const pos = this.currentPos();
    let left = this.parseBitwiseXor();
    while (this.match(TokenType.BITWISE_OR)) {
      const operator = '|';
      const right = this.parseBitwiseXor();
      left = { type: 'BinaryExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseBitwiseXor(): Expression {
    const pos = this.currentPos();
    let left = this.parseBitwiseAnd();
    while (this.match(TokenType.BITWISE_XOR)) {
      const operator = '^';
      const right = this.parseBitwiseAnd();
      left = { type: 'BinaryExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseBitwiseAnd(): Expression {
    const pos = this.currentPos();
    let left = this.parseEquality();
    while (this.match(TokenType.BITWISE_AND)) {
      const operator = '&';
      const right = this.parseEquality();
      left = { type: 'BinaryExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseEquality(): Expression {
    const pos = this.currentPos();
    let left = this.parseRelational();
    while (this.checkOneOf(TokenType.EQUAL_EQUAL, TokenType.NOT_EQUAL)) {
      const operator = this.advance().value;
      const right = this.parseRelational();
      left = { type: 'BinaryExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseRelational(): Expression {
    const pos = this.currentPos();
    let left = this.parseShift();
    while (this.checkOneOf(
      TokenType.LESS,
      TokenType.GREATER,
      TokenType.LESS_EQUAL,
      TokenType.GREATER_EQUAL,
      TokenType.INSTANCEOF,
      TokenType.IN,
    )) {
      const operator = this.advance().value;
      const right = this.parseShift();
      left = { type: 'BinaryExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseShift(): Expression {
    const pos = this.currentPos();
    let left = this.parseAdditive();
    while (this.checkOneOf(TokenType.LEFT_SHIFT, TokenType.RIGHT_SHIFT)) {
      const operator = this.advance().value;
      const right = this.parseAdditive();
      left = { type: 'BinaryExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseAdditive(): Expression {
    const pos = this.currentPos();
    let left = this.parseMultiplicative();
    while (this.checkOneOf(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.advance().value;
      const right = this.parseMultiplicative();
      left = { type: 'BinaryExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseMultiplicative(): Expression {
    const pos = this.currentPos();
    let left = this.parseUnary();
    while (this.checkOneOf(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const operator = this.advance().value;
      const right = this.parseUnary();
      left = { type: 'BinaryExpression', operator, left, right, pos };
    }
    return left;
  }

  private parseUnary(): Expression {
    const pos = this.currentPos();
    if (this.checkOneOf(TokenType.MINUS, TokenType.PLUS, TokenType.NOT, TokenType.BITWISE_NOT)) {
      const operator = this.advance().value;
      const operand = this.parseUnary();
      return { type: 'UnaryExpression', operator, operand, prefix: true, pos };
    }
    if (this.checkOneOf(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const operator = this.advance().value;
      const operand = this.parseUnary();
      return { type: 'UnaryExpression', operator, operand, prefix: true, pos };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expression {
    const pos = this.currentPos();
    let left = this.parseCallMember();
    while (this.checkOneOf(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const operator = this.advance().value;
      left = { type: 'UnaryExpression', operator, operand: left, prefix: false, pos };
    }
    return left;
  }

  private parseCallMember(): Expression {
    const pos = this.currentPos();
    let expr = this.parsePrimary();
    while (true) {
      if (this.check(TokenType.LPAREN)) {
        const args = this.parseArguments();
        expr = { type: 'CallExpression', callee: expr, arguments: args, pos };
      } else if (this.match(TokenType.DOT)) {
        const prop = this.consume(TokenType.IDENTIFIER, 'Expected property name');
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: { type: 'Identifier', name: prop.value, pos: this.currentPos() },
          pos,
        };
      } else if (this.check(TokenType.LBRACKET)) {
        this.advance();
        const index = this.parseExpression();
        this.consume(TokenType.RBRACKET, 'Expected ]');
        expr = { type: 'MemberExpression', object: expr, property: index, pos };
      } else {
        break;
      }
    }
    return expr;
  }

  private parseArguments(): Expression[] {
    const args: Expression[] = [];
    this.consume(TokenType.LPAREN, 'Expected (');
    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, 'Expected )');
    return args;
  }

  private parsePrimary(): Expression {
    const pos = this.currentPos();
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, 'Expected )');
      return expr;
    }
    if (this.match(TokenType.NEW)) {
      const className = this.parseTypeReference();
      const args = this.parseArguments();
      return { type: 'NewExpression', className, arguments: args, pos };
    }
    if (this.match(TokenType.THIS)) {
      return { type: 'ThisExpression', pos };
    }
    if (this.match(TokenType.SUPER)) {
      return { type: 'SuperExpression', pos };
    }
    if (this.check(TokenType.LBRACE)) {
      return this.parseArrayLiteral();
    }
    if (this.check(TokenType.NUMBER_LITERAL)) {
      const token = this.advance();
      return { type: 'Literal', value: parseFloat(token.value), literalType: 'number', pos };
    }
    if (this.check(TokenType.STRING_LITERAL)) {
      const token = this.advance();
      return { type: 'Literal', value: token.value, literalType: 'string', pos };
    }
    if (this.check(TokenType.CHAR_LITERAL)) {
      const token = this.advance();
      return { type: 'Literal', value: token.value, literalType: 'char', pos };
    }
    if (this.check(TokenType.BOOLEAN_LITERAL)) {
      const token = this.advance();
      return { type: 'Literal', value: token.value === 'true', literalType: 'boolean', pos };
    }
    if (this.check(TokenType.NULL_LITERAL)) {
      this.advance();
      return { type: 'Literal', value: null, literalType: 'null', pos };
    }
    if (this.check(TokenType.IDENTIFIER)) {
      const token = this.advance();
      return { type: 'Identifier', name: token.value, pos };
    }
    throw this.error(`Unexpected token: ${this.peek().value}`, this.peek());
  }

  private parseArrayLiteral(): ArrayLiteral {
    const pos = this.currentPos();
    this.consume(TokenType.LBRACE, 'Expected {');
    const elements: Expression[] = [];
    if (!this.check(TokenType.RBRACE)) {
      do {
        elements.push(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RBRACE, 'Expected }');
    return { type: 'ArrayLiteral', elements, pos };
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkOneOf(...types: TokenType[]): boolean {
    return types.some((t) => this.check(t));
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.error(message, this.peek());
  }

  private currentPos(): Position {
    const token = this.peek();
    return { line: token.line, column: token.column };
  }

  private error(message: string, token: Token): ParserError {
    return new ParserError(message, token.line, token.column);
  }
}
