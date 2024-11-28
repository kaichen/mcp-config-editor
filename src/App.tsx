import { McpServers } from './components/McpServers';
import { LanguageSwitch } from './components/LanguageSwitch';

function App() {
  return (
    <div className="container mx-auto py-8">
      <LanguageSwitch />
      <McpServers />
    </div>
  );
}

export default App;
