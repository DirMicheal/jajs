export type ASTNodeType =
  | 'CompilationUnit'
  | 'ImportDeclaration'
  | 'ClassDeclaration'
  | 'InterfaceDeclaration'
  | 'FieldDeclaration'
  | 'MethodDeclaration'
  | 'Parameter'
  | 'BlockStatement'
  | 'VariableDeclaration'
  | 'TypeReference'
  | 'GenericType'
  | 'IfStatement'
  | 'ForStatement'
  | 'WhileStatement'
  | 'DoWhileStatement'
  | 'ReturnStatement'
  | 'ExpressionStatement'
  | 'AssignmentExpression'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'CallExpression'
  | 'MemberExpression'
  | 'NewExpression'
  | 'Identifier'
  | 'Literal'
  | 'ThisExpression'
  | 'SuperExpression'
  | 'ArrayLiteral'
  | 'TryCatchStatement'
  | 'ThrowStatement'
  | 'BreakStatement'
  | 'ContinueStatement'
  | 'Annotation'
  | 'ArrayType';

export interface Position {
  line: number;
  column: number;
}

export interface BaseASTNode {
  type: ASTNodeType;
  pos: Position;
}

export interface CompilationUnit extends BaseASTNode {
  type: 'CompilationUnit';
  imports: ImportDeclaration[];
  declarations: (ClassDeclaration | InterfaceDeclaration)[];
}

export interface ImportDeclaration extends BaseASTNode {
  type: 'ImportDeclaration';
  path: string;
}

export interface Annotation extends BaseASTNode {
  type: 'Annotation';
  name: string;
  arguments?: Expression[];
}

export interface ClassDeclaration extends BaseASTNode {
  type: 'ClassDeclaration';
  name: string;
  modifiers: string[];
  isAbstract: boolean;
  superClass?: TypeReference;
  interfaces: TypeReference[];
  members: (FieldDeclaration | MethodDeclaration)[];
  annotations: Annotation[];
}

export interface InterfaceDeclaration extends BaseASTNode {
  type: 'InterfaceDeclaration';
  name: string;
  modifiers: string[];
  extends: TypeReference[];
  members: MethodDeclaration[];
  annotations: Annotation[];
}

export interface FieldDeclaration extends BaseASTNode {
  type: 'FieldDeclaration';
  name: string;
  fieldType: TypeReference;
  modifiers: string[];
  isStatic: boolean;
  initializer?: Expression;
  annotations: Annotation[];
}

export interface MethodDeclaration extends BaseASTNode {
  type: 'MethodDeclaration';
  name: string;
  returnType: TypeReference;
  parameters: Parameter[];
  modifiers: string[];
  isStatic: boolean;
  isAbstract: boolean;
  body?: BlockStatement;
  annotations: Annotation[];
}

export interface Parameter extends BaseASTNode {
  type: 'Parameter';
  name: string;
  paramType: TypeReference;
}

export interface TypeReference extends BaseASTNode {
  type: 'TypeReference';
  name: string;
  isArray: boolean;
  genericArgs?: TypeReference[];
}

export interface BlockStatement extends BaseASTNode {
  type: 'BlockStatement';
  statements: Statement[];
}

export interface VariableDeclaration extends BaseASTNode {
  type: 'VariableDeclaration';
  name: string;
  varType: TypeReference;
  initializer?: Expression;
}

export interface IfStatement extends BaseASTNode {
  type: 'IfStatement';
  condition: Expression;
  consequent: Statement;
  alternate?: Statement;
}

export interface ForStatement extends BaseASTNode {
  type: 'ForStatement';
  init?: VariableDeclaration | Expression;
  condition?: Expression;
  update?: Expression;
  body: Statement;
}

export interface WhileStatement extends BaseASTNode {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement;
}

export interface DoWhileStatement extends BaseASTNode {
  type: 'DoWhileStatement';
  body: Statement;
  condition: Expression;
}

export interface ReturnStatement extends BaseASTNode {
  type: 'ReturnStatement';
  argument?: Expression;
}

export interface ExpressionStatement extends BaseASTNode {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface AssignmentExpression extends BaseASTNode {
  type: 'AssignmentExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface BinaryExpression extends BaseASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends BaseASTNode {
  type: 'UnaryExpression';
  operator: string;
  operand: Expression;
  prefix: boolean;
}

export interface CallExpression extends BaseASTNode {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression extends BaseASTNode {
  type: 'MemberExpression';
  object: Expression;
  property: Expression;
}

export interface NewExpression extends BaseASTNode {
  type: 'NewExpression';
  className: TypeReference;
  arguments: Expression[];
}

export interface Identifier extends BaseASTNode {
  type: 'Identifier';
  name: string;
}

export interface Literal extends BaseASTNode {
  type: 'Literal';
  value: string | number | boolean | null;
  literalType: 'number' | 'string' | 'boolean' | 'null' | 'char';
}

export interface ThisExpression extends BaseASTNode {
  type: 'ThisExpression';
}

export interface SuperExpression extends BaseASTNode {
  type: 'SuperExpression';
}

export interface ArrayLiteral extends BaseASTNode {
  type: 'ArrayLiteral';
  elements: Expression[];
}

export interface TryCatchStatement extends BaseASTNode {
  type: 'TryCatchStatement';
  tryBlock: BlockStatement;
  catchParam?: Parameter;
  catchBlock?: BlockStatement;
  finallyBlock?: BlockStatement;
}

export interface ThrowStatement extends BaseASTNode {
  type: 'ThrowStatement';
  argument: Expression;
}

export interface BreakStatement extends BaseASTNode {
  type: 'BreakStatement';
}

export interface ContinueStatement extends BaseASTNode {
  type: 'ContinueStatement';
}

export type Statement =
  | BlockStatement
  | VariableDeclaration
  | IfStatement
  | ForStatement
  | WhileStatement
  | DoWhileStatement
  | ReturnStatement
  | ExpressionStatement
  | TryCatchStatement
  | ThrowStatement
  | BreakStatement
  | ContinueStatement;

export type Expression =
  | AssignmentExpression
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | MemberExpression
  | NewExpression
  | Identifier
  | Literal
  | ThisExpression
  | SuperExpression
  | ArrayLiteral;
