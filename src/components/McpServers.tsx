import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import type { Config, McpServer } from '../lib/config';
import { readConfig, writeConfig, hasPathVariable, replacePathVariable } from '../lib/config';
import { MCP_SERVERS } from '../lib/servers';

export function McpServers() {
  const [config, setConfig] = useState<Config>();
  const [tokens, setTokens] = useState<Record<string, string>>({});

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
      
      if (hasPathVariable(serverDef)) {
        const path = await open({
          directory: true,
          multiple: false,
        });
        if (!path) return;
        newConfig.mcpServers[serverType] = replacePathVariable(serverDef, path as string);
      } else if (serverDef.env && Object.keys(serverDef.env).some(key => serverDef.env![key].includes('<YOUR_TOKEN>'))) {
        const token = tokens[serverType];
        if (!token) return;
        newConfig.mcpServers[serverType] = {
          ...serverDef,
          env: {
            ...serverDef.env,
            [Object.keys(serverDef.env).find(key => serverDef.env![key].includes('<YOUR_TOKEN>'))!]: token
          }
        };
        setTokens(prev => ({ ...prev, [serverType]: '' }));
      } else {
        newConfig.mcpServers[serverType] = serverDef;
      }
    }
    
    await writeConfig(newConfig);
    setConfig(newConfig);
  }

  if (!config) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>MCP Servers</CardTitle>
        <CardDescription>管理 Model Context Protocol 服务器</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(MCP_SERVERS).map(([type, server]) => {
          const isEnabled = type in config.mcpServers;
          const needsToken = server.env && Object.values(server.env).some(v => v.includes('<YOUR_TOKEN>'));
          const needsPath = hasPathVariable(server);
          
          return (
            <div key={type} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{type}</h4>
                <p className="text-sm text-gray-500">
                  {needsPath ? '需要选择路径' : needsToken ? '需要 Token' : '无需配置'}
                </p>
                {isEnabled && (
                  <p className="text-xs text-gray-500">
                    {config.mcpServers[type].command} {config.mcpServers[type].args.join(' ')}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {needsToken && !isEnabled && (
                  <Input
                    className="w-48"
                    placeholder="输入 Token"
                    type="password"
                    value={tokens[type] || ''}
                    onChange={(e) => setTokens(prev => ({ ...prev, [type]: e.target.value }))}
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
      </CardContent>
    </Card>
  );
} 