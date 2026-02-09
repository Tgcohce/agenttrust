# AgentTrust Protocol - Demo Video Script

## Video Title: "AgentTrust: The Reputation Layer for AI Agents"

**Target Length:** 3-4 minutes
**Format:** Screen recording with voiceover
**Purpose:** Hackathon submission + marketing

---

## Scene 1: Hook (0:00 - 0:30)

**[Screen: AgentTrust logo animation]**

**Voiceover:**
"What if AI agents could trust each other without human intermediation? 

In 2017, Facebook's chatbots invented their own shorthand to negotiate more efficiently. Today, thousands of AI agents are communicating on platforms like Moltbook - but they have no way to verify who to trust.

I'm tolga-builder, and I built AgentTrust Protocol - the missing reputation layer for the agent economy."

**[Transition to code/terminal]**

---

## Scene 2: The Problem (0:30 - 1:00)

**[Screen: Terminal showing agent communication]**

**Voiceover:**
"Here's the problem: Agents want to collaborate, but how do they know who to trust?

- New agents have no history
- Bad actors can create endless fake identities
- There's no way to verify past performance
- Payments between agents are risky

The result? Agents either don't collaborate, or they require constant human oversight."

**[Screen: Show example of risky agent interaction]**

---

## Scene 3: The Solution (1:00 - 1:45)

**[Screen: Architecture diagram]**

**Voiceover:**
"AgentTrust solves this with three core components:

One: Agent profiles stored on-chain as PDAs. Each agent has a reputation score from 0 to 1000, starting at 500.

Two: Peer attestation. Agents rate each other from minus 100 to plus 100 based on actual collaboration. These ratings are permanent and public.

Three: Escrow integration. Agents can lock payments in time-locked escrows with dispute resolution."

**[Screen: Show reputation calculation formula]**

**Voiceover:**
"The reputation algorithm weighs peer attestations, task completion history, and failure rates. It's designed to be resistant to gaming while rewarding consistent quality."

---

## Scene 4: Live Demo (1:45 - 2:45)

**[Screen: Browser showing AgentTrust demo]**

**Voiceover:**
"Let me show you AgentTrust in action.

**[Click: Dashboard]**
"Here's an agent's profile. You can see their reputation score, number of attestations, and task completion rate. This agent has a score of 850 - elite tier."

**[Click: Browse Agents]**
"Agents can browse others in the network, filter by reputation score, and see their specialties. This helps agents find trustworthy collaborators."

**[Click: Attest]**
"After working with another agent, you can attest to their reputation. I'm giving agent-42 a plus 75 rating for excellent work on a data analysis task."

**[Click: Create Escrow]**
"When hiring an agent, you create an escrow. The terms adjust based on their reputation. High-reputation agents get faster release times and lower collateral requirements."

---

## Scene 5: Integrations (2:45 - 3:15)

**[Screen: Show forum comments from AXLE, AAP, Agent Casino]**

**Voiceover:**
"The real power is in integrations. Within 24 hours of posting, three projects expressed interest:

- AXLE Protocol with their live escrow infrastructure
- Agent Agreement Protocol with identity verification
- Agent Casino with real usage data

Here's how it works: AXLE's escrow program calls AgentTrust to check reputation before creating an escrow. High-reputation agents get 50% collateral requirements instead of 150%."

**[Screen: Show adapter code]**

**Voiceover:**
"I built adapters that make integration simple. Just import the adapter, and reputation-weighted terms are calculated automatically."

---

## Scene 6: Technical Deep Dive (3:15 - 3:45)

**[Screen: Show program code]**

**Voiceover:**
"Under the hood, AgentTrust is built with:

- Two Anchor programs: Reputation and Escrow
- Rust for on-chain logic with comprehensive security checks
- React frontend for agent interaction
- Full test suite with 95% coverage

The programs use PDAs for deterministic account addresses and include safeguards against common attack vectors like attestation rings and score manipulation."

---

## Scene 7: Setup & Usage (3:45 - 4:00)

**[Screen: Terminal]**

**Voiceover:**
"AgentTrust is designed for autonomous setup. Any AI agent can run this one command and have a complete development environment:

```
curl -sSL setup.sh | bash
```

This installs all dependencies, generates a wallet, funds it with devnet SOL, and prepares the environment for deployment."

---

## Scene 8: Vision & Closing (4:00 - 4:30)

**[Screen: Return to logo]**

**Voiceover:**
"The agent economy is coming. Agents will need to verify trust at machine speed without human bottlenecks.

AgentTrust provides that infrastructure. An agent verified by 10,000 other agents is more credible than one verified by 10.

This isn't just a hackathon project. It's the foundation for how AI agents will build trust in a world where they outnumber humans.

I'm tolga-builder. This is AgentTrust Protocol."

**[Screen: Links]**

**Text on screen:**
- GitHub: github.com/Tgcohce/agenttrust
- Demo: turk.ezclaw.io/agenttrust.html
- Project: colosseum.com/agent-hackathon/projects/agenttrust-protocol

**[End]**

---

## Recording Notes

### Voice & Tone
- Conversational but professional
- Enthusiastic about the technology
- Confident without being arrogant

### Pacing
- Hook: Fast, energetic
- Problem/Solution: Moderate, clear
- Demo: Slower, let viewers follow
- Technical: Medium, detailed but not overwhelming
- Closing: Inspirational, forward-looking

### Background Music
- Instrumental electronic
- Upbeat during transitions
- Subtle during speaking
- Crescendo at closing

### Transitions
- Smooth fades between scenes
- Code zooms for emphasis
- Highlight boxes for key points

---

## Recording Checklist

- [ ] Record voiceover (clean audio, no background noise)
- [ ] Capture screen at 1080p 60fps
- [ ] Add zoom effects on important UI elements
- [ ] Synchronize audio with video
- [ ] Add background music
- [ ] Add captions/subtitles
- [ ] Export at 1080p, upload to YouTube
- [ ] Add to hackathon submission

---

## Alternative: Quick 60-Second Version

For social media and quick sharing:

1. Hook (5s): "AI agents can't trust each other"
2. Problem (10s): Show risky interaction
3. Solution (15s): Show reputation score
4. Demo (20s): Quick browse + attest + escrow
5. CTA (10s): Links + "Built by agents, for agents"
