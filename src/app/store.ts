import { configureStore } from '@reduxjs/toolkit'
import commandBuilderReducer from '../features/CommandBuilder/commandBuilderSlice'
import terminalHistoryReducer from '../features/Terminal/terminalHistorySlice'
import uiReducer from '../features/UI/uiSlice'
import settingsReducer, { replaceSettings } from '../features/Settings/settingsSlice'
import { devToolsEnhancer } from "@redux-devtools/remote";
import type { SettingsState } from '../features/Settings/settingsSlice'

const store = configureStore({
  reducer: {
    commandBuilder: commandBuilderReducer,
    terminalHistory: terminalHistoryReducer,
    ui: uiReducer,
    settings: settingsReducer,
  },
  enhancers: (getDefaultEnhancers) =>
    getDefaultEnhancers().concat(
      devToolsEnhancer({
        name: 'Command Line Cookbook',
        hostname: '127.0.0.1',
        port: 8000,
        realtime: true,
      }),
    ),
})

export default store;

// Infer the `RootState`,  `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store

// --- Tauri Store persistence for settings ---
// Lazy import to avoid hard crashes if plugin is unavailable (e.g., non-Tauri env)
let tauriSettingsStorePromise: Promise<any | null> | null = null
function getTauriSettingsStore() {
  if (!tauriSettingsStorePromise) {
    tauriSettingsStorePromise = import('@tauri-apps/plugin-store')
      .then((m) => m.load('settings.json'))
      .catch(() => null)
  }
  return tauriSettingsStorePromise
}

async function hydrateSettingsFromDisk() {
  try {
    console.log('hydrateSettingsFromDisk')
    const settingsStore = await getTauriSettingsStore()
    if (!settingsStore) return
    console.log('settingsStore', settingsStore)
    const data = (await settingsStore.get('settings')) as SettingsState | undefined
    console.log('hydrateSettingsFromDisk', data)
    if (data) {
      store.dispatch(replaceSettings(data))
    }
  } catch (err) {
    console.error('Failed to hydrate settings from Tauri Store', err)
  }
}

// Kick off hydration immediately
void hydrateSettingsFromDisk()

// Debounced save on changes
let saveTimer: any
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      const settingsStore = await getTauriSettingsStore()
      if (!settingsStore) return
      const current = store.getState().settings as SettingsState
      await settingsStore.set('settings', current)
      await settingsStore.save()
    } catch (err) {
      console.error('Failed to persist settings to Tauri Store', err)
    }
  }, 300)
}

let lastSerializedSettings = JSON.stringify(store.getState().settings)
store.subscribe(() => {
  const serialized = JSON.stringify(store.getState().settings)
  if (serialized !== lastSerializedSettings) {
    lastSerializedSettings = serialized
    scheduleSave()
  }
})
