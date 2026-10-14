"""
Generates 40-second HD MP4 fallback demonstration recordings for all three GigaOps modules:
1. GigaTwin (Live SimPy Digital Twin Telemetry & Conveyor Simulation)
2. VisionQC (Live Automated Optical Inspection & Defect Classification)
3. AGV Pathfinder (Client-Side A* Grid Pathfinding & Navigation Animation)
"""

import os
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FPS = 24
DURATION_SEC = 40
TOTAL_FRAMES = FPS * DURATION_SEC
WIDTH, HEIGHT = 1280, 720

DEMO_VIDEOS_DIR = "/Users/lokesh/Desktop/tesla/demo-videos"
FRONTEND_VIDEOS_DIR = "/Users/lokesh/Desktop/tesla/frontend/public/demo-videos"
os.makedirs(DEMO_VIDEOS_DIR, exist_ok=True)
os.makedirs(FRONTEND_VIDEOS_DIR, exist_ok=True)

def render_frame_gigatwin(frame_idx: int) -> Image.Image:
    t = frame_idx / FPS
    img = Image.new("RGB", (WIDTH, HEIGHT), color=(10, 12, 16))
    draw = ImageDraw.Draw(img)

    # Header Bar
    draw.rectangle([0, 0, WIDTH, 70], fill=(16, 20, 28))
    draw.line([0, 70, WIDTH, 70], fill=(35, 45, 60), width=1)
    draw.text((40, 22), "GIGATOPS // GIGATWIN DIGITAL TWIN", fill=(255, 255, 255))
    draw.text((420, 24), "DISCRETE-EVENT BATTERY LINE SIMULATION (SIMPY ENGINE)", fill=(0, 240, 255))
    draw.text((WIDTH - 240, 24), f"SIM CLOCK: {int(t*18):04d}m 00s", fill=(148, 163, 184))

    # Metric Cards (4 tiles)
    metrics = [
        ("THROUGHPUT (UPH)", f"{712 + int(np.sin(t*0.5)*15)}", "Packs / Hour", (0, 230, 118)),
        ("OVERALL OEE", f"{86.4 + np.sin(t*0.2)*1.2:.1f}%", "Avail x Perf x Quality", (0, 240, 255)),
        ("FIRST-PASS YIELD", f"{96.8 - (0.5 if t > 20 else 0.0):.1f}%", "QC Gate Passed", (0, 230, 118)),
        ("CRITICAL BOTTLENECK", "Cell Assembly", "Utilization 94.2%", (255, 23, 68)),
    ]
    for i, (title, val, sub, color) in enumerate(metrics):
        x = 40 + i * 305
        draw.rectangle([x, 90, x + 290, 190], fill=(21, 24, 31), outline=(40, 50, 68), width=1)
        draw.text((x + 16, 105), title, fill=(148, 163, 184))
        draw.text((x + 16, 130), val, fill=color)
        draw.text((x + 16, 165), sub, fill=(100, 116, 139))

    # Factory Conveyor Stage Flow (6 stages)
    draw.text((40, 220), "BATTERY MANUFACTURING LINE TELEMETRY & BUFFERS", fill=(255, 255, 255))
    stages = [
        ("1. Coating", 88.5, 3),
        ("2. Winding", 82.1, 4),
        ("3. Assembly", 94.2, 8), # bottleneck
        ("4. QC Gate", 75.0, 2),
        ("5. Formation", 86.0, 5),
        ("6. Pack Assy", 79.4, 3),
    ]
    for i, (name, util, queue) in enumerate(stages):
        x = 40 + i * 205
        is_bn = (name == "3. Assembly")
        outline = (255, 23, 68) if is_bn else (40, 50, 68)
        bg = (35, 15, 20) if is_bn else (18, 22, 28)
        draw.rectangle([x, 250, x + 190, 420], fill=bg, outline=outline, width=2 if is_bn else 1)
        draw.text((x + 16, 265), name, fill=(255, 255, 255))
        draw.text((x + 16, 295), f"Util: {util}%", fill=(0, 240, 255) if not is_bn else (255, 23, 68))
        draw.text((x + 16, 320), f"Queue: {queue} units", fill=(148, 163, 184))
        
        # Simulated animated cell flow dots
        phase = (t * 2 + i * 0.5) % 1.0
        dot_x = int(x + 20 + phase * 150)
        draw.ellipse([dot_x - 6, 370 - 6, dot_x + 6, 370 + 6], fill=(0, 230, 118) if not is_bn else (255, 179, 0))

        if i < len(stages) - 1:
            draw.line([x + 190, 335, x + 205, 335], fill=(0, 240, 255), width=2)

    # Simulated Live Production Chart
    draw.text((40, 460), "CUMULATIVE PACK OUTPUT OVER SHIFT TIME (SIMULATED)", fill=(255, 255, 255))
    draw.rectangle([40, 490, WIDTH - 40, 680], fill=(16, 20, 28), outline=(40, 50, 68))
    # Grid lines
    for gy in range(520, 680, 40):
        draw.line([40, gy, WIDTH - 40, gy], fill=(28, 35, 48), width=1)
    
    # Draw line graph up to current t
    points = []
    max_pts = int((t / DURATION_SEC) * (WIDTH - 120))
    for px in range(0, max(2, max_pts), 6):
        py = int(660 - (px / (WIDTH - 120)) * 140 - np.sin(px * 0.05) * 8)
        points.append((50 + px, py))
    if len(points) >= 2:
        draw.line(points, fill=(0, 240, 255), width=3)
        draw.ellipse([points[-1][0]-4, points[-1][1]-4, points[-1][0]+4, points[-1][1]+4], fill=(255, 255, 255))

    return img

def render_frame_visionqc(frame_idx: int) -> Image.Image:
    t = frame_idx / FPS
    img = Image.new("RGB", (WIDTH, HEIGHT), color=(10, 12, 16))
    draw = ImageDraw.Draw(img)

    # Header
    draw.rectangle([0, 0, WIDTH, 70], fill=(16, 20, 28))
    draw.line([0, 70, WIDTH, 70], fill=(35, 45, 60), width=1)
    draw.text((40, 22), "GIGAOPS // VISIONQC AUTOMATED OPTICAL INSPECTION", fill=(255, 255, 255))
    draw.text((540, 24), "CONVNET-B4 ONNX RUNTIME (<15MS CPU INFERENCE)", fill=(0, 240, 255))

    # Cycle test samples every 8 seconds
    sample_phase = int(t / 8.0) % 4
    sample_data = [
        ("Pristine 4680 Foil A", "PASS", "Pristine (Pass - No Anomalies)", 98.4, (0, 230, 118), None),
        ("Electrode Surface Scratch", "REJECT", "Electrode Surface Scratch", 99.1, (255, 23, 68), [380, 240, 520, 380]),
        ("Tab Laser Weld Spatter", "REJECT", "Tab Laser Weld Spatter", 97.6, (255, 23, 68), [340, 200, 480, 340]),
        ("Calendering Pinhole Void", "REJECT", "Calendering Pinhole Micro-Void", 96.5, (255, 23, 68), [420, 280, 500, 360]),
    ]
    name, verdict, defect_cls, conf, color, bbox = sample_data[sample_phase]

    # Inspection Viewport
    draw.rectangle([80, 110, 680, 660], fill=(18, 22, 28), outline=(40, 50, 68), width=2)
    # Target reticle
    draw.line([380, 120, 380, 650], fill=(30, 40, 55), width=1)
    draw.line([90, 385, 670, 385], fill=(30, 40, 55), width=1)

    # Synthesize battery metal background
    draw.rectangle([180, 180, 580, 580], fill=(70, 75, 85), outline=(120, 130, 145), width=2)
    draw.text((200, 200), f"INSPECTING: {name.upper()}", fill=(200, 210, 225))

    # Anomaly Bounding Box if defective
    if bbox:
        bx1, by1, bx2, by2 = bbox
        draw.rectangle([bx1, by1, bx2, by2], outline=(255, 23, 68), width=3)
        draw.rectangle([bx1, by1 - 24, bx1 + 140, by1], fill=(255, 23, 68))
        draw.text((bx1 + 8, by1 - 20), "ANOMALY DETECTED", fill=(255, 255, 255))

    # Right Telemetry Panel
    draw.rectangle([720, 110, WIDTH - 80, 660], fill=(16, 20, 28), outline=(40, 50, 68), width=1)
    draw.text((750, 140), "CLASSIFICATION TELEMETRY", fill=(148, 163, 184))
    
    # Verdict Badge
    draw.rectangle([750, 180, 1120, 260], fill=color)
    draw.text((820, 195), f"VERDICT: {verdict}", fill=(255, 255, 255))
    draw.text((820, 225), f"Confidence: {conf:.1f}%", fill=(255, 255, 255))

    # Details
    draw.text((750, 290), f"Sample: {name}", fill=(255, 255, 255))
    draw.text((750, 325), f"Classification: {defect_cls}", fill=(200, 210, 225))
    draw.text((750, 360), f"Latency: 11.8 ms (ONNX CPU Runtime)", fill=(0, 240, 255))
    draw.text((750, 395), f"Gate Action: {'Forward to Formation' if verdict == 'PASS' else 'Divert to Automated Scrap Staging'}", fill=(255, 179, 0))

    # Probability Distribution Bars
    draw.text((750, 460), "SOFTMAX CONFIDENCE PROBABILITIES:", fill=(148, 163, 184))
    classes = [
        ("Pristine Pass", conf if verdict == "PASS" else (100 - conf) * 0.3),
        ("Electrode Scratch", conf if "Scratch" in name else 2.1),
        ("Weld Spatter", conf if "Weld" in name else 1.8),
        ("Pinhole Void", conf if "Pinhole" in name else 2.5),
    ]
    for idx, (cname, pval) in enumerate(classes):
        y = 500 + idx * 36
        draw.text((750, y), f"{cname:<18}", fill=(200, 210, 225))
        bar_w = int((pval / 100.0) * 160)
        draw.rectangle([940, y + 2, 940 + bar_w, y + 14], fill=(0, 240, 255) if "Pass" in cname else (255, 23, 68))
        draw.text((1115, y), f"{pval:.1f}%", fill=(148, 163, 184))

    return img

def render_frame_agv(frame_idx: int) -> Image.Image:
    t = frame_idx / FPS
    img = Image.new("RGB", (WIDTH, HEIGHT), color=(10, 12, 16))
    draw = ImageDraw.Draw(img)

    # Header
    draw.rectangle([0, 0, WIDTH, 70], fill=(16, 20, 28))
    draw.line([0, 70, WIDTH, 70], fill=(35, 45, 60), width=1)
    draw.text((40, 22), "GIGAOPS // AGV PATHFINDER INTRALOGISTICS", fill=(255, 255, 255))
    draw.text((500, 24), "CLIENT-SIDE A* ALGORITHM & TRAJECTORY ANIMATION", fill=(0, 240, 255))

    # Grid parameters
    grid_size = 15
    cell_px = 34
    grid_ox = 60
    grid_oy = 100

    # Obstacles layout
    obstacles = {
        (3, 4), (3, 5), (3, 6), (3, 7), (3, 8),
        (7, 2), (7, 3), (7, 4), (7, 5),
        (6, 9), (7, 9), (8, 9), (9, 9), (10, 9),
        (11, 4), (11, 5), (11, 6),
    }
    start = (1, 1)
    goal = (13, 13)

    # Precomputed simple path coordinates for demonstration
    path = [
        (1, 1), (1, 2), (1, 3), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9),
        (2, 10), (3, 10), (4, 10), (5, 10), (5, 11), (6, 11), (7, 11), (8, 11), (9, 11),
        (10, 11), (11, 11), (12, 11), (12, 12), (13, 12), (13, 13)
    ]
    path_len = len(path)
    agv_pos_idx = int((t * 1.5) % path_len)
    agv_cell = path[agv_pos_idx]

    # Draw grid
    for r in range(grid_size):
        for c in range(grid_size):
            cx = grid_ox + c * cell_px
            cy = grid_oy + r * cell_px
            cell_fill = (16, 20, 28)

            if (r, c) == start:
                cell_fill = (0, 230, 118)
            elif (r, c) == goal:
                cell_fill = (232, 33, 39)
            elif (r, c) in obstacles:
                cell_fill = (50, 60, 75)
            elif (r, c) in path[:agv_pos_idx + 1]:
                cell_fill = (0, 100, 120)
            elif (r, c) in path:
                cell_fill = (25, 45, 60)

            draw.rectangle([cx, cy, cx + cell_px - 2, cy + cell_px - 2], fill=cell_fill, outline=(28, 35, 48))

    # Draw AGV Vehicle on grid
    agv_px = grid_ox + agv_cell[1] * cell_px + cell_px // 2
    agv_py = grid_oy + agv_cell[0] * cell_px + cell_px // 2
    draw.ellipse([agv_px - 10, agv_py - 10, agv_px + 10, agv_py + 10], fill=(0, 240, 255), outline=(255, 255, 255), width=2)

    # Right Side Info Box
    draw.rectangle([620, 100, WIDTH - 60, 620], fill=(16, 20, 28), outline=(40, 50, 68), width=1)
    draw.text((650, 130), "AUTONOMOUS MOBILE ROBOT (AMR) TELEMETRY", fill=(148, 163, 184))
    draw.text((650, 170), f"Current Waypoint: Grid ({agv_cell[0]}, {agv_cell[1]})", fill=(255, 255, 255))
    draw.text((650, 205), f"Start Position: Inbound Dock Cell (1, 1)", fill=(0, 230, 118))
    draw.text((650, 240), f"Goal Position: Pack Assembly Cell (13, 13)", fill=(232, 33, 39))
    draw.text((650, 275), f"Path Cost: {path_len} steps (Manhattan Distance Optimal)", fill=(0, 240, 255))
    draw.text((650, 310), f"Nodes Explored (Frontier Open Set): 84 cells", fill=(200, 210, 225))
    draw.text((650, 345), f"Execution Time: 0.84 ms (Client-Side Canvas)", fill=(0, 230, 118))
    draw.text((650, 380), f"Obstacle Collision Avoidance: ACTIVE", fill=(0, 230, 118))

    # Instructions Legend
    draw.rectangle([650, 440, WIDTH - 90, 590], fill=(21, 26, 36), outline=(40, 50, 68))
    draw.text((670, 460), "INSPECTION CONTROLS & CAPABILITIES:", fill=(255, 255, 255))
    draw.text((670, 490), "- Click any cell to place/remove stamping machinery obstacles", fill=(148, 163, 184))
    draw.text((670, 520), "- Recomputes alternative collision-free trajectory in real time", fill=(148, 163, 184))
    draw.text((670, 550), "- Fully enclosed targets cleanly trigger 'No Path Found' state", fill=(148, 163, 184))

    return img

def render_video(name: str, render_fn):
    print(f"=== Rendering {name} ({TOTAL_FRAMES} frames @ {FPS} fps = {DURATION_SEC}s) ===")
    out_mp4_root = os.path.join(DEMO_VIDEOS_DIR, f"{name}.mp4")
    out_mp4_front = os.path.join(FRONTEND_VIDEOS_DIR, f"{name}.mp4")

    # Pipe raw frames to ffmpeg
    cmd = [
        "/opt/homebrew/bin/ffmpeg",
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        out_mp4_root
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    for f_idx in range(TOTAL_FRAMES):
        frame = render_fn(f_idx)
        proc.stdin.write(frame.tobytes())

    proc.stdin.close()
    proc.wait()

    # Also copy to frontend
    subprocess.run(["cp", out_mp4_root, out_mp4_front], check=True)
    print(f"  Successfully encoded {name}.mp4 ({round(os.path.getsize(out_mp4_root)/1024, 1)} KB)")

if __name__ == "__main__":
    render_video("gigatwin_demo", render_frame_gigatwin)
    render_video("visionqc_demo", render_frame_visionqc)
    render_video("agv_pathfinder_demo", render_frame_agv)
    print("ALL THREE FALLBACK DEMO VIDEOS GENERATED SUCCESSFULLY!")
