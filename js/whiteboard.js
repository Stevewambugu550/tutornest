// Interactive Whiteboard Functionality
class Whiteboard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.currentLineWidth = 2;
        this.history = [];
        this.historyIndex = -1;
        
        this.setupCanvas();
        this.attachEventListeners();
        this.saveState();
    }
    
    setupCanvas() {
        // Set canvas size
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Set default styles
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Clear canvas with white background
        this.clear();
    }
    
    attachEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.currentLineWidth * 3;
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentLineWidth;
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        } else if (this.currentTool === 'text') {
            // Text tool handled separately
            this.stopDrawing();
            this.addText(x, y);
        }
    }
    
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }
    
    addText(x, y) {
        const text = prompt('Enter text:');
        if (text) {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.font = `${this.currentLineWidth * 10}px Arial`;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.fillText(text, x, y);
            this.saveState();
        }
    }
    
    clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
    }
    
    setTool(tool) {
        this.currentTool = tool;
        this.canvas.style.cursor = tool === 'eraser' ? 'crosshair' : 'default';
    }
    
    setColor(color) {
        this.currentColor = color;
    }
    
    setLineWidth(width) {
        this.currentLineWidth = width;
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState();
        }
    }
    
    saveState() {
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add new state
        this.history.push(this.canvas.toDataURL());
        this.historyIndex++;
        
        // Limit history to 50 states
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }
    
    restoreState() {
        const img = new Image();
        img.src = this.history[this.historyIndex];
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
    }
    
    download() {
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Initialize whiteboard when modal is opened
let whiteboard = null;

function openWhiteboard() {
    const modal = document.getElementById('whiteboardModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Initialize whiteboard if not already done
        if (!whiteboard) {
            whiteboard = new Whiteboard('whiteboardCanvas');
            
            // Set up tool buttons
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tool = btn.dataset.tool;
                    whiteboard.setTool(tool);
                    
                    // Update active state
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });
            
            // Set up color picker
            const colorPicker = document.getElementById('colorPicker');
            if (colorPicker) {
                colorPicker.addEventListener('change', (e) => {
                    whiteboard.setColor(e.target.value);
                });
            }
            
            // Set up line width slider
            const lineWidth = document.getElementById('lineWidth');
            if (lineWidth) {
                lineWidth.addEventListener('input', (e) => {
                    whiteboard.setLineWidth(e.target.value);
                });
            }
            
            // Set up action buttons
            document.getElementById('clearBtn')?.addEventListener('click', () => {
                if (confirm('Clear the entire whiteboard?')) {
                    whiteboard.clear();
                }
            });
            
            document.getElementById('undoBtn')?.addEventListener('click', () => {
                whiteboard.undo();
            });
            
            document.getElementById('redoBtn')?.addEventListener('click', () => {
                whiteboard.redo();
            });
            
            document.getElementById('downloadBtn')?.addEventListener('click', () => {
                whiteboard.download();
            });
        }
    }
}

function closeWhiteboard() {
    const modal = document.getElementById('whiteboardModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Export for use in other modules
window.Whiteboard = Whiteboard;
window.openWhiteboard = openWhiteboard;
window.closeWhiteboard = closeWhiteboard;
