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
        
        // Add export buttons
        this.createExportButtons();
        
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
        const downloadButton = document.querySelector('button[onclick="downloadImage()"]');
        if (downloadButton) {
            downloadButton.removeAttribute('onclick');
            downloadButton.addEventListener('click', () => this.downloadImage('png'));
            
            // Create button group
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'button-group';
            
            // Move existing download button to group
            downloadButton.parentNode.insertBefore(buttonGroup, downloadButton);
            buttonGroup.appendChild(downloadButton);
            
            // Add SVG export button
            const svgButton = this.createExportButton('SVG', this.getSvgIcon(), () => this.downloadImage('svg'));
            buttonGroup.appendChild(svgButton);
            
            // Add WebP export button
            const webpButton = this.createExportButton('WebP', this.getImageIcon(), () => this.downloadImage('webp'));
            buttonGroup.appendChild(webpButton);
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
        return `<svg fill="white" viewBox="0 0 24 24" width="45px" height="45px"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`;
    }

    getImageIcon() {
        return `<svg fill="white" viewBox="0 0 24 24" width="45px" height="45px"><path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/></svg>`;
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