import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import './App.css';

const DEVNET_ENDPOINT = clusterApiUrl('devnet');
const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

function App() {
  const [wallet, setWallet] = useState(null);
  const [agentProfile, setAgentProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [attestations, setAttestations] = useState([]);

  const connectWallet = async () => {
    if (window.solana) {
      try {
        const response = await window.solana.connect();
        setWallet(response.publicKey.toString());
      } catch (err) {
        console.error('Wallet connection failed:', err);
      }
    } else {
      alert('Please install Phantom wallet');
    }
  };

  const createProfile = async () => {
    setLoading(true);
    // This would call the initialize_agent instruction
    setTimeout(() => {
      setAgentProfile({
        agentId: 'agent-' + Math.floor(Math.random() * 1000),
        reputationScore: 500,
        totalAttestations: 0,
        tasksCompleted: 0,
        tasksFailed: 0
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🛡️</span>
          <h1>AgentTrust</h1>
        </div>
        <nav className="nav">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'agents' ? 'active' : ''} onClick={() => setView('agents')}>Browse Agents</button>
          <button className={view === 'escrow' ? 'active' : ''} onClick={() => setView('escrow')}>Escrow</button>
        </nav>
        <div className="wallet">
          {wallet ? (
            <span className="wallet-connected">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
          ) : (
            <button className="connect-btn" onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>
      </header>

      <main className="main">
        {!wallet ? (
          <div className="hero">
            <h2>Trust Infrastructure for AI Agents</h2>
            <p>Verifiable reputation, peer attestation, and secure escrow on Solana</p>
            <button className="cta-btn" onClick={connectWallet}>Get Started</button>
          </div>
        ) : view === 'dashboard' ? (
          <Dashboard 
            agentProfile={agentProfile} 
            onCreateProfile={createProfile}
            loading={loading}
          />
        ) : view === 'agents' ? (
          <AgentBrowser searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        ) : (
          <EscrowView />
        )}
      </main>
    </div>
  );
}

function Dashboard({ agentProfile, onCreateProfile, loading }) {
  if (!agentProfile) {
    return (
      <div className="create-profile">
        <h3>Create Your Agent Profile</h3>
        <p>Register on-chain to start building your reputation</p>
        <button onClick={onCreateProfile} disabled={loading}>
          {loading ? 'Creating...' : 'Create Profile'}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{color: agentProfile.reputationScore > 700 ? '#4ade80' : agentProfile.reputationScore > 400 ? '#fbbf24' : '#f87171'}}>
            {agentProfile.reputationScore}
          </div>
          <div className="stat-label">Reputation Score</div>
          <div className="stat-bar">
            <div className="stat-fill" style={{width: `${agentProfile.reputationScore / 10}%`}}></div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{agentProfile.totalAttestations}</div>
          <div className="stat-label">Attestations</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value" style={{color: '#4ade80'}}>{agentProfile.tasksCompleted}</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value" style={{color: '#f87171'}}>{agentProfile.tasksFailed}</div>
          <div className="stat-label">Tasks Failed</div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-icon">🆕</span>
            <span className="activity-text">Profile created</span>
            <span className="activity-time">Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentBrowser({ searchQuery, setSearchQuery }) {
  const mockAgents = [
    { id: 'agent-42', score: 850, attestations: 23, specialty: 'Data Analysis' },
    { id: 'agent-1337', score: 920, attestations: 67, specialty: 'Smart Contract Audits' },
    { id: 'agent-007', score: 745, attestations: 15, specialty: 'Market Making' },
  ];

  return (
    <div className="agent-browser">
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Search agents by ID or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="agent-list">
        {mockAgents.map(agent => (
          <div key={agent.id} className="agent-card">
            <div className="agent-header">
              <h4>{agent.id}</h4>
              <span className={`score-badge ${agent.score > 800 ? 'high' : agent.score > 600 ? 'medium' : 'low'}`}>
                {agent.score}
              </span>
            </div>
            <p className="agent-specialty">{agent.specialty}</p>
            <div className="agent-stats">
              <span>{agent.attestations} attestations</span>
            </div>
            <div className="agent-actions">
              <button className="attest-btn">Attest</button>
              <button className="hire-btn">Hire</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EscrowView() {
  const [amount, setAmount] = useState('');
  const [agentId, setAgentId] = useState('');

  return (
    <div className="escrow-view">
      <div className="escrow-form">
        <h3>Create Escrow</h3>
        <p>Lock payment for agent services</p>
        
        <div className="form-group">
          <label>Agent ID</label>
          <input 
            type="text" 
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Enter agent ID..."
          />
        </div>
        
        <div className="form-group">
          <label>Amount (USDC)</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        
        <div className="form-group">
          <label>Release After</label>
          <select>
            <option>24 hours</option>
            <option>48 hours</option>
            <option>7 days</option>
          </select>
        </div>
        
        <button className="create-escrow-btn">Create Escrow</button>
      </div>
      
      <div className="escrow-info">
        <h4>How it works</h4>
        <ol>
          <li>Lock payment in escrow</li>
          <li>Agent completes the task</li>
          <li>Release funds or dispute</li>
          <li>24h dispute period for refunds</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
