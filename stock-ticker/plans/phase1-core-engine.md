# Phase 1: Core Game Engine (MVP)

## Overview
Build the fundamental game logic and data structures that power the Stock Ticker game. This phase focuses on creating a robust, well-tested backend without UI concerns.

## Deliverables
- Functional game engine with all core mechanics
- Comprehensive unit test suite
- Basic Tauri project setup
- Debug/console interface for testing
- Data persistence foundation

## Detailed Tasks

### 1. Project Setup & Structure
- [ ] Initialize Tauri project with Rust backend
- [ ] Set up frontend framework (React/Vue.js)
- [ ] Configure build system and development environment
- [ ] Establish project folder structure
- [ ] Set up Git repository with proper .gitignore

### 2. Core Data Structures (Rust)
- [ ] `Stock` struct with price, name, and history
- [ ] `Player` struct with portfolio and cash
- [ ] `GameState` struct managing overall game state
- [ ] `Transaction` struct for buy/sell records
- [ ] `DiceRoll` struct for storing roll results

### 3. Stock Management System
- [ ] Stock price initialization ($1.00 starting price)
- [ ] Price movement logic (±5¢, ±10¢, ±20¢)
- [ ] Stock split logic (at $2.00 → double shares, reset to $1.00)
- [ ] Stock reset logic (at $0.00 → reset to $1.00)
- [ ] Price history tracking
- [ ] Dividend calculation system

### 4. Dice Rolling System
- [ ] Three-dice rolling mechanism
- [ ] Stock selection die (1-6 mapping to stock types)
- [ ] Action die (up/down/dividend logic)
- [ ] Amount die (5¢/10¢/20¢ values)
- [ ] Random number generation with proper seeding
- [ ] Roll validation and edge case handling

### 5. Portfolio Management
- [ ] Share purchasing system (500/1000/2000/5000 lots)
- [ ] Share selling system
- [ ] Portfolio value calculation
- [ ] Cash management and validation
- [ ] Transaction history tracking
- [ ] Dividend payment processing

### 6. Game State Management
- [ ] Turn-based game flow
- [ ] Game initialization and reset
- [ ] State serialization for save/load
- [ ] Game rules validation
- [ ] Win condition detection (optional for Phase 1)

### 7. Testing Infrastructure
- [ ] Unit tests for all core functions
- [ ] Integration tests for game flows
- [ ] Property-based tests for dice system
- [ ] Mock data generation for testing
- [ ] Test coverage reporting

### 8. Debug Interface
- [ ] Console commands for testing game mechanics
- [ ] Stock price manipulation for testing
- [ ] Player portfolio inspection
- [ ] Game state dumping/loading
- [ ] Performance profiling hooks

### 9. Data Persistence Foundation
- [ ] SQLite database setup
- [ ] Game state schema design
- [ ] Basic save/load functionality
- [ ] Migration system foundation

### 10. Tauri Integration
- [ ] Rust-to-frontend communication setup
- [ ] Command definitions for game actions
- [ ] Event system for real-time updates
- [ ] Error handling and validation
- [ ] Frontend state synchronization

## Technical Specifications

### Stock Types and Mapping
```rust
enum StockType {
    Gold = 1,
    Silver = 2, 
    Bonds = 3,
    Oil = 4,
    Industrials = 5,
    Grain = 6,
}
```

### Dice Action Mapping
- **Die 1 (Stock)**: 1-6 → Stock types
- **Die 2 (Action)**: 1-2 → Down, 3-4 → Up, 5-6 → Dividend  
- **Die 3 (Amount)**: 1-2 → 5¢, 3-4 → 10¢, 5-6 → 20¢

### Core Game Rules Implementation
- Starting cash: $5,000
- Starting stock prices: $1.00
- Share lot sizes: 500, 1,000, 2,000, 5,000
- Dividend rate: TBD (research original game)
- Stock split threshold: $2.00
- Stock reset threshold: $0.00

## Testing Strategy
- **Unit Tests**: Test individual functions and methods
- **Integration Tests**: Test game flow and state transitions  
- **Property Tests**: Verify dice probabilities and edge cases
- **Performance Tests**: Ensure responsive game state updates

## Success Criteria
- [ ] All unit tests pass with >90% coverage
- [ ] Game engine handles complete game simulation
- [ ] Debug interface allows full game testing
- [ ] No memory leaks or performance issues
- [ ] Code follows Rust best practices and is well-documented
- [ ] Basic save/load functionality works

## Estimated Effort: 1-2 weeks

## Dependencies for Next Phase
- Working game engine with all mechanics
- Test suite validating game behavior
- Tauri communication layer established
- Data structures ready for UI integration