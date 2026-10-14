"""
VisionQC Model Training & ONNX Export Pipeline
Trains a compact CNN classifier on battery surface & weld defects and exports to ONNX and PyTorch checkpoints.
"""

import os
import json
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms

# Reproducibility
torch.manual_seed(42)
np.random.seed(42)
random.seed(42)

CLASSES = ["pristine_pass", "defect_scratch", "defect_weld_spatter", "defect_pinhole"]
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}

class DefectClassifier(nn.Module):
    def __init__(self, num_classes=4):
        super(DefectClassifier, self).__init__()
        self.features = nn.Sequential(
            # Block 1
            nn.Conv2d(3, 32, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(32),
            nn.SiLU(),
            
            # Block 2
            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.SiLU(),
            
            # Block 3
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.SiLU(),

            # Block 4
            nn.Conv2d(128, 256, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.SiLU(),

            # Global Avg Pooling
            nn.AdaptiveAvgPool2d((1, 1))
        )
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.SiLU(),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        feat = self.features(x)
        feat = torch.flatten(feat, 1)
        out = self.classifier(feat)
        return out

def generate_battery_surface_image(defect_type: str, size=(224, 224)) -> Image.Image:
    """
    Synthesize realistic battery casing / electrode foil texture with physical defects:
    - pristine_pass: smooth brushed aluminum/copper grain with lighting gradient
    - defect_scratch: sharp longitudinal/diagonal tear line across metallic surface
    - defect_weld_spatter: irregular clustered dark droplets / heat discoloration halos
    - defect_pinhole: dark micro-perforations with bright raised rim
    """
    w, h = size
    # Base metallic background with gradient
    base_lum = random.randint(140, 180)
    arr = np.full((h, w, 3), base_lum, dtype=np.uint8)
    
    # Brushed metal grain along horizontal axis
    grain = np.random.normal(0, 12, (h, w)).astype(np.int16)
    arr = np.clip(arr.astype(np.int16) + grain[:, :, None], 0, 255).astype(np.uint8)
    
    # Soft lighting vignette
    y_coords, x_coords = np.ogrid[:h, :w]
    center_y, center_x = h / 2, w / 2
    vignette = 1.0 - 0.25 * (((x_coords - center_x) / (w / 2)) ** 2 + ((y_coords - center_y) / (h / 2)) ** 2)
    vignette = np.clip(vignette, 0.6, 1.0)[:, :, None]
    arr = (arr * vignette).astype(np.uint8)

    img = Image.fromarray(arr, mode="RGB")
    draw = ImageDraw.Draw(img)

    if defect_type == "pristine_pass":
        # Pristine: subtle laser weld seam or faint alignment guide mark
        pass

    elif defect_type == "defect_scratch":
        # Sharp multi-segment scratch with high visual contrast
        num_scratches = random.randint(2, 4)
        for _ in range(num_scratches):
            x1 = random.randint(15, w - 30)
            y1 = random.randint(15, h - 30)
            length = random.randint(60, 140)
            angle = random.uniform(-0.8, 0.8)
            x2 = int(x1 + length * np.cos(angle))
            y2 = int(y1 + length * np.sin(angle))
            # Deep dark gash with bright gouge edge
            draw.line([(x1, y1), (x2, y2)], fill=(10, 10, 15), width=random.randint(3, 5))
            draw.line([(x1 + 1, y1 - 2), (x2 + 1, y2 - 2)], fill=(255, 255, 255), width=2)

    elif defect_type == "defect_weld_spatter":
        # Weld spatter: molten droplets around weld zone
        cx = random.randint(60, w - 60)
        cy = random.randint(60, h - 60)
        # Discoloration heat ring
        draw.ellipse([cx - 35, cy - 35, cx + 35, cy + 35], fill=None, outline=(180, 130, 80), width=3)
        num_droplets = random.randint(6, 14)
        for _ in range(num_droplets):
            dx = cx + random.randint(-40, 40)
            dy = cy + random.randint(-40, 40)
            r = random.randint(2, 7)
            # Scorched carbon dark spot with burnt amber fringe
            draw.ellipse([dx - r, dy - r, dx + r, dy + r], fill=(20, 20, 25), outline=(140, 70, 30))

    elif defect_type == "defect_pinhole":
        # Pinhole punctures
        num_holes = random.randint(3, 8)
        for _ in range(num_holes):
            hx = random.randint(30, w - 30)
            hy = random.randint(30, h - 30)
            hr = random.randint(2, 5)
            # Pinhole core is black with reflective burr
            draw.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(10, 10, 15), outline=(230, 230, 240), width=1)

    return img

class SyntheticBatteryDataset(Dataset):
    def __init__(self, samples_per_class=250, transform=None):
        self.samples = []
        self.transform = transform
        for cls_name in CLASSES:
            for _ in range(samples_per_class):
                self.samples.append((cls_name, CLASS_TO_IDX[cls_name]))
        random.shuffle(self.samples)

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        cls_name, label = self.samples[idx]
        img = generate_battery_surface_image(cls_name)
        if self.transform:
            img = self.transform(img)
        return img, label

def train_and_export():
    print("=== Step 1: Synthesizing training dataset & transforms ===")
    transform_train = transforms.Compose([
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    transform_val = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_dataset = SyntheticBatteryDataset(samples_per_class=250, transform=transform_train)
    val_dataset = SyntheticBatteryDataset(samples_per_class=60, transform=transform_val)

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

    device = torch.device("cpu")
    model = DefectClassifier(num_classes=len(CLASSES)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=8)

    print(f"=== Step 2: Training DefectClassifier ({len(train_dataset)} train samples, {len(val_dataset)} val samples) ===")
    epochs = 8
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(imgs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * imgs.size(0)
            preds = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

        scheduler.step()
        train_acc = (correct / total) * 100.0
        
        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                outputs = model(imgs)
                preds = outputs.argmax(dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)
        val_acc = (val_correct / val_total) * 100.0
        print(f"Epoch {epoch}/{epochs} | Train Loss: {total_loss/total:.4f} | Train Acc: {train_acc:.1f}% | Val Acc: {val_acc:.1f}%")

    # Destination paths
    models_dir = "/Users/lokesh/Desktop/tesla/backend/app/models"
    os.makedirs(models_dir, exist_ok=True)
    pt_path = os.path.join(models_dir, "defect_model.pt")
    onnx_path = os.path.join(models_dir, "defect_model.onnx")

    print(f"=== Step 3: Saving PyTorch checkpoint to {pt_path} ===")
    torch.save({
        "state_dict": model.state_dict(),
        "classes": CLASSES,
        "class_to_idx": CLASS_TO_IDX,
    }, pt_path)

    print(f"=== Step 4: Exporting ONNX model to {onnx_path} ===")
    model.eval()
    dummy_input = torch.randn(1, 3, 224, 224, requires_grad=False)
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=18,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        dynamo=False
    )
    print("ONNX export successfully completed. File size:", round(os.path.getsize(onnx_path) / 1024, 1), "KB")

    # Step 5: Generate and save high quality gallery sample images
    # We save in both backend/app/static/samples and frontend/public/samples
    sample_dirs = [
        "/Users/lokesh/Desktop/tesla/backend/app/static/samples",
        "/Users/lokesh/Desktop/tesla/frontend/public/samples"
    ]
    for sdir in sample_dirs:
        os.makedirs(sdir, exist_ok=True)

    gallery_manifest = [
        {"id": "sample-pass-1", "label": "Pristine 4680 Foil A", "defect_type": "pristine_pass", "expected": "pass"},
        {"id": "sample-pass-2", "label": "Pristine Laser Weld", "defect_type": "pristine_pass", "expected": "pass"},
        {"id": "sample-scratch-1", "label": "Electrode Surface Scratch", "defect_type": "defect_scratch", "expected": "reject"},
        {"id": "sample-weld-1", "label": "Tab Laser Weld Spatter", "defect_type": "defect_weld_spatter", "expected": "reject"},
        {"id": "sample-pinhole-1", "label": "Calendering Pinhole Void", "defect_type": "defect_pinhole", "expected": "reject"},
        {"id": "sample-scratch-2", "label": "Deep Casing Score Mark", "defect_type": "defect_scratch", "expected": "reject"},
    ]

    print("=== Step 6: Generating curated gallery test fixtures ===")
    for item in gallery_manifest:
        img = generate_battery_surface_image(item["defect_type"], size=(224, 224))
        for sdir in sample_dirs:
            filepath = os.path.join(sdir, f"{item['id']}.jpg")
            img.save(filepath, "JPEG", quality=95)
        print(f"  Generated {item['id']}.jpg ({item['label']} -> expected {item['expected']})")

    # Save manifest
    manifest_path = "/Users/lokesh/Desktop/tesla/backend/app/static/samples/manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(gallery_manifest, f, indent=2)
    # Also in frontend
    with open("/Users/lokesh/Desktop/tesla/frontend/public/samples/manifest.json", "w") as f:
        json.dump(gallery_manifest, f, indent=2)

    print("Pipeline finished successfully!")

if __name__ == "__main__":
    train_and_export()
