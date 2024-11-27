import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./index.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to Tauri + React</h1>

      <div className="flex justify-center items-center gap-4 mb-8">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="h-16 w-16" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="h-16 w-16" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="h-16 w-16" alt="React logo" />
        </a>
      </div>
      <p className="text-center text-gray-600 mb-8">
        Click on the Tauri, Vite, and React logos to learn more.
      </p>

      <form
        className="flex flex-col gap-4 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <Input
          className="max-w-xs"
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <Button type="submit">Greet</Button>
      </form>
      {greetMsg && (
        <p className="mt-4 text-center text-lg">{greetMsg}</p>
      )}
    </main>
  );
}

export default App;
