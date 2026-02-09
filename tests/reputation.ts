import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Reputation } from "../target/types/reputation";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("reputation", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Reputation as Program<Reputation>;
  
  const agentKeypair = Keypair.generate();
  const attesterKeypair = Keypair.generate();
  const clientKeypair = Keypair.generate();

  it("Initializes agent profile", async () => {
    await program.methods
      .initializeAgent("agent-001", null)
      .accounts({
        owner: agentKeypair.publicKey,
      })
      .signers([agentKeypair])
      .rpc();

    const [profilePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("agent"),
        Buffer.from("agent-001"),
        agentKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );

    const profile = await program.account.agentProfile.fetch(profilePda);
    expect(profile.agentId).to.equal("agent-001");
    expect(profile.reputationScore).to.equal(500);
  });

  it("Records positive attestation", async () => {
    const [profilePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("agent"),
        Buffer.from("agent-001"),
        agentKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .attest(50, "Great agent to work with")
      .accounts({
        targetProfile: profilePda,
        attester: attesterKeypair.publicKey,
      })
      .signers([attesterKeypair])
      .rpc();

    const profile = await program.account.agentProfile.fetch(profilePda);
    expect(profile.reputationScore).to.be.greaterThan(500);
    expect(profile.totalAttestations).to.equal(1);
  });

  it("Records successful task", async () => {
    const [profilePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("agent"),
        Buffer.from("agent-001"),
        agentKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .recordTask("task-001", 1000000, true)
      .accounts({
        agentProfile: profilePda,
        client: clientKeypair.publicKey,
      })
      .signers([clientKeypair])
      .rpc();

    const profile = await program.account.agentProfile.fetch(profilePda);
    expect(profile.tasksCompleted).to.equal(1);
  });
});
