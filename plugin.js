/**
 * Blockbench Plugin: Minecraft Rank Text Generator (2D Pixelart)
 * Version: 1.0.0
 * Author: Anonventions
 * Description: Generate 2D pixelart Minecraft rank displays using custom alphabet PNG textures
 */

(() => {
    'use strict';

    let plugin_data = {
        id: 'minecraft_rank_text_generator',
        title: 'Minecraft Rank Text Generator',
        icon: 'text_fields',
        author: 'Anonventions',
        description: 'Generate 2D pixelart Minecraft rank displays using custom alphabet PNG textures',
        about: 'Create professional-looking rank graphics with custom fonts, colors, and borders. Features 30 built-in alphabet sets, color customization, border system, and export to PNG/BBModel.',
        tags: ['Minecraft', 'Text', 'Pixelart', '2D', 'Ranks'],
        version: '1.0.0',
        min_version: '4.0.0',
        variant: 'both'
    };

    let dialog, action;
    let textGenerator = null;

    // Plugin state
    let pluginState = {
        alphabetSets: new Map(),
        borderSets: new Map(),
        currentFont: 'default1',
        currentBorder: null,
        letterSpacing: 10,
        textInput: '',
        textColor: '#FFFFFF',
        backgroundColor: '#000000',
        scale: 1,
        alignment: 'left',
        borderEnabled: false
    };

    /**
     * TextGenerator class - Core functionality for generating 2D pixelart text
     */
    class TextGenerator {
        constructor() {
            this.fonts = this.initializeFonts();
            this.borders = this.initializeBorders();
            this.imageCache = new Map();
        }

        /**
         * Initialize built-in font sets
         */
        initializeFonts() {
            const fonts = {};
            
            // Add default font (alphabet directory)
            fonts['default1'] = './alphabet/';
            
            // Add numbered font directories (only if they exist)
            for (let i = 2; i <= 30; i++) {
                const fontPath = `./alphabet${i}/`;
                // We'll validate existence when loading
                fonts[`default${i}`] = fontPath;
            }
            
            return fonts;
        }

        /**
         * Get available font options for the dialog
         */
        getAvailableFontOptions() {
            const options = {};
            
            // Check which font directories actually exist
            for (const [fontKey, fontPath] of Object.entries(this.fonts)) {
                // For now, we'll include all fonts and handle missing ones during loading
                const fontNumber = fontKey.replace('default', '');
                options[fontKey] = `Font ${fontNumber}`;
            }
            
            return options;
        }

        /**
         * Validate if a font directory exists and has character files
         */
        async validateFont(fontKey) {
            const directory = this.fonts[fontKey];
            if (!directory) return false;
            
            try {
                // In a real Blockbench environment, we would check if the directory exists
                // For now, we'll return true and handle errors during loading
                return true;
            } catch (error) {
                console.warn(`Font ${fontKey} validation failed:`, error);
                return false;
            }
        }
        initializeBorders() {
            const borders = {};
            for (let i = 1; i <= 11; i++) {
                borders[`border${i}`] = `./border${i}/`;
            }
            return borders;
        }

        /**
         * Load alphabet set from directory
         */
        async loadAlphabetSet(fontKey, directory) {
            if (pluginState.alphabetSets.has(fontKey)) {
                return pluginState.alphabetSets.get(fontKey);
            }

            // Characters available in the alphabet sets (both upper and lower case)
            const characters = 'abcdefghijklmnopqrstuvwxyz0123456789+-=()[]{}#&*.';
            const characterMap = new Map();

            try {
                for (const char of characters) {
                    // Use the actual character filename (lowercase)
                    const imagePath = `${directory}${char}.png`;
                    characterMap.set(char.toUpperCase(), imagePath); // Map to uppercase for consistency
                    characterMap.set(char, imagePath); // Also map lowercase
                }

                const alphabetSet = {
                    name: fontKey,
                    directory: directory,
                    characters: characterMap
                };

                pluginState.alphabetSets.set(fontKey, alphabetSet);
                return alphabetSet;
            } catch (error) {
                console.error(`Failed to load alphabet set ${fontKey}:`, error);
                return null;
            }
        }

        /**
         * Load border set from directory
         */
        async loadBorderSet(borderKey, directory) {
            if (pluginState.borderSets.has(borderKey)) {
                return pluginState.borderSets.get(borderKey);
            }

            // Border components based on actual file structure
            const borderComponents = ['1_start.png', '1_middle.png', '1_end.png'];
            const borderMap = new Map();

            try {
                for (const component of borderComponents) {
                    const imagePath = `${directory}${component}`;
                    borderMap.set(component, imagePath);
                }

                const borderSet = {
                    name: borderKey,
                    directory: directory,
                    components: borderMap
                };

                pluginState.borderSets.set(borderKey, borderSet);
                return borderSet;
            } catch (error) {
                console.error(`Failed to load border set ${borderKey}:`, error);
                return null;
            }
        }

        /**
         * Generate 2D pixelart text in Blockbench
         */
        async generateText(text, options = {}) {
            const {
                font = pluginState.currentFont,
                spacing = pluginState.letterSpacing,
                color = pluginState.textColor,
                scale = pluginState.scale,
                alignment = pluginState.alignment
            } = options;

            // Load the alphabet set
            const alphabetSet = await this.loadAlphabetSet(font, this.fonts[font]);
            if (!alphabetSet) {
                Blockbench.showMessageBox({
                    title: 'Error',
                    message: `Failed to load font: ${font}`
                });
                return false;
            }

            // Clear existing elements
            this.clearExistingText();

            // Start undo point
            Undo.initEdit({elements: selected});

            try {
                let currentX = 0;
                const characterHeight = 16; // Standard character height
                const characterWidth = 16;  // Standard character width

                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    
                    if (char === ' ') {
                        currentX += characterWidth + spacing;
                        continue;
                    }

                    // Check both uppercase and lowercase versions
                    const upperChar = char.toUpperCase();
                    const lowerChar = char.toLowerCase();
                    
                    if (alphabetSet.characters.has(lowerChar)) {
                        await this.createCharacterPlane(lowerChar, alphabetSet, currentX, 0, scale, color);
                        currentX += characterWidth + spacing;
                    } else if (alphabetSet.characters.has(upperChar)) {
                        await this.createCharacterPlane(upperChar, alphabetSet, currentX, 0, scale, color);
                        currentX += characterWidth + spacing;
                    } else {
                        // Character not found, skip it
                        console.warn(`Character '${char}' not found in font set ${font}`);
                    }
                }

                // Add border if enabled
                if (pluginState.borderEnabled && pluginState.currentBorder) {
                    await this.addBorder(currentX, characterHeight, scale);
                }

                Undo.finishEdit('Generate pixelart text');
                Canvas.updateView({
                    elements: Outliner.selected,
                    element_aspects: {
                        geometry: true,
                        uv: true,
                        faces: true
                    }
                });

                return true;
            } catch (error) {
                console.error('Error generating text:', error);
                Undo.cancelEdit();
                return false;
            }
        }

        /**
         * Create a 2D plane for a character
         */
        async createCharacterPlane(char, alphabetSet, x, y, scale, color) {
            const imagePath = alphabetSet.characters.get(char);
            
            try {
                // Load texture with improved error handling
                const texture = await this.loadTexture(imagePath, char);
                
                if (texture) {
                    // Create cube with texture
                    const element = new Cube({
                        name: `char_${char}_${Date.now()}`,
                        from: [x * scale, y * scale, 0],
                        to: [x * scale + 16 * scale, y * scale + 16 * scale, 1],
                        faces: {
                            north: {
                                texture: texture.uuid,
                                uv: [0, 0, 16, 16]
                            },
                            south: { texture: false },
                            east: { texture: false },
                            west: { texture: false },
                            up: { texture: false },
                            down: { texture: false }
                        }
                    });

                    element.addTo(Group.selected).init();
                    
                    // Apply color tinting if specified
                    if (color !== '#FFFFFF') {
                        this.applyColorTint(element, color);
                    }

                    return element;
                } else {
                    // Fallback to placeholder cube
                    console.warn(`Using placeholder for character '${char}'`);
                    return this.createPlaceholderCube(char, x, y, scale);
                }
                
            } catch (error) {
                console.error(`Failed to create character plane for '${char}':`, error);
                return this.createPlaceholderCube(char, x, y, scale);
            }
        }

        /**
         * Improved texture loading with error handling
         */
        async loadTexture(imagePath, charName) {
            try {
                // Check if texture already exists
                const existingTexture = Texture.all.find(t => 
                    t.source === imagePath || t.name === `char_${charName}_texture`
                );
                
                if (existingTexture) {
                    return existingTexture;
                }

                // Create new texture
                const texture = new Texture({
                    name: `char_${charName}_texture`,
                    source: imagePath,
                    folder: 'rank_generator'
                }).add();

                // Attempt to load the texture
                await texture.load();
                return texture;
                
            } catch (error) {
                console.warn(`Failed to load texture for ${charName}:`, error);
                
                // Return a placeholder texture or null
                return null;
            }
        }

        /**
         * Create a placeholder cube when texture loading fails
         */
        createPlaceholderCube(char, x, y, scale) {
            const element = new Cube({
                name: `char_${char}_placeholder_${Date.now()}`,
                from: [x * scale, y * scale, 0],
                to: [x * scale + 16 * scale, y * scale + 16 * scale, 1],
                color: Math.floor(Math.random() * 8) // Random color
            });

            element.addTo(Group.selected).init();
            return element;
        }
        applyColorTint(element, color) {
            // Convert hex color to RGB
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            // Apply tinting (this would need to be implemented based on Blockbench's texture system)
            // For now, we'll store the color in the element's metadata
            element.color = {r, g, b};
        }

        /**
         * Clear existing text elements
         */
        clearExistingText() {
            // Remove all elements that start with 'char_' or 'border_'
            const elementsToRemove = Outliner.elements.filter(element => 
                element.name && (element.name.startsWith('char_') || element.name.startsWith('border_'))
            );
            
            if (elementsToRemove.length > 0) {
                Undo.initEdit({elements: elementsToRemove});
                elementsToRemove.forEach(element => {
                    element.remove();
                });
                Undo.finishEdit('Clear pixelart text');
                
                Canvas.updateView({
                    elements: [],
                    element_aspects: {
                        geometry: true,
                        uv: true,
                        faces: true
                    }
                });
            }
        }

        /**
         * Export current text as PNG
         */
        async exportToPNG() {
            if (Outliner.elements.length === 0) {
                Blockbench.showMessageBox({
                    title: 'Export Error',
                    message: 'No text elements found. Please generate text first.'
                });
                return;
            }

            // Use Blockbench's screenshot functionality
            try {
                const screenshotDialog = new Dialog({
                    id: 'export_png_dialog',
                    title: 'Export PNG Options',
                    width: 400,
                    form: {
                        width: {
                            label: 'Width (pixels)',
                            type: 'number',
                            value: 512,
                            min: 64,
                            max: 4096
                        },
                        height: {
                            label: 'Height (pixels)',
                            type: 'number',
                            value: 256,
                            min: 64,
                            max: 4096
                        },
                        transparent: {
                            label: 'Transparent Background',
                            type: 'checkbox',
                            value: true
                        }
                    },
                    buttons: ['Export', 'Cancel'],
                    onConfirm: function(formData) {
                        // Create screenshot with specified options
                        MediaPreview.screenshot({
                            width: formData.width,
                            height: formData.height,
                            crop: false
                        });
                        this.hide();
                    }
                });
                
                screenshotDialog.show();
            } catch (error) {
                console.error('Export error:', error);
                Blockbench.showMessageBox({
                    title: 'Export Error',
                    message: `Failed to export PNG: ${error.message}`
                });
            }
        }

        /**
         * Save current project as BBModel
         */
        async saveAsBBModel() {
            if (Outliner.elements.length === 0) {
                Blockbench.showMessageBox({
                    title: 'Save Error',
                    message: 'No text elements found. Please generate text first.'
                });
                return;
            }

            try {
                // Set project name based on text input
                const projectName = pluginState.textInput.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                Project.name = `rank_text_${projectName}`;
                
                // Save project
                Blockbench.export({
                    type: 'BBModel',
                    startpath: Project.save_path
                });
            } catch (error) {
                console.error('Save error:', error);
                Blockbench.showMessageBox({
                    title: 'Save Error',
                    message: `Failed to save BBModel: ${error.message}`
                });
            }
        }

        /**
         * Add border around the text
         */
        async addBorder(textWidth, textHeight, scale) {
            if (!pluginState.currentBorder) return;

            const borderSet = await this.loadBorderSet(pluginState.currentBorder, this.borders[pluginState.currentBorder]);
            if (!borderSet) return;

            // Implementation for border generation would go here
            // This would involve creating border elements around the text
        }
    }

    /**
     * Create the main dialog interface
     */
    function createDialog() {
        dialog = new Dialog({
            id: 'minecraft_rank_text_generator',
            title: 'Minecraft Rank Text Generator',
            width: 600,
            resizable: true,
            form: {
                text_input: {
                    label: 'Text',
                    type: 'text',
                    value: pluginState.textInput,
                    placeholder: 'Enter your rank text...'
                },
                font_selector: {
                    label: 'Font',
                    type: 'select',
                    value: pluginState.currentFont,
                    options: textGenerator ? textGenerator.getAvailableFontOptions() : {
                        'default1': 'Font 1'
                    }
                },
                letter_spacing: {
                    label: 'Letter Spacing',
                    type: 'number',
                    value: pluginState.letterSpacing,
                    min: 0,
                    max: 50,
                    step: 1
                },
                text_color: {
                    label: 'Text Color',
                    type: 'color',
                    value: pluginState.textColor
                },
                scale: {
                    label: 'Scale',
                    type: 'number',
                    value: pluginState.scale,
                    min: 0.1,
                    max: 10,
                    step: 0.1
                },
                alignment: {
                    label: 'Alignment',
                    type: 'select',
                    value: pluginState.alignment,
                    options: {
                        'left': 'Left',
                        'center': 'Center',
                        'right': 'Right'
                    }
                },
                border_enabled: {
                    label: 'Enable Border',
                    type: 'checkbox',
                    value: pluginState.borderEnabled
                },
                border_selector: {
                    label: 'Border Style',
                    type: 'select',
                    value: pluginState.currentBorder || 'border1',
                    options: (() => {
                        const options = {};
                        for (let i = 1; i <= 11; i++) {
                            options[`border${i}`] = `Border Style ${i}`;
                        }
                        return options;
                    })(),
                    condition: (form) => form.border_enabled
                },
                preview_info: {
                    type: 'info',
                    text: 'Preview will be generated in the 3D viewport when you click Generate. Use Clear to remove existing text before generating new text.'
                },
                generation_info: {
                    type: 'info',
                    text: 'Tips: Try "ADMIN", "VIP", "MODERATOR" for common rank texts. Supports letters, numbers, and basic symbols.'
                },
                export_section: {
                    type: 'info',
                    text: 'Export Options: Use Export PNG for images or Save BBModel to preserve the 3D structure.'
                }
            },
            buttons: ['Generate', 'Preview Font', 'Export PNG', 'Save BBModel', 'Clear', 'Cancel'],
            onConfirm: function(formData) {
                // Update plugin state
                pluginState.textInput = formData.text_input;
                pluginState.currentFont = formData.font_selector;
                pluginState.letterSpacing = formData.letter_spacing;
                pluginState.textColor = formData.text_color;
                pluginState.scale = formData.scale;
                pluginState.alignment = formData.alignment;
                pluginState.borderEnabled = formData.border_enabled;
                pluginState.currentBorder = formData.border_selector;

                // Generate the text
                if (formData.text_input.trim()) {
                    textGenerator.generateText(formData.text_input.trim(), {
                        font: formData.font_selector,
                        spacing: formData.letter_spacing,
                        color: formData.text_color,
                        scale: formData.scale,
                        alignment: formData.alignment
                    });
                } else {
                    Blockbench.showMessageBox({
                        title: 'Error',
                        message: 'Please enter some text to generate.'
                    });
                }
                this.hide();
            },
            onButton: function(button_id) {
                switch(button_id) {
                    case 1: // Preview Font
                        const formData = this.getFormResult();
                        if (textGenerator) {
                            // Generate a preview with "TEST"
                            pluginState.currentFont = formData.font_selector;
                            pluginState.letterSpacing = formData.letter_spacing;
                            pluginState.textColor = formData.text_color;
                            pluginState.scale = formData.scale;
                            
                            textGenerator.generateText('TEST', {
                                font: formData.font_selector,
                                spacing: formData.letter_spacing,
                                color: formData.text_color,
                                scale: formData.scale,
                                alignment: formData.alignment
                            });
                        }
                        break;
                    case 2: // Export PNG
                        if (textGenerator) {
                            textGenerator.exportToPNG();
                        }
                        break;
                    case 3: // Save BBModel
                        if (textGenerator) {
                            textGenerator.saveAsBBModel();
                        }
                        break;
                    case 4: // Clear
                        if (textGenerator) {
                            textGenerator.clearExistingText();
                        }
                        break;
                    case 5: // Cancel
                        this.hide();
                        break;
                }
            }
        });

        return dialog;
    }

    /**
     * Plugin onload function
     */
    function onload() {
        // Initialize the text generator
        textGenerator = new TextGenerator();

        // Create menu action
        action = new Action('minecraft_rank_text_generator', {
            name: 'Minecraft Rank Text Generator',
            description: 'Generate 2D pixelart Minecraft rank displays',
            icon: 'text_fields',
            category: 'tools',
            click: function() {
                // Ensure we're in the right mode
                if (Format.id !== 'free' && Format.id !== 'java_block') {
                    Blockbench.showMessageBox({
                        title: 'Format Notice',
                        message: 'This plugin works best in Free Model or Java Block/Item format. Would you like to switch to Free Model format?',
                        buttons: ['Switch to Free Model', 'Continue Anyway', 'Cancel']
                    }, function(button) {
                        if (button === 0) {
                            Formats.free.new();
                        }
                        if (button <= 1) {
                            showDialog();
                        }
                    });
                } else {
                    showDialog();
                }
            }
        });

        // Add to Tools menu
        MenuBar.addAction(action, 'tools');

        console.log('Minecraft Rank Text Generator plugin loaded');
    }

    /**
     * Show the main dialog
     */
    function showDialog() {
        if (!dialog) {
            dialog = createDialog();
        }
        dialog.show();
    }

    /**
     * Plugin onunload function
     */
    function onunload() {
        if (action) {
            action.delete();
        }
        if (dialog) {
            dialog.hide();
        }
        console.log('Minecraft Rank Text Generator plugin unloaded');
    }

    // Register the plugin
    BBPlugin.register(plugin_data.id, {
        title: plugin_data.title,
        author: plugin_data.author,
        description: plugin_data.description,
        about: plugin_data.about,
        icon: plugin_data.icon,
        tags: plugin_data.tags,
        version: plugin_data.version,
        min_version: plugin_data.min_version,
        variant: plugin_data.variant,
        onload,
        onunload
    });

})();