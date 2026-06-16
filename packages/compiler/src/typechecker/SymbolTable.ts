import { SymbolInfo } from './types/Types';

export class Scope {
  private symbols: Map<string, SymbolInfo> = new Map();
  private parent: Scope | null;
  public readonly name: string;

  constructor(parent: Scope | null = null, name: string = 'global') {
    this.parent = parent;
    this.name = name;
  }

  public define(symbol: SymbolInfo): void {
    if (this.symbols.has(symbol.name)) {
      throw new Error(`Symbol '${symbol.name}' already defined in scope '${this.name}'`);
    }
    this.symbols.set(symbol.name, symbol);
  }

  public resolve(name: string): SymbolInfo | null {
    const symbol = this.symbols.get(name);
    if (symbol) return symbol;
    if (this.parent) return this.parent.resolve(name);
    return null;
  }

  public has(name: string): boolean {
    return this.resolve(name) !== null;
  }

  public hasOwn(name: string): boolean {
    return this.symbols.has(name);
  }

  public getParent(): Scope | null {
    return this.parent;
  }

  public getSymbols(): Map<string, SymbolInfo> {
    return this.symbols;
  }
}

export class SymbolTable {
  private globalScope: Scope;
  private currentScope: Scope;

  constructor() {
    this.globalScope = new Scope(null, 'global');
    this.currentScope = this.globalScope;
    this.addBuiltins();
  }

  private addBuiltins(): void {
    const builtinTypes = ['Object', 'String', 'Number', 'Boolean', 'Array', 'Error', 'Console', 'Math', 'Date', 'JSON', 'Map', 'Set', 'Promise'];
    for (const name of builtinTypes) {
      this.globalScope.define({
        name,
        type: { name, isArray: false, isPrimitive: true, isNullable: false },
        kind: 'class',
      });
    }

    this.globalScope.define({
      name: 'console',
      type: { name: 'Console', isArray: false, isPrimitive: true, isNullable: false },
      kind: 'variable',
    });
  }

  public enterScope(name: string = 'anonymous'): Scope {
    const scope = new Scope(this.currentScope, name);
    this.currentScope = scope;
    return scope;
  }

  public exitScope(): void {
    if (this.currentScope.getParent()) {
      this.currentScope = this.currentScope.getParent()!;
    }
  }

  public define(symbol: SymbolInfo): void {
    this.currentScope.define(symbol);
  }

  public resolve(name: string): SymbolInfo | null {
    return this.currentScope.resolve(name);
  }

  public has(name: string): boolean {
    return this.currentScope.has(name);
  }

  public getCurrentScope(): Scope {
    return this.currentScope;
  }

  public getGlobalScope(): Scope {
    return this.globalScope;
  }
}
