# CircuitFlow

CircuitFlow is a browser-based circuit simulation project built to make electrical analysis faster to learn, easier to iterate on, and more visual to explore. It combines a SPICE-like netlist workflow with an interactive schematic editor, then runs DC, AC, and transient analysis directly in the browser.

## Goals

This project was built around a few clear goals:

- Make circuit analysis more approachable without reducing it to a toy.
- Let users move quickly between code-style circuit definitions and visual editing.
- Show simulation results in a way that is easy to inspect and modify.
- Provide useful built-in starter circuits so users can begin from working examples instead of a blank screen.
- Keep the solver and UI simple enough to study, extend, and improve.

## Why It Is Useful

CircuitFlow is useful for students, hobbyists, and engineers who want a lightweight way to experiment with circuit behavior without leaving the browser.

It helps with:

- Learning how DC, AC, and transient analysis differ.
- Prototyping simple circuits before moving into heavier tools.
- Visualizing component voltage and current behavior over time or frequency.
- Editing a circuit from either a schematic-style interface or a netlist directly.
- Starting from built-in examples and modifying them instead of building everything from scratch.

## What The App Does

CircuitFlow currently supports:

- `DC analysis` for steady-state behavior.
- `AC analysis` for phasor-based frequency-domain simulation.
- `Transient analysis` for time-domain behavior using time stepping.
- `Code mode` for direct netlist editing.
- `Visual mode` for placing and editing components on a schematic grid.
- `Built-in starter circuits` in each analysis mode.
- `Component plotting` for voltage and current traces in AC and transient views.
- `Component editing` including value changes and polarity flipping for two-terminal parts.

Supported component types:

- `R` resistor
- `L` inductor
- `C` capacitor
- `D` diode
- `Q` transistor
- `V` voltage source
- `I` current source
- `W` wire

## How We Built It

CircuitFlow is a TypeScript + React application with a small simulation engine organized inside the repo.

### Frontend

- `React` drives the UI and analysis workflow.
- `TypeScript` keeps the domain model and solver interfaces explicit.
- `Recharts` renders AC and transient plots.
- `Lucide React` provides interface icons.
- `Vite` handles development and production builds.

### Simulation Engine

The core engine lives in `src/engine/` and is split into parser, serializer, solver, and shared types.

- `Parser`: converts a SPICE-like netlist into a circuit object.
- `Serializer`: converts the edited circuit back into netlist form.
- `Solver`: runs the electrical analysis.
- `Types`: defines the shared circuit/result models used by the app.

### Analysis Approach

CircuitFlow uses matrix-based circuit solving with `math.js`.

- `DC analysis` is based on modified nodal analysis with iterative handling for nonlinear parts.
- `AC analysis` uses phasor-domain admittances for reactive components and solves complex-valued systems.
- `Transient analysis` uses time stepping with companion models for reactive elements.

This structure keeps the project readable: the UI manages interaction, while the engine handles circuit math independently.

## Project Structure

```text
src/
├── components/      # UI pieces such as charts, landing page, plot selector, schematic editor
├── engine/
│   ├── parser/      # Netlist parsing and serialization
│   ├── solver/      # DC, AC, and transient solving logic
│   └── types/       # Shared types
├── examples/        # Built-in starter circuits for each analysis mode
├── App.tsx          # Main application flow
└── main.tsx         # App bootstrap
```

## How To Use It

### 1. Install dependencies

```bash
npm install
```

### 2. Run the app locally

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Use the app

1. Open CircuitFlow in the browser.
2. Choose `DC`, `AC`, or `Transient`.
3. Start from one of the built-in circuits or create your own.
4. Use `Visual` mode to place and edit components, or `Code` mode to edit the netlist directly.
5. Click `Simulate` to run the analysis.
6. Use the table view to inspect component voltage drops and currents.
7. In `AC` and `Transient`, switch to chart view and select component traces to plot.

### AC workflow

- `Freq` controls the single-frequency AC solve shown in the table.
- `Start` and `End` control the frequency sweep used for the chart.

### Transient workflow

- `Stop` sets the maximum simulation time.
- `Step` sets the simulation time increment used for the transient plot.

## Netlist Format

CircuitFlow uses a simple SPICE-like syntax:

```text
V1 0 10_6 10
R1 10_6 14_6 1k
C1 14_6 14_10 1u
W1 14_10 0
```

General patterns:

- `R[id] nodeA nodeB value`
- `L[id] nodeA nodeB value`
- `C[id] nodeA nodeB value`
- `D[id] nodeA nodeB value`
- `V[id] nodeA nodeB value phase`
- `I[id] nodeA nodeB value phase`
- `Q[id] nodeBase nodeEmitter nodeCollector model beta`
- `W[id] nodeA nodeB`

Notes:

- Ground must be node `0`.
- Unit suffixes such as `p`, `n`, `u`, `m`, `k`, `meg`, and `g` are supported.
- Visual component placement metadata is stored as `# pos ...` lines in the example netlists.

## Testing

Current validation is mainly through build and manual interaction:

```bash
npm run build
```

Recommended manual checks:

- Load each built-in example in each mode.
- Verify DC tables populate correctly.
- Verify AC chart traces change when sweep bounds change.
- Verify transient plots respond to `Stop` and `Step`.
- Verify flipping a component changes its orientation and simulation direction.

## Why This Project Matters

CircuitFlow sits in a useful middle ground:

- more interactive than a static circuit homework solver,
- easier to inspect than a black-box desktop tool,
- and simpler to extend than a large simulation platform.

That makes it a strong foundation for learning, portfolio work, and future engineering features.

## Possible Next Steps

Natural extensions for the project include:

- richer device models,
- better automated testing,
- more advanced plotting controls,
- import/export improvements,
- and larger schematic editing capabilities.
