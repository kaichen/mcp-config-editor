import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Config, readConfig, writeConfig } from '../lib/config';

const AVAILABLE_SERVERS = {
  memory: {
    name: '内存服务器',
    description: '临时存储数据，重启后清除',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory']
    }
  },
  filesystem: {
    name: '文件系统服务器',
    description: '从本地文件系统读取数据',
    needsPath: true,
    config: (path: string) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', path]
    })
  },
  git: {
    name: 'Git 服务器',
    description: '从 Git 仓库读取数据',
    needsPath: true,
    config: (path: string) => ({
      command: 'uvx',
      args: ['mcp-server-git', '--repository', path]
    })
  },
  github: {
    name: 'Github 服务器',
    description: '从 Github 仓库读取数据',
    needsToken: true,
    config: (token: string) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: token
      }
    })
  }
} as const;

export function McpServers() {
  const [config, setConfig] = useState<Config>();
  const [githubToken, setGithubToken] = useState('');

  useEffect(() => {
    loadConfig();
  }, [config]);

  async function loadConfig() {
    console.log('🐟cfg', config);
    const cfg = await readConfig();
    console.log('🐟cfg', cfg);
    setConfig(cfg);
  }

  async function handleToggleServer(serverType: keyof typeof AVAILABLE_SERVERS) {
    if (!config) return;

    const newConfig = { ...config };
    
    if (newConfig.mcpServers[serverType]) {
      delete newConfig.mcpServers[serverType];
    } else {
      const serverDef = AVAILABLE_SERVERS[serverType];
      
      if ('needsPath' in serverDef && serverDef.needsPath) {
        const path = await open({
          directory: true,
          multiple: false,
        });
        if (!path) return;
        newConfig.mcpServers[serverType] = serverDef.config(path as string);
      } else if ('needsToken' in serverDef && serverDef.needsToken) {
        if (!githubToken) return;
        newConfig.mcpServers[serverType] = serverDef.config(githubToken);
        setGithubToken('');
      } else {
        newConfig.mcpServers[serverType] = serverDef.config;
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
        {Object.entries(AVAILABLE_SERVERS).map(([type, server]) => {
          const isEnabled = type in config.mcpServers;
          return (
            <div key={type} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{server.name}</h4>
                <p className="text-sm text-gray-500">{server.description}</p>
                {isEnabled && (
                  <p className="text-xs text-gray-500">
                    {config.mcpServers[type].command} {config.mcpServers[type].args.join(' ')}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {'needsToken' in server && server.needsToken && !isEnabled && (
                  <Input
                    className="w-48"
                    placeholder="Github Token"
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                  />
                )}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => handleToggleServer(type as keyof typeof AVAILABLE_SERVERS)}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
} 