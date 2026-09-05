import { useEffect, useState } from "react";
import api from "./api/axios";

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setStatus(res.data.message))
      .catch(() => setStatus("Backend unreachable — is the server running?"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">EventHub</h1>
        <p className="text-sm text-slate-400">Day 1 — monorepo wiring check</p>
        <p className="mt-4 rounded-md bg-slate-800 px-4 py-2 font-mono text-sm">
          API status: {status}
        </p>
      </div>
    </div>
  );
}

export default App;
