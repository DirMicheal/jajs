export interface TypeInfo {
  name: string;
  isArray: boolean;
  isPrimitive: boolean;
  isNullable: boolean;
  genericArgs?: TypeInfo[];
}

export interface SymbolInfo {
  name: string;
  type: TypeInfo;
  kind: 'variable' | 'parameter' | 'field' | 'method' | 'class' | 'interface';
  modifiers?: string[];
  isStatic?: boolean;
  parent?: string;
  parameters?: { name: string; type: TypeInfo }[];
  returnType?: TypeInfo;
}

export class TypeCheckerError extends Error {
  constructor(message: string, public line: number, public column: number) {
    super(`[Line ${line}, Column ${column}] Type Error: ${message}`);
    this.name = 'TypeCheckerError';
  }
}

export const PRIMITIVE_TYPES = new Set([
  'int',
  'long',
  'float',
  'double',
  'boolean',
  'char',
  'byte',
  'short',
  'void',
  'String',
  'Number',
  'Object',
  'Array',
  'Error',
  'Console',
  'Math',
  'Date',
  'JSON',
  'Map',
  'Set',
  'Promise',
  'Window',
  'Document',
  'Navigator',
  'Location',
  'History',
  'Storage',
  'HTMLElement',
  'NodeList',
  'Event',
  'Process',
  'Buffer',
  'Timeout',
  'Interval',
]);

export function createType(
  name: string,
  isArray: boolean = false,
  isPrimitive: boolean = false,
  genericArgs?: TypeInfo[],
): TypeInfo {
  return {
    name,
    isArray,
    isPrimitive: isPrimitive || PRIMITIVE_TYPES.has(name),
    isNullable: !isPrimitive || name === 'String',
    genericArgs,
  };
}

export function typeEquals(a: TypeInfo, b: TypeInfo): boolean {
  if (a.isArray !== b.isArray) return false;
  if (a.name !== b.name) return false;
  if (a.isPrimitive && b.isPrimitive) {
    return a.name === b.name || isNumericType(a) && isNumericType(b);
  }
  return true;
}

export function isNumericType(t: TypeInfo): boolean {
  return ['int', 'long', 'float', 'double', 'byte', 'short'].includes(t.name);
}

export function isBooleanType(t: TypeInfo): boolean {
  return t.name === 'boolean';
}

export function isStringType(t: TypeInfo): boolean {
  return t.name === 'String';
}

export function isAssignable(target: TypeInfo, source: TypeInfo): boolean {
  if (typeEquals(target, source)) return true;
  if (isNumericType(target) && isNumericType(source)) return true;
  if (target.name === 'Object' && !source.isPrimitive) return true;
  if (target.isArray && source.isArray) return true;
  return false;
}
