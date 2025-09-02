import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TokenDef } from "./commandBuilderTypes";
// import { TokenDef } from "./commandBuilderTypes";

interface CommandBuilderState {
  // tokens: Record<string, TokenDef>;
  tokenValues: Record<string, TokenValue>;
  useRelativePaths: boolean;
}

type TokenValuePrimitive = string | number | boolean;
type TokenValueArray = string[] | number[] | boolean[];
type TokenValueType = TokenValuePrimitive | TokenValueArray;

interface TokenValue {
  value: TokenValueType;
  enabled: boolean;
  error?: string;
}

const initialState: CommandBuilderState = {
  // tokens: {},
  tokenValues: {},
  useRelativePaths: false,
};

export const commandBuilderSlice = createSlice({
  name: "commandBuilder",
  initialState,
  reducers: {
    initTokenValues: (
      state,
      action: PayloadAction<Record<string, TokenDef>>,
    ) => {
      // Replace the entire tokenValues map when initializing for a new recipe
      const newMap: CommandBuilderState["tokenValues"] = {};
      Object.entries(action.payload).forEach(([name, token]) => {
        newMap[name] = {
          value: token.defaultValue ?? "",
          enabled: token.required ?? false,
        };
      });
      state.tokenValues = newMap;
    },
    setTokenValue: (
      state,
      action: PayloadAction<{ name: string; value: TokenValueType }>,
    ) => {
      if (state.tokenValues[action.payload.name]) {
        state.tokenValues[action.payload.name].value = action.payload.value;
      } else {
        state.tokenValues[action.payload.name] = {
          value: action.payload.value,
          enabled: true,
        };
      }
    },
    setTokenEnabled: (
      state,
      action: PayloadAction<{ name: string; enabled: boolean }>,
    ) => {
      if (state.tokenValues[action.payload.name]) {
        state.tokenValues[action.payload.name].enabled = action.payload.enabled;
      } else {
        state.tokenValues[action.payload.name] = {
          value: "",
          enabled: action.payload.enabled,
        };
      }
    },
    setUseRelativePaths: (state, action: PayloadAction<boolean>) => {
      state.useRelativePaths = action.payload;
    },
  },
});

export const {
  // setTokenDefinitions,
  initTokenValues,
  setTokenEnabled,
  setTokenValue,
  setUseRelativePaths,
} = commandBuilderSlice.actions;

export default commandBuilderSlice.reducer;
