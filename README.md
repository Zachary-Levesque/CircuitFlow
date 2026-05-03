# CircuitFlow

CircuitFlow is a real-time circuit simulation platform for designing and analyzing electrical circuits. It uses matrix-based nodal analysis to compute voltages, currents, and power, with interactive visualization, dynamic updates, and support for DC, AC, and transient simulations.

---

## 🚀 Overview

CircuitFlow is a modern, lightweight alternative to traditional circuit simulators. It enables users to build circuits visually or programmatically and simulate their behavior in real time.

This project demonstrates:
- Strong systems design
- Numerical methods (linear algebra, ODEs)
- Full-stack engineering
- Real-time data processing and visualization

---

## ⚡ Features

### 🧠 Simulation Engine
- Nodal Analysis (KCL-based)
- Matrix formulation: G · V = I
- Linear system solving
- Supports:
  - DC Analysis
  - AC Analysis (frequency sweep)
  - Transient Analysis (time-domain simulation)

### 🎨 Interactive Circuit Builder
- Drag-and-drop components
- Wire connections between nodes
- Editable parameters (R, C, L, sources)

### 📊 Visualization
- Voltage vs time graphs
- Current vs time graphs
- Frequency response (Bode plots)
- Real-time updates as parameters change

### 🧾 SPICE-like Input (DSL)
Define circuits programmatically:
V1 1 0 DC 10
R1 1 2 1000
C1 2 0 1uF


### 💾 Save & Load
- Export/import circuits (JSON)
- Shareable configurations

---

## 🧱 Tech Stack

### Frontend
- React + TypeScript
- Canvas / SVG rendering

### Backend (optional)
- Node.js or Python (FastAPI)

### Core Engine
- TypeScript or Python
- Linear algebra (math.js / numpy)

---

## 📐 Architecture
Frontend (UI)
↓
Circuit Parser (DSL / UI input)
↓
Matrix Builder (Nodal Analysis)
↓
Solver Engine (Linear Algebra)
↓
Simulation Engine (DC / AC / Transient)
↓
Visualization Layer (Graphs)

---

## 🧠 Core Concepts

- Kirchhoff’s Current Law (KCL)
- Nodal Analysis
- Matrix systems
- Frequency domain analysis
- Differential equations (transient response)

---

## 🔥 Future Improvements

- Nonlinear components (diodes, transistors)
- Symbolic circuit solving
- Optimization mode (auto-tune components)
- Large-scale circuit performance (sparse matrices)
- Real-time streaming simulations

---

## 🎯 Why This Project Matters

CircuitFlow is designed to showcase:
- Advanced problem solving
- Engineering rigor
- Real-world system design
- Clean UI + technical depth

This is not just a project — it is a product-level system.

---

## 📸 Demo (Coming Soon)
- UI screenshots
- Simulation examples
- Interactive demos

---

## 📜 License
MIT License
