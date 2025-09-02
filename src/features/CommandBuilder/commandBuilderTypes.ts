interface TokenDefinitionBase {
  label: string;
  description: string;
  required?: boolean;
  multivalue?: boolean;
  delimiter?: string;
  defaultValue?: string;
  helpLink?: string;
}

export interface TokenDefText extends TokenDefinitionBase {
  type: "text";
  placeholder: string;
}

export interface TokenDefNumber extends TokenDefinitionBase {
  type: "number";
  min?: number;
  max?: number;
}

export interface TokenDefOpen extends TokenDefinitionBase {
  type: "open";
  filters: { name: string; extensions: string[] }[];
}

export interface TokenDefSave extends TokenDefinitionBase {
  type: "save";
  filters: { name: string; extensions: string[] }[];
  defaultPath: string;
}

export interface TokenDefUrl extends TokenDefinitionBase {
  type: "url";
}

export interface TokenDefTemplate extends TokenDefinitionBase {
  type: "template";
  template: string;
}

export type TokenDef =
  | TokenDefText
  | TokenDefNumber
  | TokenDefOpen
  | TokenDefSave
  | TokenDefUrl
  | TokenDefTemplate;

export type TokenDefType = TokenDef["type"];

export interface Recipe {
  name: string;
  description: string;
  hidden?: boolean;
  base: string;
  args: string[];
  tokens: Record<string, TokenDef>;
}
