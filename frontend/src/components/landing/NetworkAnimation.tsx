export function NetworkAnimation() {
  const apis = [
    { id: 'shopify', label: 'Shopify', y: 80 },
    { id: 'stripe', label: 'Stripe', y: 180 },
    { id: 'github', label: 'GitHub', y: 280 },
    { id: 'notion', label: 'Notion', y: 380 },
  ]

  const clients = [
    { id: 'claude', label: 'Claude', y: 110 },
    { id: 'cursor', label: 'Cursor', y: 210 },
    { id: 'chatgpt', label: 'ChatGPT', y: 310 },
  ]

  const cx = 300  // center x (mcpfy node)
  const cy = 230  // center y
  const lx = 60   // left nodes x
  const rx = 540  // right nodes x

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-40">
      <svg
        viewBox="0 0 600 460"
        className="w-full max-w-4xl h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Animated dash for left→center lines */}
          {apis.map((api, i) => (
            <style key={api.id}>{`
              @keyframes dash-${api.id} {
                from { stroke-dashoffset: 40; }
                to   { stroke-dashoffset: 0; }
              }
              .line-${api.id} {
                animation: dash-${api.id} ${1.2 + i * 0.15}s linear infinite;
                stroke-dasharray: 6 6;
              }
            `}</style>
          ))}
          {/* Animated dash for center→right lines */}
          {clients.map((client, i) => (
            <style key={client.id}>{`
              @keyframes dash-${client.id} {
                from { stroke-dashoffset: 40; }
                to   { stroke-dashoffset: 0; }
              }
              .line-${client.id} {
                animation: dash-${client.id} ${1.0 + i * 0.2}s linear infinite;
                stroke-dasharray: 6 6;
              }
            `}</style>
          ))}
          <style>{`
            @keyframes pulse-center {
              0%, 100% { r: 22; opacity: 0.9; }
              50%       { r: 26; opacity: 1; }
            }
            .pulse-center { animation: pulse-center 2.5s ease-in-out infinite; }
            @keyframes float-node {
              0%, 100% { transform: translateY(0px); }
              50%       { transform: translateY(-4px); }
            }
          `}</style>
        </defs>

        {/* Lines: APIs → center */}
        {apis.map((api) => (
          <line
            key={api.id}
            className={`line-${api.id}`}
            x1={lx + 28} y1={api.y}
            x2={cx - 24}  y2={cy}
            stroke="url(#grad-left)"
            strokeWidth="1.5"
          />
        ))}

        {/* Lines: center → clients */}
        {clients.map((client) => (
          <line
            key={client.id}
            className={`line-${client.id}`}
            x1={cx + 24}  y1={cy}
            x2={rx - 28} y2={client.y}
            stroke="url(#grad-right)"
            strokeWidth="1.5"
          />
        ))}

        <defs>
          <linearGradient id="grad-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="grad-right" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* API nodes (left) */}
        {apis.map((api, i) => (
          <g key={api.id} style={{ animation: `float-node ${2 + i * 0.3}s ease-in-out infinite` }}>
            <circle cx={lx} cy={api.y} r="28" fill="#18181b" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.5" />
            <text x={lx} y={api.y + 5} textAnchor="middle" fontSize="9" fill="#a78bfa" fontFamily="monospace" fontWeight="600">
              {api.label}
            </text>
          </g>
        ))}

        {/* Center node — mcpfy */}
        <circle className="pulse-center" cx={cx} cy={cy} r="22" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="32" fill="none" stroke="#7c3aed" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="4 4" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="8" fill="#c4b5fd" fontFamily="monospace" fontWeight="700">mcp</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill="#e879f9" fontFamily="monospace" fontWeight="700">ify</text>

        {/* Client nodes (right) */}
        {clients.map((client, i) => (
          <g key={client.id} style={{ animation: `float-node ${2.2 + i * 0.25}s ease-in-out infinite` }}>
            <circle cx={rx} cy={client.y} r="28" fill="#18181b" stroke="#db2777" strokeWidth="1" strokeOpacity="0.5" />
            <text x={rx} y={client.y + 5} textAnchor="middle" fontSize="9" fill="#f9a8d4" fontFamily="monospace" fontWeight="600">
              {client.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
