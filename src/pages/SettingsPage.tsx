import React, { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { Save, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { preferredLanguage, setPreferredLanguage, model, setModel, theme, setTheme, apiKeys, setApiKey } = useSettingsStore();
  const [showKeys, setShowKeys] = useState(false);

  return (
    <div className="p-8 h-full overflow-y-auto bg-background text-primary">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted">Manage your preferences and API connections.</p>
        </div>

        {/* Preferences */}
        <section className="p-6 bg-surface border border-border rounded-xl space-y-6">
          <h2 className="text-xl font-bold mb-4 border-b border-border pb-2">Preferences</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-muted">Preferred Language</label>
            <select 
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-accent"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-muted">AI Model</label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-accent"
            >
              <option value="gemini-flash-latest">Gemini Flash (Default)</option>
              <option value="gemini-pro-latest">Gemini Pro</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="custom">Custom Endpoint</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-muted">Theme</label>
            <div className="flex gap-4">
              {['dark', 'light', 'system'].map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t as any)}
                  className={`px-4 py-2 rounded-lg border capitalize transition-colors ${
                    theme === t ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:border-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* API Keys */}
        <section className="p-6 bg-surface border border-border rounded-xl space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
            <h2 className="text-xl font-bold">API Keys</h2>
            <button 
              onClick={() => setShowKeys(!showKeys)}
              className="text-xs text-muted hover:text-primary underline"
            >
              {showKeys ? 'Hide Keys' : 'Show Keys'}
            </button>
          </div>
          <div className="text-sm text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded flex items-start gap-2">
            <Key size={16} className="mt-0.5" />
            <p>Keys are stored locally in your browser only and never leave your device.</p>
          </div>

          {[
            { id: 'gemini', label: 'Google AI (Gemini) Key' },
            { id: 'openai', label: 'OpenAI API Key' },
            { id: 'anthropic', label: 'Anthropic API Key' }
          ].map(provider => (
            <div key={provider.id}>
              <label className="block text-sm font-medium mb-2 text-muted">{provider.label}</label>
              <div className="flex gap-2">
                <input 
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys[provider.id as keyof typeof apiKeys] || ''}
                  onChange={(e) => setApiKey(provider.id as keyof typeof apiKeys, e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-accent font-mono text-sm"
                />
              </div>
            </div>
          ))}
          
          <button className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
            <Save size={16} /> Save Changes
          </button>
        </section>

      </div>
    </div>
  );
};
