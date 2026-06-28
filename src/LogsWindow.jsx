import { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export default function LogsWindow() {
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (!window.electronAPI) return;
    
    const unsub = window.electronAPI.onLogUpdate((line) => {
      setLogs((prev) => [...prev, line]);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-green-400 p-4 font-mono text-xs flex flex-col">
      <div className="flex items-center gap-2 mb-4 text-white border-b border-gray-800 pb-2">
        <Terminal size={16} />
        <span className="font-bold uppercase tracking-wider">Developer Logs</span>
        <button 
          onClick={() => setLogs([])}
          className="ml-auto text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pb-10">
        {logs.length === 0 && <div className="text-gray-500 italic">No logs yet...</div>}
        {logs.map((log, i) => (
          <div key={i} className="break-all whitespace-pre-wrap">{log}</div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
