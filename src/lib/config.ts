import { BaseDirectory, join, localDataDir } from '@tauri-apps/api/path';
import { mkdir, readTextFile, writeTextFile, exists as fsExists } from '@tauri-apps/plugin-fs';

export interface McpServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface Config {
  mcpServers: Record<string, McpServer>;
}

const defaultConfig: Config = {
  mcpServers: {}
};

export function hasPathVariable(server: McpServer): boolean {
  return server.args.some(arg => arg.includes('${path:') || arg.includes('${dir:'));
}

export function hasTextVariable(server: McpServer): boolean {
  return server.args.some(arg => arg.includes('${text:'));
}

export function needsEnvInput(server: McpServer): boolean {
  return Boolean(server.env && Object.keys(server.env).length > 0);
}

export function getEnvDefaults(server: McpServer): Record<string, string> {
  if (!server.env) return {};
  return Object.fromEntries(
    Object.entries(server.env)
      .filter(([_, value]) => value.includes('${default:'))
      .map(([key, value]) => {
        const match = value.match(/\$\{default:([^}]+)\}/);
        return [key, match ? match[1] : value];
      })
  );
}

export function getEnvInputFields(server: McpServer): Array<{ key: string; isSecret: boolean }> {
  if (!server.env) return [];
  return Object.entries(server.env)
    .filter(([_, value]) => !value.includes('${default:'))
    .map(([key]) => ({
      key,
      isSecret: key.includes('_TOKEN') || key.includes('_KEY')
    }));
}

export function replaceEnvVariables(server: McpServer, envValues: Record<string, string>): McpServer {
  if (!server.env) return server;
  
  const newServer = { ...server };
  const defaults = getEnvDefaults(server);
  
  newServer.env = {
    ...defaults,
    ...envValues
  };
  
  return newServer;
}

export function extractTextVariables(server: McpServer): string[] {
  return server.args
    .filter(arg => arg.includes('${text:'))
    .map(arg => {
      const match = arg.match(/\$\{text:([^}]+)\}/);
      return match ? match[1] : '';
    })
    .filter((value): value is string => Boolean(value));
}

export function replaceTextVariable(server: McpServer, text: string): McpServer {
  const newServer = { ...server };
  newServer.args = server.args.map(arg => {
    if (arg.includes('${text:')) {
      return text;
    }
    return arg;
  });
  return newServer;
}

export function extractPathVariables(server: McpServer): string[] {
  return server.args
    .filter(arg => arg.includes('${path:') || arg.includes('${dir:'))
    .map(arg => {
      const pathMatch = arg.match(/\$\{path:([^}]+)\}/);
      const dirMatch = arg.match(/\$\{dir:([^}]+)\}/);
      return (pathMatch || dirMatch) ? (pathMatch?.[1] || dirMatch?.[1]) : '';
    })
    .filter((value): value is string => Boolean(value));
}

export function replacePathVariable(server: McpServer, path: string): McpServer {
  const newServer = { ...server };
  newServer.args = server.args.map(arg => {
    if (arg.includes('${path:') || arg.includes('${dir:')) {
      return path;
    }
    return arg;
  });
  return newServer;
}

export async function getConfigPath() {
  return await join(
    await localDataDir(),
    'Claude',
    'claude_desktop_config.json'
  );
}

export async function readConfig(): Promise<Config> {
  const configPath = await getConfigPath();
  
  try {
    const exists = await fsExists(configPath);
    if (!exists) {
      await mkdir('Claude', { 
        recursive: true,
        baseDir: BaseDirectory.LocalData
      });
      await writeTextFile(configPath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
    
    const content = await readTextFile(configPath);
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading config:', error);
    return defaultConfig;
  }
}

export async function writeConfig(config: Config) {
  const configPath = await getConfigPath();
  await writeTextFile(configPath, JSON.stringify(config, null, 2));
} 