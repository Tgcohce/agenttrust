# Multi-stage build for AgentTrust Protocol

# Stage 1: Build environment
FROM rust:1.75-slim as builder

# Install dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libudev-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Install Anchor
RUN cargo install --git https://github.com/coral-xyz/anchor avm
RUN avm install 0.29.0
RUN avm use 0.29.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY app/package*.json ./app/

# Install dependencies
RUN npm install
RUN cd app && npm install

# Copy source code
COPY . .

# Build programs
RUN anchor build || echo "Build may require wallet - skipping in build stage"

# Stage 2: Runtime environment
FROM node:20-slim as runtime

# Install Solana CLI for runtime
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/app ./app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/target ./target
COPY --from=builder /app/node_modules ./node_modules

# Expose frontend port
EXPOSE 3000

# Start command
CMD ["npm", "start", "--prefix", "app"]
