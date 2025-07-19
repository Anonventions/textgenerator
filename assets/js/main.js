/**
 * Text Image Generator - Main JavaScript Module
 * Enhanced version with modern features and optimizations
 */

class TextImageGenerator {
    constructor() {
        this.fonts = this.initializeFonts();
        this.currentFont = 'default1';
        this.imageCache = new Map();
        this.letterSpacing = 10;
        this.isLoading = false;
        this.theme = this.getInitialTheme();
        
        // Performance optimization
        this.updatePreview = this.debounce(this.updatePreview.bind(this), 150);
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupTheme();
        this.preloadDefaultFont();
        
        // Initialize with default font
        this.updateFont();
        
        console.log('Text Image Generator initialized');
    }

    /**
     * Initialize font configuration
     */
    initializeFonts() {
        const fonts = {
            'default1': './alphabet/',
        };
        for (let i = 2; i <= 30; i++) {
            fonts[`default${i}`] = `./alphabet${i}/`;
        }
        return fonts;
    }

    /**
     * Setup DOM elements and populate font selector
     */
    setupDOM() {
        const selectElement = document.getElementById('fontInput');
        if (selectElement) {
            Object.keys(this.fonts).forEach((key, index) => {
                const option = document.createElement('option');
                option.value = key;
                option.text = `Font ${index + 1}`;
                selectElement.appendChild(option);
            });
            selectElement.value = this.currentFont;
        }

        // Add theme toggle button
        this.createThemeToggle();
        
        // Add export buttons after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.createExportButtons();
        }, 100);
        
        // Add loading indicator
        this.createLoadingIndicator();
    }

    /**
     * Create theme toggle button
     */
    createThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.title = 'Toggle theme';
        themeToggle.setAttribute('aria-label', 'Toggle light/dark theme');
        
        const icon = this.theme === 'dark' ? this.getMoonIcon() : this.getSunIcon();
        themeToggle.innerHTML = icon;
        
        themeToggle.addEventListener('click', () => this.toggleTheme());
        document.body.appendChild(themeToggle);
        
        this.themeToggleButton = themeToggle;
    }

    /**
     * Create additional export buttons
     */
    createExportButtons() {
        const buttonGroup = document.querySelector('.button-group');
        if (buttonGroup) {
            buttonGroup.innerHTML = `
                <button class="export-btn primary" title="Download as PNG" aria-label="Download as PNG">
                    ${this.getDownloadIcon()}
                    PNG
                </button>
                <button class="export-btn secondary" title="Download as SVG" aria-label="Download as SVG">
                    ${this.getSvgIcon()}
                    SVG
                </button>
                <button class="export-btn secondary" title="Download as WebP" aria-label="Download as WebP">
                    ${this.getImageIcon()}
                    WebP
                </button>
                <button class="export-btn secondary" title="Export as GIF" aria-label="Export as GIF">
                    ${this.getGifIcon()}
                    GIF
                </button>
            `;
            
            // Add event listeners
            const buttons = buttonGroup.querySelectorAll('.export-btn');
            buttons[0].addEventListener('click', () => this.downloadImage('png'));
            buttons[1].addEventListener('click', () => this.downloadImage('svg'));
            buttons[2].addEventListener('click', () => this.downloadImage('webp'));
            buttons[3].addEventListener('click', () => this.showGifPreviewDialog());
        }
    }

    /**
     * Create export button
     */
    createExportButton(format, icon, handler) {
        const button = document.createElement('button');
        button.title = `Download as ${format}`;
        button.setAttribute('aria-label', `Download as ${format}`);
        button.innerHTML = icon;
        button.addEventListener('click', handler);
        return button;
    }

    /**
     * Create loading indicator
     */
    createLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.className = 'loading-indicator';
        loadingDiv.style.display = 'none';
        loadingDiv.innerHTML = '<div class="spinner"></div><span>Loading...</span>';
        document.body.appendChild(loadingDiv);
        
        this.loadingIndicator = loadingDiv;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const textInput = document.getElementById('textInput');
        const fontInput = document.getElementById('fontInput');
        const spacingInput = document.getElementById('spacingInput');

        if (textInput) {
            textInput.addEventListener('input', () => this.updatePreview());
            textInput.addEventListener('paste', (e) => this.handlePaste(e));
        }

        if (fontInput) {
            fontInput.addEventListener('change', () => this.updateFont());
        }

        if (spacingInput) {
            spacingInput.addEventListener('input', () => this.updateSpacing());
        }

        // Error handling for failed image loads
        window.addEventListener('error', (e) => this.handleError(e));
        
        // Performance monitoring
        window.addEventListener('load', () => this.trackPerformance());
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + D: Download PNG
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.downloadImage('png');
            }
            
            // Ctrl/Cmd + S: Download SVG
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.downloadImage('svg');
            }
            
            // Ctrl/Cmd + T: Toggle theme
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Escape: Clear text
            if (e.key === 'Escape') {
                const textInput = document.getElementById('textInput');
                if (textInput && !textInput.value) {
                    textInput.focus();
                }
            }
        });
    }

    /**
     * Setup theme system
     */
    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (localStorage.getItem('textgen-theme') === null) {
                    this.theme = e.matches ? 'dark' : 'light';
                    this.updateTheme();
                }
            });
        }
    }

    /**
     * Get initial theme preference
     */
    getInitialTheme() {
        // Check localStorage first
        const savedTheme = localStorage.getItem('textgen-theme');
        if (savedTheme) {
            return savedTheme;
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.updateTheme();
        localStorage.setItem('textgen-theme', this.theme);
    }

    /**
     * Update theme
     */
    updateTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        if (this.themeToggleButton) {
            const icon = this.theme === 'dark' ? this.getMoonIcon() : this.getSunIcon();
            this.themeToggleButton.innerHTML = icon;
        }
        
        // Update canvas background for theme
        this.updatePreview();
    }

    /**
     * Preload default font for better performance
     */
    async preloadDefaultFont() {
        const commonLetters = 'abcdefghijklmnopqrstuvwxyz';
        const promises = Array.from(commonLetters).map(letter => 
            this.loadImage(letter).catch(() => null) // Ignore errors for preloading
        );
        
        try {
            await Promise.all(promises);
            console.log('Default font preloaded');
        } catch (error) {
            console.warn('Font preloading failed:', error);
        }
    }

    /**
     * Load image with caching and error handling
     */
    async loadImage(letter) {
        const cacheKey = `${this.currentFont}-${letter}`;
        
        // Return cached image if available
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout loading image for letter: ${letter}`));
            }, 5000);
            
            img.onload = () => {
                clearTimeout(timeout);
                this.imageCache.set(cacheKey, img);
                resolve(img);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                console.warn(`Failed to load image for letter: ${letter}`);
                reject(new Error(`Failed to load image for letter: ${letter}`));
            };
            
            img.src = `${this.fonts[this.currentFont]}${letter.toLowerCase()}.png`;
        });
    }

    /**
     * Update font selection
     */
    updateFont() {
        const fontInput = document.getElementById('fontInput');
        if (fontInput) {
            this.currentFont = fontInput.value;
            
            // Clear cache for old font
            this.imageCache.clear();
            
            // Update preview
            this.updatePreview();
            
            // Preload new font
            this.preloadDefaultFont();
        }
    }

    /**
     * Update letter spacing
     */
    updateSpacing() {
        const spacingInput = document.getElementById('spacingInput');
        if (spacingInput) {
            this.letterSpacing = parseInt(spacingInput.value);
            this.updatePreview();
        }
    }

    /**
     * Update preview with performance optimization
     */
    async updatePreview() {
        if (this.isLoading) return;
        
        const textInput = document.getElementById('textInput');
        const canvas = document.getElementById('imagePreview');
        
        if (textInput && canvas) {
            await this.generateImage(textInput.value, canvas);
        }
    }

    /**
     * Generate image with optimization
     */
    async generateImage(text, canvas, isDownload = false) {
        if (!text.trim()) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        this.setLoading(true);
        
        try {
            const ctx = canvas.getContext('2d');
            const letters = Array.from(text.toLowerCase()).filter(char => char.match(/[a-z]/));
            
            if (letters.length === 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            // Load all images first
            const imagePromises = letters.map(letter => this.loadImage(letter));
            const images = await Promise.allSettled(imagePromises);
            
            // Calculate dimensions
            let totalWidth = 0;
            let maxHeight = 0;
            
            const validImages = images
                .map((result, index) => ({ 
                    result, 
                    letter: letters[index] 
                }))
                .filter(({ result }) => result.status === 'fulfilled')
                .map(({ result, letter }) => {
                    const img = result.value;
                    totalWidth += img.width + this.letterSpacing;
                    maxHeight = Math.max(maxHeight, img.height);
                    return { img, letter };
                });

            if (validImages.length === 0) {
                throw new Error('No valid images could be loaded');
            }

            // Remove final spacing
            totalWidth -= this.letterSpacing;

            // Set canvas size
            canvas.width = Math.max(totalWidth, 1);
            canvas.height = Math.max(maxHeight, 1);

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw images using requestAnimationFrame for smooth rendering
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    let x = 0;
                    validImages.forEach(({ img }) => {
                        ctx.drawImage(img, x, 0, img.width, img.height);
                        x += img.width + this.letterSpacing;
                    });
                    resolve();
                });
            });

        } catch (error) {
            console.error('Error generating image:', error);
            this.showError('Failed to generate image. Please try a different font or text.');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Download image in specified format
     */
    async downloadImage(format = 'png') {
        const textInput = document.getElementById('textInput');
        if (!textInput || !textInput.value.trim()) {
            this.showError('Please enter some text first');
            return;
        }

        this.setLoading(true);
        
        try {
            const canvas = document.getElementById('downloadCanvas');
            await this.generateImage(textInput.value, canvas, true);
            
            let dataUrl, filename;
            
            switch (format.toLowerCase()) {
                case 'svg':
                    dataUrl = await this.canvasToSVG(canvas);
                    filename = 'text-image.svg';
                    break;
                case 'webp':
                    dataUrl = canvas.toDataURL('image/webp', 0.9);
                    filename = 'text-image.webp';
                    break;
                default:
                    dataUrl = canvas.toDataURL('image/png');
                    filename = 'text-image.png';
            }
            
            this.downloadFile(dataUrl, filename);
            this.showSuccess(`Downloaded as ${format.toUpperCase()}`);
            
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Failed to download image');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Convert canvas to SVG
     */
    async canvasToSVG(canvas) {
        const svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
                <image href="${canvas.toDataURL()}" width="${canvas.width}" height="${canvas.height}"/>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svgContent);
    }

    /**
     * Download file helper
     */
    downloadFile(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Handle paste events
     */
    handlePaste(event) {
        // Allow default paste behavior
        setTimeout(() => this.updatePreview(), 0);
    }

    /**
     * Handle errors
     */
    handleError(error) {
        console.error('Application error:', error);
        this.showError('An unexpected error occurred');
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        const textInput = document.getElementById('textInput');
        
        if (loading) {
            textInput?.classList.add('loading');
        } else {
            textInput?.classList.remove('loading');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show message with auto-hide
     */
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.toast-message');
        existingMessages.forEach(msg => msg.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'error':
                toast.style.backgroundColor = '#ff6b6b';
                break;
            case 'success':
                toast.style.backgroundColor = '#51cf66';
                break;
            default:
                toast.style.backgroundColor = '#339af0';
        }
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Track performance metrics
     */
    trackPerformance() {
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Performance metrics:', {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domReady: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                totalTime: perfData.loadEventEnd - perfData.fetchStart
            });
        }
    }

    /**
     * Debounce function for performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Icon methods
    getSunIcon() {
        return `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path></svg>`;
    }

    getMoonIcon() {
        return `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>`;
    }

    getSvgIcon() {
        return `<svg fill="white" viewBox="0 0 24 24" width="24px" height="24px"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`;
    }

    getImageIcon() {
        return `<svg fill="white" viewBox="0 0 24 24" width="24px" height="24px"><path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/></svg>`;
    }

    getDownloadIcon() {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24px" height="24px">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-7 13v-6h2v6h-2zm-7-2h14v2H5z"/>
        </svg>`;
    }

    getGifIcon() {
        return `<svg fill="white" viewBox="0 0 24 24" width="24px" height="24px"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7,7H9V9H7V7M15,7H17V9H15V7M12,17.5C9.67,17.5 7.69,16.04 6.89,14H17.11C16.31,16.04 14.33,17.5 12,17.5Z"/></svg>`;
    }

    /**
     * Show GIF preview dialog with positioning and sizing options
     */
    showGifPreviewDialog() {
        const textInput = document.getElementById('textInput');
        if (!textInput || !textInput.value.trim()) {
            this.showError('Please enter some text first');
            return;
        }

        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'gif-preview-modal';
        modal.innerHTML = `
            <div class="gif-preview-content">
                <div class="gif-preview-header">
                    <h3>GIF Export Preview</h3>
                    <button class="close-btn" aria-label="Close dialog">&times;</button>
                </div>
                <div class="gif-preview-body">
                    <div class="gif-preview-canvas-container">
                        <canvas id="gifPreviewCanvas" class="gif-preview-canvas"></canvas>
                        <div class="gif-positioning-overlay"></div>
                    </div>
                    <div class="gif-controls">
                        <div class="control-group">
                            <label for="gifWidth">Width:</label>
                            <input type="number" id="gifWidth" min="50" max="2000" value="400">
                        </div>
                        <div class="control-group">
                            <label for="gifHeight">Height:</label>
                            <input type="number" id="gifHeight" min="50" max="2000" value="200">
                        </div>
                        <div class="control-group">
                            <label for="gifScale">Scale:</label>
                            <input type="range" id="gifScale" min="0.1" max="5" step="0.1" value="1">
                            <span class="scale-value">1.0x</span>
                        </div>
                        <div class="control-group">
                            <label for="gifPosX">Position X:</label>
                            <input type="number" id="gifPosX" min="0" max="2000" value="0">
                        </div>
                        <div class="control-group">
                            <label for="gifPosY">Position Y:</label>
                            <input type="number" id="gifPosY" min="0" max="2000" value="0">
                        </div>
                        <div class="control-group">
                            <label for="gifScaling">Scaling Method:</label>
                            <select id="gifScaling">
                                <option value="nearest" selected>Nearest (Pixel Perfect)</option>
                                <option value="linear">Linear (Smooth)</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="gif-preview-footer">
                    <button class="btn secondary" id="cancelGif">Cancel</button>
                    <button class="btn primary" id="exportGif">Export GIF</button>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.appendChild(modal);

        // Setup event listeners
        this.setupGifPreviewListeners(modal);

        // Initialize preview
        this.updateGifPreview();
    }

    /**
     * Setup event listeners for GIF preview dialog
     */
    setupGifPreviewListeners(modal) {
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('#cancelGif');
        const exportBtn = modal.querySelector('#exportGif');
        const controls = modal.querySelectorAll('input, select');

        // Close dialog
        const closeDialog = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);

        // Export GIF
        exportBtn.addEventListener('click', () => {
            this.exportGif();
            closeDialog();
        });

        // Update preview on control changes
        controls.forEach(control => {
            control.addEventListener('input', () => {
                this.updateGifPreview();
                
                // Update scale display
                if (control.id === 'gifScale') {
                    const scaleValue = modal.querySelector('.scale-value');
                    scaleValue.textContent = `${parseFloat(control.value).toFixed(1)}x`;
                }
            });
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDialog();
            }
        });
    }

    /**
     * Update GIF preview canvas
     */
    async updateGifPreview() {
        const canvas = document.getElementById('gifPreviewCanvas');
        const width = parseInt(document.getElementById('gifWidth')?.value || 400);
        const height = parseInt(document.getElementById('gifHeight')?.value || 200);
        const scale = parseFloat(document.getElementById('gifScale')?.value || 1);
        const posX = parseInt(document.getElementById('gifPosX')?.value || 0);
        const posY = parseInt(document.getElementById('gifPosY')?.value || 0);
        const scaling = document.getElementById('gifScaling')?.value || 'nearest';

        if (!canvas) return;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        
        // Set scaling method
        ctx.imageSmoothingEnabled = scaling !== 'nearest';
        if (ctx.imageSmoothingEnabled) {
            ctx.imageSmoothingQuality = 'high';
        }

        // Clear canvas with background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Generate text image on temporary canvas
        const tempCanvas = document.createElement('canvas');
        const textInput = document.getElementById('textInput');
        
        if (textInput && textInput.value.trim()) {
            await this.generateImage(textInput.value, tempCanvas, true);
            
            // Draw text image with positioning and scaling
            const textWidth = tempCanvas.width * scale;
            const textHeight = tempCanvas.height * scale;
            
            ctx.drawImage(
                tempCanvas,
                posX,
                posY,
                textWidth,
                textHeight
            );
        }
    }

    /**
     * Export GIF with current settings
     */
    async exportGif() {
        this.setLoading(true);
        
        try {
            // Get settings
            const width = parseInt(document.getElementById('gifWidth')?.value || 400);
            const height = parseInt(document.getElementById('gifHeight')?.value || 200);
            const scale = parseFloat(document.getElementById('gifScale')?.value || 1);
            const posX = parseInt(document.getElementById('gifPosX')?.value || 0);
            const posY = parseInt(document.getElementById('gifPosY')?.value || 0);
            const scaling = document.getElementById('gifScaling')?.value || 'nearest';

            // Check if GIF.js is available
            if (typeof GIF === 'undefined') {
                // Fallback to PNG if GIF.js is not available
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Set scaling method
                ctx.imageSmoothingEnabled = scaling !== 'nearest';
                if (ctx.imageSmoothingEnabled) {
                    ctx.imageSmoothingQuality = 'high';
                }

                // Clear canvas with background
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, width, height);

                // Generate text image
                const tempCanvas = document.createElement('canvas');
                const textInput = document.getElementById('textInput');
                
                if (textInput && textInput.value.trim()) {
                    await this.generateImage(textInput.value, tempCanvas, true);
                    
                    // Draw text image with positioning and scaling
                    const textWidth = tempCanvas.width * scale;
                    const textHeight = tempCanvas.height * scale;
                    
                    ctx.drawImage(
                        tempCanvas,
                        posX,
                        posY,
                        textWidth,
                        textHeight
                    );
                }

                const dataUrl = canvas.toDataURL('image/png');
                this.downloadFile(dataUrl, 'text-image.png');
                this.showSuccess('Exported as PNG (GIF library not available)');
                return;
            }

            // Create GIF using GIF.js
            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: width,
                height: height,
                workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
            });

            // Create canvas for GIF frame
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Set scaling method
            ctx.imageSmoothingEnabled = scaling !== 'nearest';
            if (ctx.imageSmoothingEnabled) {
                ctx.imageSmoothingQuality = 'high';
            }

            // Clear canvas with background
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);

            // Generate text image
            const tempCanvas = document.createElement('canvas');
            const textInput = document.getElementById('textInput');
            
            if (textInput && textInput.value.trim()) {
                await this.generateImage(textInput.value, tempCanvas, true);
                
                // Draw text image with positioning and scaling
                const textWidth = tempCanvas.width * scale;
                const textHeight = tempCanvas.height * scale;
                
                ctx.drawImage(
                    tempCanvas,
                    posX,
                    posY,
                    textWidth,
                    textHeight
                );
            }

            // Add frame to GIF (static image for now)
            gif.addFrame(canvas, {delay: 1000});

            // Generate and download GIF
            gif.on('finished', (blob) => {
                const url = URL.createObjectURL(blob);
                this.downloadFile(url, 'text-image.gif');
                this.showSuccess('GIF exported successfully');
                this.setLoading(false);
            });

            gif.on('progress', (progress) => {
                // Could update progress indicator here
                console.log('GIF generation progress:', progress);
            });

            gif.render();
            
        } catch (error) {
            console.error('GIF export error:', error);
            this.showError('Failed to export GIF');
            this.setLoading(false);
        }
    }
}

// Legacy function support for backward compatibility
let textGenerator;

document.addEventListener('DOMContentLoaded', function() {
    textGenerator = new TextImageGenerator();
});

// Legacy functions for backward compatibility
function updateFont() {
    textGenerator?.updateFont();
}

function updateSpacing() {
    textGenerator?.updateSpacing();
}

function updatePreview() {
    textGenerator?.updatePreview();
}

function downloadImage() {
    textGenerator?.downloadImage('png');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextImageGenerator;
}