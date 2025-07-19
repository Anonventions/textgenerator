# Text Image Generator 🖼️

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

**Text Image Generator** is a lightweight, client‑side web application that transforms plain text into crisp bitmap images. Choose from 29 unique pixel fonts, tweak letter‑spacing in real time, preview the result on‑canvas, and export in the format that best suits your workflow.

---

## Table of Contents
- [Features](#features)
- [Live Demo](#live-demo)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Export Formats](#export-formats)
- [Progressive Web App](#progressive-web-app)
- [Accessibility](#accessibility)
- [Development](#development)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **29 hand‑crafted bitmap fonts** ready for retro titles, stream overlays, and game UIs  
- **Real‑time canvas preview** with adjustable **letter spacing** (`0–150 px`)  
- **Keyboard‑friendly font picker** with search and arrow‑key navigation  
- **One‑click export** to **PNG**, **JPEG**, **SVG**, **BMP**, or **WEBP**  
- **Automatic dark/light theme** via `prefers‑color‑scheme`  
- **Installable PWA** — works 100 % offline after first load  
- **Version‑update toast** lets users refresh to the latest release instantly  
- **No tracking, no backend** — everything happens in the browser  
- **WCAG‑compliant** markup and live‑region announcements for screen readers  

## Live Demo
A hosted version is available at **https://your‑domain.example/text‑image‑generator**  
*(Replace this URL with your deployment.)*

![Screenshot](docs/screenshot.png)

## Quick Start
Clone the repo and open `index.html`, or serve the folder via any static HTTP server:

```bash
git clone https://github.com/<your‑username>/text-image-generator.git
cd text-image-generator

# Option 1 – open directly
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux

# Option 2 – local server
npx serve .
