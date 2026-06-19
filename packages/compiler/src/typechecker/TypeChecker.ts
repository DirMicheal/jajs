import { SymbolTable } from './SymbolTable';
import {
  TypeInfo,
  TypeCheckerError,
  createType,
  typeEquals,
  isNumericType,
  isBooleanType,
  isStringType,
  isAssignable,
} from './types/Types';
import {
  CompilationUnit,
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
  Statement,
  Expression,
} from '../parser/ast/AST';

export class TypeChecker {
  private symbolTable: SymbolTable;
  private currentClass: ClassDeclaration | null = null;
  private currentMethod: MethodDeclaration | null = null;
  private classHierarchy: Map<string, string | null> = new Map();
  private classDeclarations: Map<string, ClassDeclaration> = new Map();
  private interfaceDeclarations: Map<string, InterfaceDeclaration> = new Map();

  constructor() {
    this.symbolTable = new SymbolTable();
  }

  public check(ast: CompilationUnit): void {
    this.registerTypes(ast);
    this.checkCompilationUnit(ast);
  }

  private registerTypes(ast: CompilationUnit): void {
    const globalScope = this.symbolTable.getGlobalScope();
    if (!globalScope.has('System')) {
      globalScope.define({
        name: 'System',
        type: createType('System'),
        kind: 'variable',
      });
    }

    const globalFunctions: Record<string, { returnType: string; params: { name: string; type: string }[] }> = {
      'println': { returnType: 'void', params: [{ name: 'msg', type: 'Object' }] },
      'print': { returnType: 'void', params: [{ name: 'msg', type: 'Object' }] },
      'alert': { returnType: 'void', params: [{ name: 'msg', type: 'Object' }] },
      'confirm': { returnType: 'boolean', params: [{ name: 'msg', type: 'Object' }] },
      'prompt': { returnType: 'String', params: [{ name: 'msg', type: 'Object' }] },
      'parseInt': { returnType: 'int', params: [{ name: 'str', type: 'String' }] },
      'parseFloat': { returnType: 'double', params: [{ name: 'str', type: 'String' }] },
      'isNaN': { returnType: 'boolean', params: [{ name: 'val', type: 'Object' }] },
      'isFinite': { returnType: 'boolean', params: [{ name: 'val', type: 'Object' }] },
      'encodeURI': { returnType: 'String', params: [{ name: 'uri', type: 'String' }] },
      'decodeURI': { returnType: 'String', params: [{ name: 'uri', type: 'String' }] },
      'setTimeout': { returnType: 'Timeout', params: [{ name: 'callback', type: 'Object' }, { name: 'delay', type: 'int' }] },
      'setInterval': { returnType: 'Interval', params: [{ name: 'callback', type: 'Object' }, { name: 'delay', type: 'int' }] },
      'clearTimeout': { returnType: 'void', params: [{ name: 'id', type: 'Timeout' }] },
      'clearInterval': { returnType: 'void', params: [{ name: 'id', type: 'Interval' }] },
    };
    for (const [name, sig] of Object.entries(globalFunctions)) {
      if (!globalScope.has(name)) {
        globalScope.define({
          name,
          type: createType(sig.returnType, false, true),
          kind: 'method',
          modifiers: ['public', 'static'],
          isStatic: true,
          parameters: sig.params.map((p) => ({ name: p.name, type: createType(p.type, false, true) })),
          returnType: createType(sig.returnType, false, true),
        });
      }
    }

    for (const decl of ast.declarations) {
      if (decl.type === 'ClassDeclaration') {
        this.classDeclarations.set(decl.name, decl);
        this.classHierarchy.set(decl.name, decl.superClass?.name || null);
        if (!globalScope.has(decl.name)) {
          globalScope.define({
            name: decl.name,
            type: createType(decl.name),
            kind: 'class',
            modifiers: decl.modifiers,
          });
        }
      } else if (decl.type === 'InterfaceDeclaration') {
        this.interfaceDeclarations.set(decl.name, decl);
        if (!globalScope.has(decl.name)) {
          globalScope.define({
            name: decl.name,
            type: createType(decl.name),
            kind: 'interface',
            modifiers: decl.modifiers,
          });
        }
      }
    }
  }

  private isSubclassOf(derivedName: string, baseName: string): boolean {
    if (derivedName === baseName) return true;
    if (baseName === 'Object') return true;
    let current: string | null | undefined = derivedName;
    const visited = new Set<string>();
    while (current) {
      if (visited.has(current)) break;
      visited.add(current);
      if (current === baseName) return true;
      current = this.classHierarchy.get(current);
    }
    return false;
  }

  private isTypeAssignable(target: TypeInfo, source: TypeInfo): boolean {
    if (isAssignable(target, source)) return true;
    if (!target.isArray && !source.isArray) {
      if (this.isSubclassOf(source.name, target.name)) return true;
    }
    return false;
  }

  private findClassMember(className: string, memberName: string): FieldDeclaration | MethodDeclaration | null {
    let currentClass: ClassDeclaration | null | undefined = this.classDeclarations.get(className);
    const visited = new Set<string>();
    while (currentClass && !visited.has(currentClass.name)) {
      visited.add(currentClass.name);
      for (const member of currentClass.members) {
        if (member.name === memberName) {
          return member;
        }
      }
      if (currentClass.superClass) {
        currentClass = this.classDeclarations.get(currentClass.superClass.name);
      } else {
        break;
      }
    }
    return null;
  }

  private checkCompilationUnit(ast: CompilationUnit): void {
    for (const decl of ast.declarations) {
      if (decl.type === 'ClassDeclaration') {
        this.checkClassDeclaration(decl);
      } else if (decl.type === 'InterfaceDeclaration') {
        this.checkInterfaceDeclaration(decl);
      }
    }
  }

  private checkClassDeclaration(node: ClassDeclaration): void {
    this.currentClass = node;
    this.symbolTable.enterScope(`class:${node.name}`);

    for (const member of node.members) {
      if (member.type === 'FieldDeclaration') {
        this.registerField(member);
      }
    }

    for (const member of node.members) {
      if (member.type === 'MethodDeclaration') {
        this.registerMethod(member);
      }
    }

    for (const member of node.members) {
      if (member.type === 'FieldDeclaration') {
        this.checkFieldDeclaration(member);
      } else if (member.type === 'MethodDeclaration') {
        this.checkMethodDeclaration(member);
      }
    }

    this.symbolTable.exitScope();
    this.currentClass = null;
  }

  private checkInterfaceDeclaration(node: InterfaceDeclaration): void {
    this.symbolTable.enterScope(`interface:${node.name}`);
    for (const member of node.members) {
      this.registerMethod(member);
    }
    for (const member of node.members) {
      if (member.returnType.name === 'void' && member.name === node.name) {
        throw new TypeCheckerError(
          'Interface constructor not allowed',
          member.pos.line,
          member.pos.column,
        );
      }
    }
    this.symbolTable.exitScope();
  }

  private registerField(node: FieldDeclaration): void {
    if (this.symbolTable.getCurrentScope().hasOwn(node.name)) {
      throw new TypeCheckerError(
        `Duplicate field '${node.name}'`,
        node.pos.line,
        node.pos.column,
      );
    }
    this.symbolTable.define({
      name: node.name,
      type: this.typeRefToInfo(node.fieldType),
      kind: 'field',
      modifiers: node.modifiers,
      isStatic: node.isStatic,
    });
  }

  private registerMethod(node: MethodDeclaration): void {
    const scope = this.symbolTable.getCurrentScope();
    const methodKey = `${node.name}(${node.parameters.map((p) => this.typeRefToInfo(p.paramType).name).join(',')})`;
    if (scope.hasOwn(methodKey)) {
      throw new TypeCheckerError(
        `Duplicate method signature '${node.name}'`,
        node.pos.line,
        node.pos.column,
      );
    }
    scope.define({
      name: node.name,
      type: this.typeRefToInfo(node.returnType),
      kind: 'method',
      modifiers: node.modifiers,
      isStatic: node.isStatic,
      parameters: node.parameters.map((p) => ({
        name: p.name,
        type: this.typeRefToInfo(p.paramType),
      })),
      returnType: this.typeRefToInfo(node.returnType),
    });
  }

  private checkFieldDeclaration(node: FieldDeclaration): void {
    const fieldType = this.typeRefToInfo(node.fieldType);
    if (node.initializer) {
      const initType = this.checkExpression(node.initializer);
      if (!this.isTypeAssignable(fieldType, initType)) {
        throw new TypeCheckerError(
          `Cannot assign '${this.typeName(initType)}' to field '${node.name}' of type '${this.typeName(fieldType)}'`,
          node.initializer.pos.line,
          node.initializer.pos.column,
        );
      }
    }
  }

  private checkMethodDeclaration(node: MethodDeclaration): void {
    this.currentMethod = node;
    this.symbolTable.enterScope(`method:${node.name}`);

    for (const param of node.parameters) {
      this.symbolTable.define({
        name: param.name,
        type: this.typeRefToInfo(param.paramType),
        kind: 'parameter',
      });
    }

    if (node.body) {
      this.checkBlockStatement(node.body);
    }

    this.symbolTable.exitScope();
    this.currentMethod = null;
  }

  private checkBlockStatement(node: BlockStatement): void {
    this.symbolTable.enterScope('block');
    for (const stmt of node.statements) {
      this.checkStatement(stmt);
    }
    this.symbolTable.exitScope();
  }

  private checkStatement(node: Statement): void {
    switch (node.type) {
      case 'BlockStatement':
        this.checkBlockStatement(node);
        break;
      case 'VariableDeclaration':
        this.checkVariableDeclaration(node);
        break;
      case 'IfStatement':
        this.checkIfStatement(node);
        break;
      case 'ForStatement':
        this.checkForStatement(node);
        break;
      case 'WhileStatement':
        this.checkWhileStatement(node);
        break;
      case 'DoWhileStatement':
        this.checkDoWhileStatement(node);
        break;
      case 'ReturnStatement':
        this.checkReturnStatement(node);
        break;
      case 'ExpressionStatement':
        this.checkExpression(node.expression);
        break;
      case 'TryCatchStatement':
        this.checkTryCatchStatement(node);
        break;
      case 'ThrowStatement':
        this.checkExpression(node.argument);
        break;
      case 'BreakStatement':
      case 'ContinueStatement':
        break;
    }
  }

  private checkVariableDeclaration(node: VariableDeclaration): void {
    if (this.symbolTable.getCurrentScope().hasOwn(node.name)) {
      throw new TypeCheckerError(
        `Variable '${node.name}' already declared in this scope`,
        node.pos.line,
        node.pos.column,
      );
    }

    const varType = this.typeRefToInfo(node.varType);
    this.symbolTable.define({
      name: node.name,
      type: varType,
      kind: 'variable',
    });

    if (node.initializer) {
      const initType = this.checkExpression(node.initializer);
      if (!this.isTypeAssignable(varType, initType)) {
        throw new TypeCheckerError(
          `Cannot assign '${this.typeName(initType)}' to variable '${node.name}' of type '${this.typeName(varType)}'`,
          node.initializer.pos.line,
          node.initializer.pos.column,
        );
      }
    }
  }

  private checkIfStatement(node: IfStatement): void {
    const condType = this.checkExpression(node.condition);
    if (!isBooleanType(condType)) {
      throw new TypeCheckerError(
        `Condition must be boolean, got '${this.typeName(condType)}'`,
        node.condition.pos.line,
        node.condition.pos.column,
      );
    }
    this.checkStatement(node.consequent);
    if (node.alternate) {
      this.checkStatement(node.alternate);
    }
  }

  private checkForStatement(node: ForStatement): void {
    this.symbolTable.enterScope('for');
    if (node.init && node.init.type === 'VariableDeclaration') {
      this.checkVariableDeclaration(node.init);
    } else if (node.init) {
      this.checkExpression(node.init);
    }
    if (node.condition) {
      const condType = this.checkExpression(node.condition);
      if (!isBooleanType(condType)) {
        throw new TypeCheckerError(
          `For condition must be boolean, got '${this.typeName(condType)}'`,
          node.condition.pos.line,
          node.condition.pos.column,
        );
      }
    }
    if (node.update) {
      this.checkExpression(node.update);
    }
    this.checkStatement(node.body);
    this.symbolTable.exitScope();
  }

  private checkWhileStatement(node: WhileStatement): void {
    const condType = this.checkExpression(node.condition);
    if (!isBooleanType(condType)) {
      throw new TypeCheckerError(
        `While condition must be boolean, got '${this.typeName(condType)}'`,
        node.condition.pos.line,
        node.condition.pos.column,
      );
    }
    this.checkStatement(node.body);
  }

  private checkDoWhileStatement(node: DoWhileStatement): void {
    this.checkStatement(node.body);
    const condType = this.checkExpression(node.condition);
    if (!isBooleanType(condType)) {
      throw new TypeCheckerError(
        `Do-while condition must be boolean, got '${this.typeName(condType)}'`,
        node.condition.pos.line,
        node.condition.pos.column,
      );
    }
  }

  private checkReturnStatement(node: ReturnStatement): void {
    if (!this.currentMethod) {
      throw new TypeCheckerError(
        'Return statement outside of method',
        node.pos.line,
        node.pos.column,
      );
    }
    const returnType = this.typeRefToInfo(this.currentMethod.returnType);
    if (node.argument) {
      const argType = this.checkExpression(node.argument);
      if (returnType.name === 'void') {
        throw new TypeCheckerError(
          'Cannot return a value from void method',
          node.argument.pos.line,
          node.argument.pos.column,
        );
      }
      if (!this.isTypeAssignable(returnType, argType)) {
        throw new TypeCheckerError(
          `Cannot return '${this.typeName(argType)}' from method returning '${this.typeName(returnType)}'`,
          node.argument.pos.line,
          node.argument.pos.column,
        );
      }
    } else if (returnType.name !== 'void') {
      throw new TypeCheckerError(
        `Must return a value of type '${this.typeName(returnType)}'`,
        node.pos.line,
        node.pos.column,
      );
    }
  }

  private checkTryCatchStatement(node: TryCatchStatement): void {
    this.checkBlockStatement(node.tryBlock);
    if (node.catchBlock && node.catchParam) {
      this.symbolTable.enterScope('catch');
      this.symbolTable.define({
        name: node.catchParam.name,
        type: this.typeRefToInfo(node.catchParam.paramType),
        kind: 'parameter',
      });
      this.checkBlockStatement(node.catchBlock);
      this.symbolTable.exitScope();
    }
    if (node.finallyBlock) {
      this.checkBlockStatement(node.finallyBlock);
    }
  }

  private checkExpression(node: Expression): TypeInfo {
    switch (node.type) {
      case 'AssignmentExpression':
        return this.checkAssignmentExpression(node);
      case 'BinaryExpression':
        return this.checkBinaryExpression(node);
      case 'UnaryExpression':
        return this.checkUnaryExpression(node);
      case 'CallExpression':
        return this.checkCallExpression(node);
      case 'MemberExpression':
        return this.checkMemberExpression(node);
      case 'NewExpression':
        return this.checkNewExpression(node);
      case 'Identifier':
        return this.checkIdentifier(node);
      case 'Literal':
        return this.checkLiteral(node);
      case 'ThisExpression':
        return this.checkThisExpression(node);
      case 'SuperExpression':
        return this.checkSuperExpression(node);
      case 'ArrayLiteral':
        return this.checkArrayLiteral(node);
    }
  }

  private checkAssignmentExpression(node: AssignmentExpression): TypeInfo {
    const leftType = this.checkExpression(node.left);
    const rightType = this.checkExpression(node.right);

    if (node.operator === '=') {
      if (!this.isTypeAssignable(leftType, rightType)) {
        throw new TypeCheckerError(
          `Cannot assign '${this.typeName(rightType)}' to '${this.typeName(leftType)}'`,
          node.pos.line,
          node.pos.column,
        );
      }
    } else {
      if (!isNumericType(leftType) || !isNumericType(rightType)) {
        throw new TypeCheckerError(
          `Operator '${node.operator}' requires numeric types`,
          node.pos.line,
          node.pos.column,
        );
      }
    }
    return leftType;
  }

  private checkBinaryExpression(node: BinaryExpression): TypeInfo {
    const leftType = this.checkExpression(node.left);
    const rightType = this.checkExpression(node.right);

    const arithmeticOps = ['+', '-', '*', '/', '%', '<<', '>>', '&', '|', '^'];
    const comparisonOps = ['<', '>', '<=', '>='];
    const equalityOps = ['==', '!='];
    const logicalOps = ['&&', '||'];

    if (arithmeticOps.includes(node.operator)) {
      if (node.operator === '+') {
        if (isStringType(leftType) || isStringType(rightType)) {
          return createType('String', false, true);
        }
      }
      if (!isNumericType(leftType) || !isNumericType(rightType)) {
        throw new TypeCheckerError(
          `Operator '${node.operator}' requires numeric types`,
          node.pos.line,
          node.pos.column,
        );
      }
      return createType('double', false, true);
    }

    if (comparisonOps.includes(node.operator)) {
      if (!isNumericType(leftType) || !isNumericType(rightType)) {
        throw new TypeCheckerError(
          `Operator '${node.operator}' requires numeric types`,
          node.pos.line,
          node.pos.column,
        );
      }
      return createType('boolean', false, true);
    }

    if (equalityOps.includes(node.operator)) {
      return createType('boolean', false, true);
    }

    if (logicalOps.includes(node.operator)) {
      if (!isBooleanType(leftType) || !isBooleanType(rightType)) {
        throw new TypeCheckerError(
          `Operator '${node.operator}' requires boolean types`,
          node.pos.line,
          node.pos.column,
        );
      }
      return createType('boolean', false, true);
    }

    return leftType;
  }

  private checkUnaryExpression(node: UnaryExpression): TypeInfo {
    const operandType = this.checkExpression(node.operand);

    if (['+', '-', '~'].includes(node.operator)) {
      if (!isNumericType(operandType)) {
        throw new TypeCheckerError(
          `Operator '${node.operator}' requires numeric type`,
          node.pos.line,
          node.pos.column,
        );
      }
      return operandType;
    }

    if (node.operator === '!') {
      if (!isBooleanType(operandType)) {
        throw new TypeCheckerError(
          `Operator '!' requires boolean type`,
          node.pos.line,
          node.pos.column,
        );
      }
      return createType('boolean', false, true);
    }

    if (['++', '--'].includes(node.operator)) {
      if (!isNumericType(operandType)) {
        throw new TypeCheckerError(
          `Operator '${node.operator}' requires numeric type`,
          node.pos.line,
          node.pos.column,
        );
      }
      return operandType;
    }

    return operandType;
  }

  private checkCallExpression(node: CallExpression): TypeInfo {
    const calleeType = this.checkExpression(node.callee);

    if (node.callee.type === 'Identifier') {
      const symbol = this.symbolTable.resolve(node.callee.name);
      if (symbol && symbol.kind === 'method' && symbol.parameters && symbol.returnType) {
        if (node.arguments.length !== symbol.parameters.length) {
          throw new TypeCheckerError(
            `Method '${node.callee.name}' expects ${symbol.parameters.length} arguments, got ${node.arguments.length}`,
            node.pos.line,
            node.pos.column,
          );
        }
        for (let i = 0; i < node.arguments.length; i++) {
          const argType = this.checkExpression(node.arguments[i]);
          const paramType = symbol.parameters[i].type;
          if (!this.isTypeAssignable(paramType, argType)) {
            throw new TypeCheckerError(
              `Argument ${i + 1} of '${node.callee.name}' expects '${this.typeName(paramType)}', got '${this.typeName(argType)}'`,
              node.arguments[i].pos.line,
              node.arguments[i].pos.column,
            );
          }
        }
        return symbol.returnType;
      }

      if (node.callee.name === 'console') {
        return createType('void', false, true);
      }
    }

    if (node.callee.type === 'MemberExpression') {
      if (node.callee.property.type === 'Identifier') {
        const methodName = node.callee.property.name;
        if (methodName === 'log' || methodName === 'println' || methodName === 'print') {
          return createType('void', false, true);
        }
        if (methodName === 'length' && calleeType.isArray) {
          return createType('int', false, true);
        }

        const globalObjectMethods: Record<string, Record<string, { returnType: string; params: string[] }>> = {
          'Window': {
            'alert': { returnType: 'void', params: ['Object'] },
            'confirm': { returnType: 'boolean', params: ['Object'] },
            'prompt': { returnType: 'String', params: ['Object'] },
            'setTimeout': { returnType: 'Timeout', params: ['Object', 'int'] },
            'setInterval': { returnType: 'Interval', params: ['Object', 'int'] },
            'clearTimeout': { returnType: 'void', params: ['Timeout'] },
            'clearInterval': { returnType: 'void', params: ['Interval'] },
          },
          'Document': {
            'getElementById': { returnType: 'HTMLElement', params: ['String'] },
            'getElementsByClassName': { returnType: 'NodeList', params: ['String'] },
            'getElementsByTagName': { returnType: 'NodeList', params: ['String'] },
            'querySelector': { returnType: 'HTMLElement', params: ['String'] },
            'querySelectorAll': { returnType: 'NodeList', params: ['String'] },
            'createElement': { returnType: 'HTMLElement', params: ['String'] },
            'createTextNode': { returnType: 'HTMLElement', params: ['String'] },
          },
          'HTMLElement': {
            'appendChild': { returnType: 'HTMLElement', params: ['HTMLElement'] },
            'removeChild': { returnType: 'HTMLElement', params: ['HTMLElement'] },
            'addEventListener': { returnType: 'void', params: ['String', 'Object'] },
            'removeEventListener': { returnType: 'void', params: ['String', 'Object'] },
            'setAttribute': { returnType: 'void', params: ['String', 'String'] },
            'getAttribute': { returnType: 'String', params: ['String'] },
            'removeAttribute': { returnType: 'void', params: ['String'] },
            'hasAttribute': { returnType: 'boolean', params: ['String'] },
            'click': { returnType: 'void', params: [] },
            'focus': { returnType: 'void', params: [] },
            'blur': { returnType: 'void', params: [] },
          },
          'Location': {
            'assign': { returnType: 'void', params: ['String'] },
            'reload': { returnType: 'void', params: [] },
            'replace': { returnType: 'void', params: ['String'] },
          },
          'History': {
            'back': { returnType: 'void', params: [] },
            'forward': { returnType: 'void', params: [] },
            'go': { returnType: 'void', params: ['int'] },
            'pushState': { returnType: 'void', params: ['Object', 'String', 'String'] },
            'replaceState': { returnType: 'void', params: ['Object', 'String', 'String'] },
          },
          'Storage': {
            'getItem': { returnType: 'String', params: ['String'] },
            'setItem': { returnType: 'void', params: ['String', 'String'] },
            'removeItem': { returnType: 'void', params: ['String'] },
            'clear': { returnType: 'void', params: [] },
            'key': { returnType: 'String', params: ['int'] },
          },
          'NodeList': {
            'item': { returnType: 'HTMLElement', params: ['int'] },
            'forEach': { returnType: 'void', params: ['Object'] },
          },
          'Event': {
            'preventDefault': { returnType: 'void', params: [] },
            'stopPropagation': { returnType: 'void', params: [] },
          },
          'Process': {
            'exit': { returnType: 'void', params: ['int'] },
            'cwd': { returnType: 'String', params: [] },
            'chdir': { returnType: 'void', params: ['String'] },
            'nextTick': { returnType: 'void', params: ['Object'] },
          },
          'Math': {
            'abs': { returnType: 'double', params: ['double'] },
            'ceil': { returnType: 'double', params: ['double'] },
            'floor': { returnType: 'double', params: ['double'] },
            'round': { returnType: 'double', params: ['double'] },
            'max': { returnType: 'double', params: ['double', 'double'] },
            'min': { returnType: 'double', params: ['double', 'double'] },
            'pow': { returnType: 'double', params: ['double', 'double'] },
            'sqrt': { returnType: 'double', params: ['double'] },
            'random': { returnType: 'double', params: [] },
            'sin': { returnType: 'double', params: ['double'] },
            'cos': { returnType: 'double', params: ['double'] },
            'tan': { returnType: 'double', params: ['double'] },
            'asin': { returnType: 'double', params: ['double'] },
            'acos': { returnType: 'double', params: ['double'] },
            'atan': { returnType: 'double', params: ['double'] },
            'atan2': { returnType: 'double', params: ['double', 'double'] },
            'exp': { returnType: 'double', params: ['double'] },
            'log': { returnType: 'double', params: ['double'] },
            'sign': { returnType: 'double', params: ['double'] },
            'trunc': { returnType: 'double', params: ['double'] },
          },
          'JSON': {
            'parse': { returnType: 'Object', params: ['String'] },
            'stringify': { returnType: 'String', params: ['Object'] },
          },
          'Date': {
            'now': { returnType: 'long', params: [] },
            'parse': { returnType: 'long', params: ['String'] },
            'UTC': { returnType: 'long', params: ['int', 'int', 'int'] },
          },
          'Console': {
            'log': { returnType: 'void', params: ['Object'] },
            'error': { returnType: 'void', params: ['Object'] },
            'warn': { returnType: 'void', params: ['Object'] },
            'info': { returnType: 'void', params: ['Object'] },
            'debug': { returnType: 'void', params: ['Object'] },
            'trace': { returnType: 'void', params: [] },
            'clear': { returnType: 'void', params: [] },
            'table': { returnType: 'void', params: ['Object'] },
            'dir': { returnType: 'void', params: ['Object'] },
            'group': { returnType: 'void', params: ['String'] },
            'groupEnd': { returnType: 'void', params: [] },
            'time': { returnType: 'void', params: ['String'] },
            'timeEnd': { returnType: 'void', params: ['String'] },
            'count': { returnType: 'void', params: ['String'] },
          },
        };

        if (node.callee.object.type === 'Identifier') {
          const objectName = node.callee.object.name;
          const methods = globalObjectMethods[objectName];
          if (methods && methods[methodName]) {
            const sig = methods[methodName];
            if (node.arguments.length < sig.params.length) {
              throw new TypeCheckerError(
                `Method '${objectName}.${methodName}' expects at least ${sig.params.length} arguments, got ${node.arguments.length}`,
                node.pos.line,
                node.pos.column,
              );
            }
            for (let i = 0; i < Math.min(node.arguments.length, sig.params.length); i++) {
              const argType = this.checkExpression(node.arguments[i]);
              const paramType = createType(sig.params[i], false, true);
              if (!this.isTypeAssignable(paramType, argType) && !isNumericType(paramType) && !isNumericType(argType)) {
                throw new TypeCheckerError(
                  `Argument ${i + 1} of '${objectName}.${methodName}' expects '${this.typeName(paramType)}', got '${this.typeName(argType)}'`,
                  node.arguments[i].pos.line,
                  node.arguments[i].pos.column,
                );
              }
            }
            return createType(sig.returnType, false, true);
          }

          const objectType = this.checkExpression(node.callee.object);
          const objMethods = globalObjectMethods[objectType.name];
          if (objMethods && objMethods[methodName]) {
            const sig = objMethods[methodName];
            return createType(sig.returnType, false, true);
          }
        }

        if (node.callee.object.type === 'Identifier') {
          const className = node.callee.object.name;
          const classSym = this.symbolTable.getGlobalScope().resolve(className);
          if (classSym && classSym.kind === 'class') {
            const member = this.findClassMember(className, methodName);
            if (member && member.type === 'MethodDeclaration') {
              if (node.arguments.length !== member.parameters.length) {
                throw new TypeCheckerError(
                  `Method '${className}.${methodName}' expects ${member.parameters.length} arguments, got ${node.arguments.length}`,
                  node.pos.line,
                  node.pos.column,
                );
              }
              for (let i = 0; i < node.arguments.length; i++) {
                const argType = this.checkExpression(node.arguments[i]);
                const paramType = this.typeRefToInfo(member.parameters[i].paramType);
                if (!this.isTypeAssignable(paramType, argType)) {
                  throw new TypeCheckerError(
                    `Argument ${i + 1} of '${className}.${methodName}' expects '${this.typeName(paramType)}', got '${this.typeName(argType)}'`,
                    node.arguments[i].pos.line,
                    node.arguments[i].pos.column,
                  );
                }
              }
              return this.typeRefToInfo(member.returnType);
            }
          }
        }

        const member = this.findClassMember(calleeType.name, methodName);
        if (member && member.type === 'MethodDeclaration') {
          if (node.arguments.length !== member.parameters.length) {
            throw new TypeCheckerError(
              `Method '${methodName}' expects ${member.parameters.length} arguments, got ${node.arguments.length}`,
              node.pos.line,
              node.pos.column,
            );
          }
          for (let i = 0; i < node.arguments.length; i++) {
            const argType = this.checkExpression(node.arguments[i]);
            const paramType = this.typeRefToInfo(member.parameters[i].paramType);
            if (!this.isTypeAssignable(paramType, argType)) {
              throw new TypeCheckerError(
                `Argument ${i + 1} of '${methodName}' expects '${this.typeName(paramType)}', got '${this.typeName(argType)}'`,
                node.arguments[i].pos.line,
                node.arguments[i].pos.column,
              );
            }
          }
          return this.typeRefToInfo(member.returnType);
        }
      }
    }

    return createType('Object', false, true);
  }

  private checkMemberExpression(node: MemberExpression): TypeInfo {
    const objectType = this.checkExpression(node.object);

    if (node.property.type === 'Identifier') {
      const propName = node.property.name;

      if (propName === 'length' && objectType.isArray) {
        return createType('int', false, true);
      }

      if (propName === 'length' && isStringType(objectType)) {
        return createType('int', false, true);
      }

      if (propName === 'out' && (objectType.name === 'System')) {
        return createType('Console', false, true);
      }

      if (propName === 'println' || propName === 'print' || propName === 'log') {
        if (objectType.name === 'Console' || objectType.name === 'System.out') {
          return createType('void', false, true);
        }
      }

      const globalObjectProps: Record<string, Record<string, string>> = {
        'Window': {
          'alert': 'void', 'confirm': 'boolean', 'prompt': 'String',
          'setTimeout': 'Timeout', 'setInterval': 'Interval',
          'clearTimeout': 'void', 'clearInterval': 'void',
          'location': 'Location', 'document': 'Document', 'navigator': 'Navigator',
          'history': 'History', 'localStorage': 'Storage', 'sessionStorage': 'Storage',
          'innerWidth': 'int', 'innerHeight': 'int',
          'scrollX': 'double', 'scrollY': 'double',
        },
        'Document': {
          'getElementById': 'HTMLElement', 'getElementsByClassName': 'NodeList',
          'getElementsByTagName': 'NodeList', 'querySelector': 'HTMLElement',
          'querySelectorAll': 'NodeList', 'createElement': 'HTMLElement',
          'createTextNode': 'HTMLElement', 'body': 'HTMLElement', 'head': 'HTMLElement',
          'title': 'String', 'URL': 'String', 'cookie': 'String',
        },
        'HTMLElement': {
          'id': 'String', 'className': 'String', 'innerHTML': 'String',
          'innerText': 'String', 'textContent': 'String', 'style': 'Object',
          'parentElement': 'HTMLElement', 'children': 'NodeList',
          'appendChild': 'HTMLElement', 'removeChild': 'HTMLElement',
          'addEventListener': 'void', 'removeEventListener': 'void',
          'setAttribute': 'void', 'getAttribute': 'String',
          'removeAttribute': 'void', 'hasAttribute': 'boolean',
          'click': 'void', 'focus': 'void', 'blur': 'void',
        },
        'Navigator': {
          'userAgent': 'String', 'language': 'String', 'platform': 'String',
          'appName': 'String', 'appVersion': 'String', 'cookieEnabled': 'boolean',
          'onLine': 'boolean', 'geolocation': 'Object',
        },
        'Location': {
          'href': 'String', 'protocol': 'String', 'host': 'String',
          'hostname': 'String', 'port': 'String', 'pathname': 'String',
          'search': 'String', 'hash': 'String',
          'assign': 'void', 'reload': 'void', 'replace': 'void',
        },
        'History': {
          'length': 'int', 'back': 'void', 'forward': 'void', 'go': 'void',
          'pushState': 'void', 'replaceState': 'void',
        },
        'Storage': {
          'length': 'int', 'getItem': 'String', 'setItem': 'void',
          'removeItem': 'void', 'clear': 'void', 'key': 'String',
        },
        'NodeList': {
          'length': 'int', 'item': 'HTMLElement', 'forEach': 'void',
        },
        'Event': {
          'type': 'String', 'target': 'HTMLElement', 'currentTarget': 'HTMLElement',
          'timeStamp': 'double', 'bubbles': 'boolean', 'cancelable': 'boolean',
          'preventDefault': 'void', 'stopPropagation': 'void',
        },
        'Process': {
          'env': 'Object', 'argv': 'Array', 'exit': 'void',
          'cwd': 'String', 'chdir': 'void', 'nextTick': 'void',
          'stdout': 'Object', 'stderr': 'Object', 'stdin': 'Object',
          'version': 'String', 'versions': 'Object', 'platform': 'String',
          'arch': 'String', 'pid': 'int', 'title': 'String',
        },
        'Math': {
          'PI': 'double', 'E': 'double', 'LN2': 'double', 'LN10': 'double',
          'LOG2E': 'double', 'LOG10E': 'double', 'SQRT2': 'double', 'SQRT1_2': 'double',
          'abs': 'double', 'ceil': 'double', 'floor': 'double', 'round': 'double',
          'max': 'double', 'min': 'double', 'pow': 'double', 'sqrt': 'double',
          'random': 'double', 'sin': 'double', 'cos': 'double', 'tan': 'double',
          'asin': 'double', 'acos': 'double', 'atan': 'double', 'atan2': 'double',
          'exp': 'double', 'log': 'double', 'sign': 'double', 'trunc': 'double',
        },
        'JSON': {
          'parse': 'Object', 'stringify': 'String',
        },
        'Date': {
          'now': 'long', 'parse': 'long', 'UTC': 'long',
        },
        'Console': {
          'log': 'void', 'error': 'void', 'warn': 'void', 'info': 'void',
          'debug': 'void', 'trace': 'void', 'clear': 'void',
          'table': 'void', 'dir': 'void', 'group': 'void', 'groupEnd': 'void',
          'time': 'void', 'timeEnd': 'void', 'count': 'void',
        },
      };

      const typeProps = globalObjectProps[objectType.name];
      if (typeProps && typeProps[propName]) {
        return createType(typeProps[propName], false, true);
      }

      if (this.currentClass && (node.object.type === 'ThisExpression' || objectType.name === this.currentClass.name)) {
        for (const member of this.currentClass.members) {
          if (member.type === 'FieldDeclaration' && member.name === propName) {
            return this.typeRefToInfo(member.fieldType);
          }
          if (member.type === 'MethodDeclaration' && member.name === propName) {
            return this.typeRefToInfo(member.returnType);
          }
        }
        if (this.currentClass.superClass) {
          return createType('Object', false, true);
        }
      }

      const classSymbol = this.symbolTable.resolve(objectType.name);
      if (classSymbol) {
        let scope: any = this.symbolTable.getCurrentScope();
        while (scope) {
          const fieldSymbol = scope.hasOwn(propName) ? scope.getSymbols().get(propName) : null;
          if (fieldSymbol && fieldSymbol.kind === 'field') {
            return fieldSymbol.type;
          }
          if (fieldSymbol && fieldSymbol.kind === 'method' && fieldSymbol.returnType) {
            return fieldSymbol.returnType;
          }
          scope = scope.getParent();
        }
      }

      if (this.classDeclarations.has(objectType.name)) {
        const member = this.findClassMember(objectType.name, propName);
        if (member) {
          if (member.type === 'FieldDeclaration') {
            return this.typeRefToInfo(member.fieldType);
          }
          if (member.type === 'MethodDeclaration') {
            return this.typeRefToInfo(member.returnType);
          }
        }
      }
    }

    if (node.property.type !== 'Identifier') {
      const indexType = this.checkExpression(node.property);
      if (!isNumericType(indexType)) {
        throw new TypeCheckerError(
          'Array index must be numeric',
          node.property.pos.line,
          node.property.pos.column,
        );
      }
      if (objectType.isArray) {
        const elementTypeName = objectType.name;
        return createType(elementTypeName);
      }
    }

    return createType('Object', false, true);
  }

  private checkNewExpression(node: NewExpression): TypeInfo {
    const typeName = node.className.name;
    const symbol = this.symbolTable.getGlobalScope().resolve(typeName);
    if (!symbol) {
      throw new TypeCheckerError(
        `Cannot find class '${typeName}'`,
        node.pos.line,
        node.pos.column,
      );
    }
    if (symbol.kind !== 'class') {
      throw new TypeCheckerError(
        `'${typeName}' is not a class`,
        node.pos.line,
        node.pos.column,
      );
    }
    return createType(typeName, node.className.isArray);
  }

  private checkIdentifier(node: Identifier): TypeInfo {
    const symbol = this.symbolTable.resolve(node.name);
    if (!symbol) {
      throw new TypeCheckerError(
        `Cannot find symbol '${node.name}'`,
        node.pos.line,
        node.pos.column,
      );
    }
    return symbol.type;
  }

  private checkLiteral(node: Literal): TypeInfo {
    switch (node.literalType) {
      case 'number':
        const val = node.value as number;
        if (Number.isInteger(val)) {
          return createType('int', false, true);
        }
        return createType('double', false, true);
      case 'string':
      case 'char':
        return createType('String', false, true);
      case 'boolean':
        return createType('boolean', false, true);
      case 'null':
        return createType('Object', false, true, undefined);
    }
  }

  private checkThisExpression(node: ThisExpression): TypeInfo {
    if (!this.currentClass) {
      throw new TypeCheckerError(
        "'this' cannot be used outside of class",
        node.pos.line,
        node.pos.column,
      );
    }
    return createType(this.currentClass.name);
  }

  private checkSuperExpression(node: SuperExpression): TypeInfo {
    if (!this.currentClass || !this.currentClass.superClass) {
      throw new TypeCheckerError(
        "'super' cannot be used here",
        node.pos.line,
        node.pos.column,
      );
    }
    return this.typeRefToInfo(this.currentClass.superClass);
  }

  private checkArrayLiteral(node: ArrayLiteral): TypeInfo {
    if (node.elements.length === 0) {
      return createType('Object', true);
    }
    const firstType = this.checkExpression(node.elements[0]);
    for (let i = 1; i < node.elements.length; i++) {
      const elemType = this.checkExpression(node.elements[i]);
      if (!this.isTypeAssignable(firstType, elemType) && !this.isTypeAssignable(elemType, firstType)) {
        throw new TypeCheckerError(
          `Inconsistent array element types: '${this.typeName(firstType)}' and '${this.typeName(elemType)}'`,
          node.elements[i].pos.line,
          node.elements[i].pos.column,
        );
      }
    }
    return createType(firstType.name, true);
  }

  private typeRefToInfo(ref: TypeReference): TypeInfo {
    return createType(ref.name, ref.isArray, undefined, ref.genericArgs?.map((a) => this.typeRefToInfo(a)));
  }

  private typeName(t: TypeInfo): string {
    return t.isArray ? `${t.name}[]` : t.name;
  }
}
