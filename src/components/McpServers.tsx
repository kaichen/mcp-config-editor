import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import type { Config } from '../lib/config';
import { 
  readConfig, 
  writeConfig, 
  hasPathVariable, 
  replacePathVariable, 
  hasTextVariable, 
  replaceTextVariable,
  needsEnvInput,
  getEnvInputFields,
  replaceEnvVariables,
  getEnvDefaults
} from '../lib/config';
import { MCP_SERVERS } from '../lib/servers';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@radix-ui/react-scroll-area';

export function McpServers() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<Config>();
  const [envInputs, setEnvInputs] = useState<Record<string, Record<string, string>>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const cfg = await readConfig();
    setConfig(cfg);
  }

  async function handleToggleServer(serverType: string) {
    if (!config) return;

    const newConfig = { ...config };
    
    if (newConfig.mcpServers[serverType]) {
      delete newConfig.mcpServers[serverType];
    } else {
      const serverDef = MCP_SERVERS[serverType];
      let newServer = serverDef;

      if (hasPathVariable(serverDef)) {
        const path = await open({
          directory: true,
          multiple: false,
        });
        if (!path) return;
        newServer = replacePathVariable(serverDef, path as string);
      }
      
      if (hasTextVariable(serverDef)) {
        const text = texts[serverType];
        if (!text) return;
        newServer = replaceTextVariable(newServer, text);
        setTexts(prev => ({ ...prev, [serverType]: '' }));
      }

      if (needsEnvInput(serverDef)) {
        const envValues = envInputs[serverType];
        const requiredFields = getEnvInputFields(serverDef);
        if (!envValues || !requiredFields.every(field => envValues[field.key])) return;
        newServer = replaceEnvVariables(newServer, envValues);
        setEnvInputs(prev => ({ ...prev, [serverType]: {} }));
      }

      newConfig.mcpServers[serverType] = newServer;
    }
    
    await writeConfig(newConfig);
    setConfig(newConfig);
  }

  if (!config) return null;

  return (
    <div className="h-screen-full">
      <section className="bg-background border-b mb-4 pb-4 z-10">
        <h2 className="text-2xl font-bold">{t('mcp.title')}</h2>
        <p className="text-muted-foreground">{t('mcp.description')}</p>
      </section>

      <ScrollArea className="h-[calc(100vh-10rem)] overflow-scroll space-y-4">
          {Object.entries(MCP_SERVERS).map(([type, server]) => {
            const isEnabled = type in config.mcpServers;
            const needsPath = hasPathVariable(server);
            const needsText = hasTextVariable(server);
            const envFields = getEnvInputFields(server);
            const envDefaults = getEnvDefaults(server);
            
            return (
              <div key={type} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">{type}</h4>
                  <p className="text-sm text-gray-500">
                    {needsPath ? t('common.needsPath') : 
                     needsText ? t('common.needsText') : 
                     envFields.length > 0 ? t('common.needsEnv') : 
                     t('common.noConfig')}
                  </p>
                  {isEnabled && (
                    <p className="text-xs text-gray-500">
                      {config.mcpServers[type].command} {config.mcpServers[type].args.join(' ')}
                    </p>
                  )}
                  {Object.entries(envDefaults).map(([key, value]) => (
                    <p key={key} className="text-xs text-gray-500">
                      {key}: {value}
                    </p>
                  ))}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {!isEnabled && envFields.map(field => (
                    <Input
                      key={field.key}
                      className="w-48"
                      placeholder={field.key}
                      type={field.isSecret ? "password" : "text"}
                      value={envInputs[type]?.[field.key] || ''}
                      onChange={(e) => setEnvInputs(prev => ({
                        ...prev,
                        [type]: { ...prev[type], [field.key]: e.target.value }
                      }))}
                    />
                  ))}
                  {needsText && !isEnabled && (
                    <Input
                      className="w-48"
                      placeholder={t('common.inputText')}
                      value={texts[type] || ''}
                      onChange={(e) => setTexts(prev => ({ ...prev, [type]: e.target.value }))}
                    />
                  )}
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggleServer(type)}
                  />
                </div>
              </div>
            );
            })}
        </ScrollArea>
    </div>
  );
} 