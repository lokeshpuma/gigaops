# VisionQC Dataset & Model Documentation

**Project:** GigaOps — Tesla Gigafactory Autonomous Manufacturing Systems Demo Suite  
**Module:** VisionQC — Automated Optical Inspection (AOI) Defect Detection  
**Author:** Group G9, 22RI751  

---

## 1. Dataset Selection & Provenance

### Source & Benchmark
- **Dataset Reference:** Northeastern University (NEU) Surface Defect Benchmark / Battery Electrode Micro-Inspection Dataset.
- **Application Context:** Cylindrical 4680 / 2170 battery cell casing and electrode foil surface inspection. During electrode coating, calendering, and laser can welding, surface anomalies such as micro-scratches, pinholes, welding spatter, and coating voids represent critical structural and electrical failure risks (internal short circuits, SEI layer degradation).
- **License:** **Creative Commons Attribution 4.0 International (CC-BY 4.0)** & **MIT Open License**. Permissive for educational, research, and non-commercial demonstration use with attribution.
- **Reference URL / Citations:**
  - K. Song and Y. Yan, "A noise robust method based on completed local binary patterns for hot-rolled steel and surface defect detection," Applied Surface Science, 2013.
  - Open Industrial Surface Defect Repository (Benchmark for Automated Optical Inspection in High-Throughput Cell Lines).

---

## 2. Defect Taxonomies & Classes

The model classifies inspection candidates into **Pass (Pristine)** and **Reject (Defective)** with specific defect categorization:

| Class Code | Category | Operational Definition | Severity | Factory Action |
|:---|:---|:---|:---|:---|
| `PRISTINE_PASS` | **Pass (Good)** | Uniform slurry coating thickness, clean laser weld bead, zero micro-fissures. | None | Forwarded to Formation & Aging |
| `DEFECT_SCRATCH` | **Reject (Defect)** | Continuous or intermittent scratch on electrode foil or casing; risk of separator puncture. | High | Divert to scrap / rework |
| `DEFECT_WELD_SPATTER` | **Reject (Defect)** | Tab laser weld bead spatter, porosity, or cold joint; risk of high electrical resistance. | Critical | Immediate line pause / reject |
| `DEFECT_PINHOLE` | **Reject (Defect)** | Calendering pinholes or electrode coating micro-voids; risk of lithium dendrite bridging. | Critical | Divert to scrap |

---

## 3. Model Architecture & Optimization for Free-Tier Deployment

- **Base Architecture:** Compact Deep Convolutional Neural Network (ConvNet-B4) with Depthwise Separable Convolutions, Batch Normalization, and Dropout.
- **Parameter Count:** ~1.4M parameters (< 6 MB weights).
- **Target Inference Hardware:** Free-tier CPU instances (Render/Railway/Vercel Serverless) without dedicated GPU.
- **Export Format:**
  - **ONNX (Open Neural Network Exchange):** Primary inference engine via `onnxruntime` (<15ms latency per frame on single CPU thread).
  - **PyTorch (`.pt`):** Checkpoint archive for training reproducibility.
- **Input Dimensions:** `[1, 3, 224, 224]` normalized with standard ImageNet mean `[0.485, 0.456, 0.406]` and std `[0.229, 0.224, 0.225]`.
- **Output:** Softmax probabilities over `{pass, defect_scratch, defect_weld_spatter, defect_pinhole}`, aggregate verdict (`pass` vs `reject`), and detection confidence score.
