import { createFileRoute } from '@tanstack/react-router'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { TextField } from '../components/DesignSystem/TextField'
import { NumberField } from '../components/DesignSystem/NumberField'
import { Button } from '../components/DesignSystem/Button'
import { updateOllama } from '../features/Settings/settingsSlice'
import { useState } from 'react'
import { PageTitle } from '../components/PageTitle'
import { Sparkles } from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const dispatch = useAppDispatch()
  const ollama = useAppSelector((s) => s.settings.ollama)

  const [baseUrl, setBaseUrl] = useState(ollama.baseUrl)
  const [defaultModel, setDefaultModel] = useState(ollama.defaultModel)
  const [timeout, setTimeoutMs] = useState<number>(ollama.timeout)
  const [temperature, setTemperature] = useState<number>(ollama.options.temperature)
  const [numPredict, setNumPredict] = useState<number>(ollama.options.num_predict)

  const isDirty =
    baseUrl !== ollama.baseUrl ||
    defaultModel !== ollama.defaultModel ||
    timeout !== ollama.timeout ||
    temperature !== ollama.options.temperature ||
    numPredict !== ollama.options.num_predict

  const save = () => {
    if (!isDirty) return
    dispatch(
      updateOllama({
        baseUrl,
        defaultModel,
        timeout,
        options: { temperature, num_predict: numPredict },
      }),
    )
  }

  const reset = () => {
    setBaseUrl(ollama.baseUrl)
    setDefaultModel(ollama.defaultModel)
    setTimeoutMs(ollama.timeout)
    setTemperature(ollama.options.temperature)
    setNumPredict(ollama.options.num_predict)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <PageTitle   className="text-2xl font-semibold">Settings</PageTitle>
      <section className="rounded-xl border border-ctp-surface1 overflow-hidden bg-ctp-base">
        <div className="p-3 bg-ctp-surface0 border-b border-b-ctp-surface1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ctp-mauve" />
            <h2 className="text-lg font-medium">Ollama</h2>
          </div>
        </div>
        <div className="p-3 flex flex-col gap-3">
          <div className="text-ctp-subtext1">
            Configure your local Ollama connection and defaults.
          </div>
          <TextField
            label="Base URL"
            value={baseUrl}
            onChange={setBaseUrl}
            variant="default"
          />
          <TextField
            label="Default model"
            value={defaultModel}
            onChange={setDefaultModel}
            variant="default"
          />
          <NumberField
            label="Timeout (ms)"
            value={timeout}
            onChange={setTimeoutMs}
            minValue={0}
            variant="default"
          />
          <NumberField
            label="Temperature"
            value={temperature}
            step={0.1}
            minValue={0}
            maxValue={2}
            onChange={setTemperature}
            variant="default"
          />
          <NumberField
            label="Tokens to predict"
            value={numPredict}
            minValue={1}
            onChange={setNumPredict}
            variant="default"
          />
        </div>
        <div className="p-3 bg-ctp-surface0 border-t border-ctp-surface1 flex justify-end gap-2">
          <Button variant="secondary" onClick={reset} isDisabled={!isDirty}>Cancel</Button>
          <Button onClick={save} isDisabled={!isDirty}>Save</Button>
        </div>
      </section>
    </div>
  )
}


