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