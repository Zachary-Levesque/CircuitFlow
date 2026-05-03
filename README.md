# CircuitFlow

CircuitFlow is a production-quality real-time circuit simulation platform built with React, TypeScript, and Nodal Analysis Engineering. It allows users to design, analyze, and visualize electrical circuits directly in the browser using a SPICE-like domain-specific language (DSL).

## 🚀 Key Features

- **SPICE-like DSL Editor:** Real-time parsing of netlist definitions.
- **Modified Nodal Analysis (MNA) Solver:** Robust matrix-based engine for computing exact node voltages and branch currents.
- **Interactive Visualization:** Dynamic bar charts for node voltages and detailed result tables for currents and power dissipation.
- **Example Library:** Instant loading of classic circuits like bridge networks and multiple source configurations.
- **Validation & Error Handling:** Detailed feedback for malformed netlists, floating nodes, and missing ground references.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Icons:** Lucide React
- **Mathematics:** math.js (for linear algebra and matrix solving)
- **Charts:** Recharts
- **Build Tool:** Vite

## 📐 Architecture

CircuitFlow follows a clean, modular architecture:

```
src/
├── engine/
│   ├── parser/      # Netlist to Circuit Graph conversion
│   ├── solver/      # MNA DC Solver implementation
│   ├── types/       # Shared domain models and interfaces
├── components/      # UI building blocks
├── examples/        # Pre-defined circuit templates
└── App.tsx          # Main application orchestration
```

### Numerical Engine (MNA)
The core simulation engine implements **Modified Nodal Analysis (MNA)**. It constructs a system of linear equations in the form of an MNA matrix:
- **G Matrix:** Conductance contributions from resistors.
- **B/C Matrices:** Connection constraints for independent voltage sources.
- **Z Vector:** Input current and voltage source values.

The system is solved using LU decomposition (`math.lusolve`) to provide high precision results.

## 🏃 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

## 📝 Netlist Syntax

CircuitFlow supports standard SPICE-like syntax:

- **Resistors:** `R[ID] [NodeA] [NodeB] [Value]` (e.g., `R1 1 0 1k`)
- **Voltage Sources:** `V[ID] [NodeA] [NodeB] [Value]` (e.g., `V1 1 0 10`)
- **Current Sources:** `I[ID] [NodeA] [NodeB] [Value]` (e.g., `I1 0 2 5m`)

**Notes:**
- Ground node must always be labeled `0`.
- Supports unit prefixes: `p, n, u, m, k, Meg, G`.

## 🔮 Future Improvements

- **Transient Analysis:** Time-domain simulation using ODE solvers (Euler/Runge-Kutta).
- **AC Analysis:** Frequency sweep with Bode plots.
- **Non-linear Components:** Diodes and Transistors (using Newton-Raphson iteration).
- **Visual Schematic Editor:** Drag-and-drop component placement.
