# PRD — "GigaOps" : Autonomous Manufacturing Systems Demo Suite + Website
**For:** Group G9, 22RI751 — Autonomous Manufacturing Systems (Tesla Gigafactory case study)
**Audience:** Antigravity (build this end-to-end, do not ask for scope approval mid-build — flag blockers only)
**Deadline driver:** must be demoable live in a 2-minute slide slot, plus a hosted link for evaluators to click after the presentation.

---

## 1. What this is

One unified, deployable website — not three disconnected scripts — that presents
three interactive demos mirroring Tesla Gigafactory's autonomous-manufacturing
stack, so the project can be shown live in-browser instead of as static
screenshots:

1. **GigaTwin** — a discrete-event digital twin of a battery production line
   (throughput, OEE, bottleneck visualization, adjustable via sliders).
2. **VisionQC** — an AI defect-detection demo (image upload or webcam → trained
   model → pass/reject verdict with confidence), mirroring Tesla's camera-based
   quality control.
3. **AGV Pathfinder** — an interactive factory-floor grid where the user places
   obstacles/stations and watches an autonomous vehicle compute and animate its
   route (A* / pathfinding), mirroring intralogistics automation.

All three live under one site with a landing page, nav, and an About/Report page
tying each demo back to a named manufacturing concept (CPS/IIoT, digital twin,
AI vision QC, AGV/AMR, predictive maintenance) — this mapping is a grading
criterion, so it must be visible in the UI, not just in the report.

## 2. Non-negotiable constraints

- Must run on **free-tier hosting only** (no paid infra budget). Target:
  frontend on Vercel/Netlify free tier, backend on Render/Railway free tier or
  a single Fly.io free instance. If a model is too large for free-tier RAM,
  use a smaller/distilled model rather than upgrading the plan.
- Must have a **working offline fallback**: if live hosting is down or slow
  during the presentation, each demo page must also run fully from
  `localhost` with one command (`npm run dev` / `uvicorn ...`). Record a 40–60s
  screen-capture backup video of each demo working, saved in
  `/demo-videos/`, embedded as a fallback `<video>` on each demo page behind a
  "Live demo unavailable? Watch recording" toggle.
- Must be **buildable by 4 people with mixed skill levels in about 10 days**.
  Favor the simplest architecture that satisfies the requirements below over
  a more "impressive" but fragile one. Do not add infrastructure (databases,
  auth, microservices) that isn't required by a feature below.
- Every demo must expose **real, inspectable output** (actual simulated
  numbers, actual model confidence scores, actual computed path) — never a
  canned/hardcoded animation pretending to be live computation. If a metric is
  simulated rather than measured from real hardware, label it "simulated" in
  the UI; don't imply it's real sensor data.

## 3. Architecture

```
/gigaops
  /frontend          # React + Vite (or Next.js) — single site, 5 routes
    /src/pages
      Home.tsx         # landing: hero, 3 demo cards, concept-mapping table
      GigaTwin.tsx      # embeds simulation dashboard (iframe to Streamlit OR native React charts via REST/WebSocket)
      VisionQC.tsx      # upload/webcam -> POST /api/vision/predict -> show verdict
      AGVPathfinder.tsx # canvas grid, fully client-side (no backend call needed)
      About.tsx         # module-concept mapping, team, report/GitHub links, references
  /backend            # FastAPI — one service, three routers
    /app
      main.py
      routers/
        simulation.py   # GigaTwin: SimPy model, REST + WebSocket endpoints
        vision.py        # VisionQC: model load + inference endpoint
      models/
        simpy_line.py    # the digital-twin simulation logic
        defect_model.pt  # trained weights (small, <50MB — see §5.2)
      requirements.txt
  /ml-training        # one-off scripts/notebooks, NOT part of the deployed app
    train_defect_model.ipynb
    dataset_notes.md
  /demo-videos        # fallback recordings, one per demo
  README.md           # setup, run, deploy, architecture diagram
  PRD.md              # this file
```

Decision rule used above: AGV Pathfinder needs no model and no persistent
state, so it runs **entirely client-side in the browser** (TypeScript/Canvas)
— no backend call, nothing to deploy, nothing to go down during the demo.
GigaTwin and VisionQC need server-side computation, so they go through one
shared FastAPI backend rather than three separate services.

## 4. Feature requirements

### 4.1 GigaTwin (digital twin dashboard)
- **Model:** discrete-event simulation (SimPy) of a battery line with stages:
  electrode coating → winding/stacking → assembly → AI-vision QC gate →
  formation → pack. Each stage has a configurable cycle time and a defect
  probability at the QC gate.
- **Inputs (user-adjustable, via sliders on the page):** cycle time per
  stage, defect rate %, number of parallel stations per stage, shift length.
- **Outputs (computed live from the simulation, not hardcoded):** throughput
  (units/hour), OEE breakdown (Availability × Performance × Quality), first
  -pass yield, a bottleneck indicator (which stage has the longest queue).
- **Delivery:** `POST /api/simulation/run` takes the slider parameters, runs
  the SimPy model, returns time-series + summary JSON. Frontend renders with
  a charting library (Recharts/Plotly.js) — bar for stage utilization, line
  for throughput over simulated time, a single highlighted "bottleneck" stage.
- **Acceptance test:** changing the defect-rate slider from 2% to 15%
  measurably changes FPY and throughput in the output — this must be checked
  before considering the feature done, not assumed from the formula.

### 4.2 VisionQC (AI defect detection)
- **Model:** a lightweight image classifier or YOLOv8n object detector,
  trained on a small public defect dataset (e.g. a Kaggle battery-cell or
  casting/surface-defect dataset — pick one with a permissive license and
  document the source in `/ml-training/dataset_notes.md`; do not scrape or
  use a dataset without checking its license).
- **Training:** done once, offline, in `/ml-training` (Colab notebook is
  fine). Export the trained weights to `/backend/app/models/defect_model.pt`
  (or `.onnx` for smaller footprint/faster CPU inference — prefer ONNX if the
  free-tier backend has no GPU, which it won't).
- **Inference endpoint:** `POST /api/vision/predict` accepts an uploaded
  image (or a frame from the browser webcam captured client-side and sent as
  a blob), returns `{ verdict: "pass" | "reject", confidence: float,
  defect_class: string | null }`.
- **UI:** image upload OR "use webcam" button; show the image with a
  bounding box / highlight if the model is a detector, plus a clear
  pass/reject badge and confidence %. Keep a small gallery of 4–6 known
  sample images (2 good, 2–4 defective) as one-click test inputs, for when a
  live camera isn't practical in the presentation room.
- **Acceptance test:** feeding a known-good sample and a known-defective
  sample from the test set produces different, correct verdicts — verify
  this explicitly, don't assume training accuracy transfers to the demo UI
  path without checking it end-to-end.

### 4.3 AGV Pathfinder
- **Grid:** an interactive NxN canvas (start as 15x15). Click to place/remove
  obstacles ("machines"), click to set start and goal cell ("dock" and
  "station").
- **Algorithm:** A* pathfinding, implemented client-side in TypeScript (don't
  round-trip to a backend for this — it's cheap enough to run in-browser and
  removes a failure point during the live demo).
- **Animation:** animate the computed path step-by-step (not an instant
  line-draw) to visually read as "the AGV deciding and moving," with a toggle
  to also visualize the explored/frontier cells for anyone who asks how A*
  works in Q&A.
- **Acceptance test:** adding an obstacle that blocks the direct line forces
  a visibly different, still-valid path around it; an unreachable goal (fully
  walled off) shows a clear "no path found" state rather than hanging or
  crashing.

### 4.4 Website shell (ties it together — this is itself a grading criterion)
- **Home page:** hero section naming the project and Tesla case study, three
  clickable demo cards (each with a one-line description + "Open demo"), and
  a **Module 5 concept-mapping table** (syllabus concept → which demo
  illustrates it → one Tesla example) rendered as an actual table component,
  not a screenshot.
- **About/Report page:** team member names + roles, links to GitHub repo and
  the written report (PDF), numbered reference list matching footer tags used
  elsewhere, and a short "Limitations" section (these are simplified
  educational models, not production manufacturing software — state this
  explicitly rather than overclaiming realism).
- **Nav:** persistent top nav across all pages (Home / GigaTwin / VisionQC /
  AGV Pathfinder / About), so an evaluator can explore unprompted during Q&A.
- **Responsive:** must be legible on a projector at a distance — large
  type, high contrast, no tiny chart labels. Test at 1280x720 minimum.

## 5. Tech stack (fixed — don't substitute without a reason tied to a
constraint above)

- Frontend: React + Vite + TypeScript, Recharts or Plotly.js for charts,
  native Canvas API for the AGV grid.
- Backend: FastAPI (Python), SimPy for the digital twin, PyTorch/ONNXRuntime
  for defect inference (prefer ONNX export for CPU-only free-tier hosting).
- Hosting: frontend → Vercel or Netlify (free tier); backend → Render or
  Railway (free tier, accept cold-start delay and mention it in the demo
  script: "give it a few seconds to wake up").
- Repo: single GitHub repo, public, with a root README covering setup, local
  run instructions, and a link to the live site.

## 6. Explicit non-goals

- No user accounts, no database, no persisted history across sessions — all
  three demos are stateless single-session tools. Don't build auth or storage
  that nothing in §4 requires.
- No real Tesla data or proprietary Tesla software — this is an original
  educational simulation inspired by publicly reported figures (cited in the
  report, not reproduced as if it were Tesla's actual system).
- No claim anywhere in the UI or report that this software is validated
  against real factory data — it's a teaching model. Say so.

## 7. Milestones (10-day build, adjust dates to your actual deadline)

| Day | Deliverable |
|---|---|
| 1–2 | Repo scaffolded (frontend + backend skeletons deploy "hello world" successfully to free-tier hosts — prove the deployment pipeline works before building features on top of it) |
| 3–4 | GigaTwin: SimPy model + REST endpoint + working charts with real slider-driven output |
| 5–6 | VisionQC: dataset selected + model trained + ONNX export + inference endpoint + upload UI |
| 7 | AGV Pathfinder: grid + A* + animation, fully client-side |
| 8 | Website shell: nav, home page concept-mapping table, About page, responsive pass |
| 9 | Record fallback videos for all 3 demos; full rehearsal of the live-demo slide against the hosted URL, not just localhost |
| 10 | Bug-fix buffer, final deploy freeze, README finished, report screenshots taken from the FINAL deployed version |

## 8. Definition of done (check every item before calling this finished)

- [ ] All three demos work against the **hosted** URL, not just localhost.
- [ ] Each demo's output changes meaningfully when its inputs change (see
      the acceptance tests in §4.1–4.3) — verified by actually testing it,
      not inferred from the code looking correct.
- [ ] Concept-mapping table on the home page is a real rendered table, not an
      image or screenshot.
- [ ] Fallback videos exist and play for all three demos.
- [ ] README lets a stranger clone the repo and run everything locally with
      no undocumented steps.
- [ ] No hardcoded fake output anywhere (check this explicitly — a demo that
      *looks* like it's computing but returns a fixed canned response is
      worse than no demo at all if discovered in Q&A).
