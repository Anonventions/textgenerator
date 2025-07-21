# Blockbench Plugin: Minecraft Rank Text Generator (2D Pixelart) 🖼️

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Blockbench](https://img.shields.io/badge/Blockbench-4.0%2B-orange)

**Minecraft Rank Text Generator** is a Blockbench plugin that creates professional 2D pixelart Minecraft rank displays using custom alphabet PNG textures. Generate pixel-perfect rank graphics with 30 built-in fonts, color customization, borders, and export to PNG or .bbmodel format.

---

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Font System](#font-system)
- [Border System](#border-system)
- [Export Options](#export-options)
- [Technical Details](#technical-details)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **30 built-in alphabet font sets** with PNG character files (A-Z, 0-9, symbols)
- **11 border styles** for professional rank displays
- **Real-time 2D pixelart generation** in Blockbench viewport
- **Color customization** with HSV/RGB controls and real-time preview
- **Adjustable letter spacing** (0-50 pixels) for perfect alignment
- **Multiple scaling options** (0.1x to 10x) for different use cases
- **Text alignment** options (left, center, right)
- **Export to PNG** for direct use or **BBModel format** for Blockbench projects
- **Pixel-perfect quality** maintained throughout the generation process
- **Undo/Redo support** integrated with Blockbench's history system

## Installation

### Method 1: Direct Installation
1. Download the `plugin.js` file from this repository
2. Open Blockbench
3. Go to **File > Plugins**
4. Click **Load Plugin from File**
5. Select the downloaded `plugin.js` file
6. The plugin will be available in the **Tools** menu

### Method 2: Repository Clone
```bash
git clone https://github.com/Anonventions/textgenerator.git
cd textgenerator
```
Then follow Method 1 to load the `plugin.js` file

## Quick Start
1. **Install the plugin** using one of the methods above
2. **Open Blockbench** and create a new project (Free Model format recommended)
3. **Go to Tools > Minecraft Rank Text Generator**
4. **Enter your text** (e.g., "ADMIN", "VIP", "MODERATOR")
5. **Select a font** from the 30 available options
6. **Customize colors** and spacing as needed
7. **Click Generate** to create 2D pixelart in the viewport
8. **Export** as PNG or save as .bbmodel

## Usage

### Main Dialog Interface
The plugin provides a comprehensive dialog with the following controls:

#### Text Input
- **Text Field**: Enter the rank text you want to generate
- **Supports**: Letters (A-Z), numbers (0-9), and common symbols
- **Case**: Automatically converts to uppercase for consistency

#### Font Selection
- **30 Built-in Fonts**: Choose from `Default Font 1` through `Default Font 30`
- **Character Sets**: Each font includes A-Z, 0-9, and symbols (+, -, =, etc.)
- **PNG-based**: Each character is a separate PNG file for maximum quality

#### Appearance Controls
- **Letter Spacing**: Adjust spacing between characters (0-50 pixels)
- **Text Color**: Full color picker with hex, RGB, and HSV support
- **Scale**: Resize the text from 0.1x to 10x
- **Alignment**: Left, center, or right alignment options

#### Border System
- **Enable Border**: Toggle checkbox to add borders
- **11 Border Styles**: Choose from different border designs
- **Smart Positioning**: Borders automatically adjust to text dimensions

### Generation Process
1. The plugin creates **2D planes** in Blockbench for each character
2. **Textures are applied** from the selected alphabet set
3. **Color tinting** is applied if specified
4. **Spacing and alignment** are calculated automatically
5. **Border elements** are added if enabled
6. All elements are added to the **Outliner** for easy management

## Font System

### Built-in Fonts
The plugin includes 30 pre-configured alphabet sets:
- `alphabet/` - Default Font 1
- `alphabet2/` through `alphabet30/` - Additional font variations
- Each set contains PNG files for all supported characters

### Character Mapping
```
A-Z: Alphabet characters
0-9: Numbers
Symbols: + - = ( ) [ ] { } ! @ # $ % ^ & * . , ? / < > |
```

### Custom Font Support
While the plugin ships with 30 fonts, the architecture supports:
- **Loading custom alphabet sets**
- **Character validation and mapping**
- **Automatic file path resolution**
- **Error handling for missing characters**

## Border System

### Available Borders
The plugin includes 11 border styles located in `border1/` through `border11/` directories.

### Border Components
Each border set contains:
- `1_end.png` - End pieces
- `2_mid.png` - Middle sections  
- `3_start.png` - Start pieces

### Border Application
- **Automatic sizing** based on text dimensions
- **Corner handling** for seamless borders
- **Pixel-perfect alignment** with text elements
- **Multiple layer support** for complex designs

## Export Options

### PNG Export
- **High-quality raster output** suitable for Minecraft resource packs
- **Transparent background** support
- **Maintains pixel-perfect quality**
- **Multiple resolution options**

### BBModel Export
- **Native Blockbench format** (.bbmodel)
- **Preserves all element properties**
- **Includes texture references**
- **Compatible with Blockbench project workflow**

### Minecraft Compatibility
- **Resource pack ready** textures
- **Standard 16x16 pixel character size**
- **Optimized for Minecraft's rendering engine**
- **Supports vanilla and modded environments**

## Technical Details

### System Requirements
- **Blockbench 4.0+** (latest version recommended)
- **Format Support**: Works best with Free Model format
- **Memory**: Efficient caching system for large alphabet sets
- **Performance**: Optimized for real-time preview updates

### File Structure
```
textgenerator/
├── plugin.js                 # Main plugin file
├── README_BLOCKBENCH.md      # Plugin documentation
├── alphabet/                 # Default font set
│   ├── A.png, B.png, ...    # Character PNG files
├── alphabet2/ - alphabet30/  # Additional font sets
├── border1/ - border11/      # Border component sets
└── assets/                   # Web app assets (legacy)
```

### API Integration
The plugin integrates with Blockbench's APIs:
- **Element Creation**: Uses Cube class for 2D planes
- **Texture System**: Applies PNG textures to faces
- **Outliner Integration**: Adds elements to project hierarchy
- **Undo System**: Provides undo/redo support
- **Dialog System**: Uses native Blockbench UI components

## Development

### Plugin Architecture
```javascript
// Main components
class TextGenerator {
    // Core text generation logic
    generateText(text, options)
    loadAlphabetSet(fontKey, directory)
    createCharacterPlane(char, alphabetSet, x, y, scale, color)
}

// Plugin registration
BBPlugin.register(plugin_id, {
    title, author, description,
    onload, onunload
});
```

### Extending the Plugin
The plugin is designed for extensibility:
- **Font System**: Add new alphabet sets by placing PNG files in directories
- **Border System**: Create new border sets with the standard component structure
- **Color System**: Extend color manipulation functions
- **Export System**: Add new export formats and options

### Debugging
Enable Blockbench's developer tools to debug the plugin:
```javascript
console.log('Plugin state:', pluginState);
console.log('Loaded alphabet sets:', pluginState.alphabetSets);
```

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
1. Clone the repository
2. Make your changes to `plugin.js`
3. Test in Blockbench by loading the plugin
4. Submit a pull request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Created by Anonventions** | **For Blockbench 4.0+** | **Minecraft Compatible**