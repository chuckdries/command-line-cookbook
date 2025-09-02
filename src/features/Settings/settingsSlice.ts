import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OllamaOptions {
  temperature: number;
  num_predict: number;
}

export interface SettingsState {
  ollama: {
    baseUrl: string;
    defaultModel: string;
    timeout: number;
    options: OllamaOptions;
  };
}

const initialState: SettingsState = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    defaultModel: 'qwen3:4b',
    timeout: 30000,
    options: {
      temperature: 0.3,
      num_predict: 300,
    },
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Replace the entire settings state (used for hydration from disk)
    replaceSettings(_state, action: PayloadAction<SettingsState>) {
      return action.payload
    },
    updateOllama(state, action: PayloadAction<Partial<SettingsState['ollama']>>) {
      const existing = state.ollama ?? initialState.ollama;

      state.ollama = {
        ...existing,
        ...action.payload,
      };
    },
  },
});

export const { updateOllama, replaceSettings } = settingsSlice.actions;
export default settingsSlice.reducer;


