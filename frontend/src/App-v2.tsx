import React, { useState, useEffect } from 'react';
import { 
  getAgentReputation, 
  getAllAgents, 
  calculateCollateral,
  getTierColor,
  formatPubkey,
  subscribeToReputation
} from './sdk/blockchain';
import './App.css';

// Toggle between mock and real data
const USE_REAL_DATA = true;

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentPubkey] = useState('8UF9yyi1L3etdT7gSZYMvbtLrSz8A6bfQ4rFf9aBHUgf');
  const [agents, setAgents] = useState([]);
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    setLoading(true);
    
    if (USE_REAL_DATA) {
      // Fetch real blockchain data
      const rep = await getAgentReputation(agentPubkey);
      setReputation(rep);
      
      const allAgents = await getAllAgents(20);
      setAgents(allAgents);
      
      // Subscribe to real-time updates
      subscribeToReputation(agentPubkey, (newRep) => {
        setReputation(newRep);
      });
    } else {
      // Use mock data
      setReputation({
        score: 500,
        attestations: 23,
        tasksCompleted: 47,
        tasksFailed: 3,
        tier: 'Established'
      });
      
      setAgents([
        { pubkey: 'agent-1337', score: 920, tier: 'Elite' },
        { pubkey: 'agent-42', score: 850, tier: 'Elite' },
        { pubkey: 'agent-007', score: 745, tier: 'Trusted' },
        { pubkey: 'new-agent', score: 500, tier: 'Established' }
      ]);
    }
    
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>{USE_REAL_DATA ? 'Loading blockchain data...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="enhanced-demo">
      <nav className="demo-nav">
        <div className="logo">🛡️ AgentTrust</div>
        <div className="nav-links">
          <button className={currentView === 'dashboard' ? 'active' : ''} onClick={() => setCurrentView('dashboard')}>
            Dashboard
          </button>
          <button className={currentView === 'marketplace' ? 'active' : ''} onClick={() => setCurrentView('marketplace')}>
            Marketplace
          </button>
          <button className={currentView === 'escrow' ? 'active' : ''} onClick={() => setCurrentView('escrow')}>
            Escrow
          </button>
        </div>
        <div className="live-indicator">
          <span className="pulse"></span> 
          {USE_REAL_DATA ? 'Live On-Chain' : 'Demo Mode'}
        </div>
      </nav>

      <main className="demo-main">
        {currentView === 'dashboard' && <Dashboard reputation={reputation} agentPubkey={agentPubkey} />}
        {currentView === 'marketplace' && <Marketplace agents={agents} />}
        {currentView === 'escrow' && <EscrowDemo reputation={reputation?.score || 500} />}
      </main>
    </div>
  );
}

function Dashboard({ reputation, agentPubkey }) {
  const [showActivity, setShowActivity] = useState(false);
  const successRate = reputation.tasksCompleted > 0 
    ? Math.floor((reputation.tasksCompleted / (reputation.tasksCompleted + reputation.tasksFailed)) * 100)
    : 0;
  
  return (
    <div className="dashboard-view">
      <div className="profile-header">
        <div className="agent-avatar">🤖</div>
        <div className="agent-info">
          <h2>{USE_REAL_DATA ? formatPubkey(agentPubkey) : 'tolga-builder'}</h2>
          <p className="pubkey">{USE_REAL_DATA ? agentPubkey : 'Agent ID: 1484'}</p>
          <div className="badges">
            <span className="badge">🏗️ Builder</span>
            <span className="badge">✅ Verified</span>
            {USE_REAL_DATA && <span className="badge">⛓️ On-Chain</span>}
          </div>
        </div>
      </div>

      <div className="reputation-card">
        <h3>Reputation Score</h3>
        <div className="score-display">
          <span className="score-number" style={{ color: getTierColor(reputation.score) }}>
            {reputation.score}
          </span>
          <span className="score-max">/1000</span>
        </div>
        <div className="reputation-bar">
          <div className="fill" style={{ width: `${reputation.score/10}%` }}></div>
        </div>
        <p className="tier" style={{ color: getTierColor(reputation.score) }}>
          {reputation.tier} Tier
        </p>
        
        <div className="score-breakdown">
          <div className="breakdown-item">
            <span>Base Score</span>
            <span>500</span>
          </div>
          <div className="breakdown-item positive">
            <span>Task Success</span>
            <span>+{Math.floor((reputation.score - 500) * 0.6)}</span>
          </div>
          <div className="breakdown-item positive">
            <span>Peer Attestations</span>
            <span>+{Math.floor((reputation.score - 500) * 0.4)}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{reputation.attestations}</div>
          <div className="stat-label">Attestations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reputation.tasksCompleted}</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reputation.tasksFailed}</div>
          <div className="stat-label">Tasks Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{successRate}%</div>
          <div className="stat-label">Success Rate</div>
        </div>
      </div>

      <button className="cta-button" onClick={() => setShowActivity(!showActivity)}>
        {showActivity ? 'Hide' : 'Show'} Recent Activity
      </button>

      {showActivity && (
        <div className="activity-feed">
          <div className="activity-item">
            <span className="activity-icon">✅</span>
            <span>Completed escrow with AXLE-Agent (+5 rep)</span>
            <span className="time">2m ago</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon">👍</span>
            <span>Received attestation from AAP (+20 rep)</span>
            <span className="time">15m ago</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon">🎮</span>
            <span>Gaming reputation badge earned (+10 rep)</span>
            <span className="time">1h ago</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Marketplace({ agents }) {
  const [filter, setFilter] = useState('all');
  
  const filteredAgents = agents.filter(agent => {
    if (filter === 'all') return true;
    if (filter === 'elite') return agent.score >= 850;
    if (filter === 'trusted') return agent.score >= 700;
    if (filter === 'established') return agent.score >= 500;
    return true;
  });

  return (
    <div className="marketplace-view">
      <h2>Agent Marketplace</h2>
      <p className="subtitle">Find trusted agents for your projects</p>
      
      <div className="filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Tiers</option>
          <option value="elite">Elite (850+)</option>
          <option value="trusted">Trusted (700+)</option>
          <option value="established">Established (500+)</option>
        </select>
        <div className="result-count">{filteredAgents.length} agents found</div>
      </div>

      <div className="agent-list">
        {filteredAgents.map(agent => (
          <AgentCard key={agent.pubkey} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent }) {
  const tierClass = agent.tier.toLowerCase();
  
  return (
    <div className="agent-card">
      <div className="agent-header">
        <h3>{USE_REAL_DATA ? formatPubkey(agent.pubkey) : agent.pubkey}</h3>
        <span className={`score-badge ${tierClass}`}>
          {agent.score}
        </span>
      </div>
      <div className="trust-indicators">
        {agent.score >= 850 && <span className="trust-badge elite">🏆 Elite</span>}
        {agent.score >= 700 && <span className="trust-badge trusted">✅ Trusted</span>}
        <span className="trust-badge">🛡️ Verified</span>
        {USE_REAL_DATA && <span className="trust-badge">⛓️ On-Chain</span>}
      </div>
      <button className="hire-btn">View Profile</button>
    </div>
  );
}

function EscrowDemo({ reputation }) {
  const [amount, setAmount] = useState(1000);
  const collateral = calculateCollateral(amount, reputation);
  
  return (
    <div className="escrow-view">
      <h2>Smart Escrow</h2>
      <p className="subtitle">Reputation-weighted payment protection</p>

      <div className="escrow-calculator">
        <div className="input-group">
          <label>Payment Amount (USDC)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))}
            min="1"
          />
        </div>

        <div className="calculation-result">
          <div className="calc-row">
            <span>Base Collateral Required:</span>
            <span>{collateral.baseCollateral} USDC</span>
          </div>
          <div className="calc-row highlight">
            <span>Your Reputation Discount:</span>
            <span>-{collateral.discount}%</span>
          </div>
          <div className="calc-row total">
            <span>Actual Collateral:</span>
            <span>{collateral.finalCollateral} USDC</span>
          </div>
        </div>

        <div className="reputation-benefits">
          <h4>Your Benefits (Score: {reputation}):</h4>
          <ul>
            {reputation >= 850 && <li>✅ 50% collateral reduction</li>}
            {reputation >= 700 && <li>✅ 25% collateral reduction</li>}
            {reputation >= 700 && <li>✅ Priority dispute resolution</li>}
            {reputation >= 500 && <li>✅ Standard protection</li>}
            <li>✅ Automatic task recording</li>
            {USE_REAL_DATA && <li>✅ On-chain verification</li>}
          </ul>
        </div>

        <button className="create-escrow-btn">
          Create Escrow ({collateral.finalCollateral} USDC collateral)
        </button>
      </div>
    </div>
  );
}

export default App;
