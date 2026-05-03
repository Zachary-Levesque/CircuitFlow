# CircuitFlow – Full Implementation Instructions

You are tasked with building a production-quality circuit simulation platform called CircuitFlow.

This is not a basic project. It must be built to demonstrate strong engineering, scalability, and real-time capabilities.

---

# 🎯 GOAL

Build a full-stack application that allows users to:
1. Create electrical circuits (UI + code)
2. Simulate them in real time
3. Compute voltages, currents, and power
4. Visualize results dynamically

---

# 🧱 PROJECT STRUCTURE

CircuitFlow/
├── frontend/
├── backend/ (optional)
├── engine/
├── shared/
├── docs/

---

# ⚙️ CORE COMPONENTS

## 1. Circuit Representation

Define:
- Nodes
- Components:
  - Resistor
  - Capacitor
  - Inductor
  - Voltage source
  - Current source

Each component must include:
- ID
- Type
- Value
- Connected nodes

---

## 2. Parser (SPICE-like DSL)

Input format:
R1 1 2 1000
V1 1 0 DC 10
C1 2 0 1uF


Tasks:
- Parse text input
- Convert to circuit graph
- Validate syntax

---

## 3. Nodal Analysis Engine

Implement:
- KCL equations
- Conductance matrix (G)
- Current vector (I)

Solve:
G · V = I

Use:
- Gaussian elimination OR
- Linear algebra library

---

## 4. Simulation Modes

### DC Analysis
- Solve static voltages and currents

### AC Analysis
- Convert to phasors
- Perform frequency sweep
- Output gain and phase

### Transient Analysis
- Solve ODEs using:
  - Euler OR
  - Runge-Kutta

---

## 5. Real-Time Engine

Requirements:
- Recompute when inputs change
- Efficient updates
- Avoid full recomputation when possible

---

## 6. Frontend (React + TypeScript)

Build:
- Canvas-based circuit editor
- Drag-and-drop components
- Wire connections

UI Features:
- Parameter editing panel
- Simulation controls
- Graph display

---

## 7. Visualization

Implement:
- Voltage vs time
- Current vs time
- Frequency response

Use:
- Chart.js OR Plotly

---

## 8. Performance Requirements

- Handle circuits with 50+ components
- Use efficient matrix operations
- Consider sparse matrices

---

## 9. Advanced Features (IMPORTANT)

At least ONE must be implemented:

Option A: Real-time simulation updates  
Option B: SPICE DSL editor with live parsing  
Option C: Frequency sweep with Bode plots  

---

## 10. Code Quality

Must include:
- Modular architecture
- Clear separation of concerns
- Typed interfaces (TypeScript)
- Comments explaining math logic

---

## 11. Deliverables

- Fully working frontend
- Simulation engine
- Example circuits
- Clean UI
- README completed

---

## 12. Stretch Goals (Optional)

- Nonlinear components (diodes)
- Circuit optimization
- Save/share circuits
- Web deployment

---

# 🚨 IMPORTANT

This project must:
- Feel like a real product
- Be visually clean
- Be technically deep
- Be resume-ready

Avoid:
- Over-simplified implementations
- Hardcoded logic
- Poor UI

---

# ✅ FINAL EXPECTATION

The final result should look like:
- A lightweight version of a professional circuit simulator
- A project that demonstrates strong engineering skills
- Something impressive enough for big tech recruiting

Build with clarity, performance, and scalability in mind.
