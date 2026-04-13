class TreeRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nodeRadius = 20;
        this.levelHeight = 72;
        this.leafSpacing = 54;
        this.fontSize = 15;
    }

    render(root) {
        if (!root) return;
        this._leafCounter = 0;
        this._computePositions(root, 0);
        const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        this._collectBounds(root, bounds);

        const pad = this.nodeRadius + 30;
        const w = bounds.maxX - bounds.minX + pad * 2;
        const h = bounds.maxY - bounds.minY + pad * 2;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.clearRect(0, 0, w, h);

        const ox = -bounds.minX + pad;
        const oy = -bounds.minY + pad;

        this._drawEdges(root, ox, oy);
        this._drawNodes(root, ox, oy);
    }

    _computePositions(node, depth) {
        node._y = depth * this.levelHeight;

        if (node.children.length === 0) {
            node._x = this._leafCounter * this.leafSpacing;
            this._leafCounter++;
            return;
        }

        for (const child of node.children) {
            this._computePositions(child, depth + 1);
        }

        const first = node.children[0];
        const last = node.children[node.children.length - 1];
        node._x = (first._x + last._x) / 2;
    }

    _collectBounds(node, b) {
        if (node._x < b.minX) b.minX = node._x;
        if (node._x > b.maxX) b.maxX = node._x;
        if (node._y < b.minY) b.minY = node._y;
        if (node._y > b.maxY) b.maxY = node._y;
        for (const child of node.children) {
            this._collectBounds(child, b);
        }
    }

    _drawEdges(node, ox, oy) {
        const x1 = node._x + ox;
        const y1 = node._y + oy;

        for (const child of node.children) {
            const x2 = child._x + ox;
            const y2 = child._y + oy;

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1 + this.nodeRadius);
            this.ctx.lineTo(x2, y2 - this.nodeRadius);
            this.ctx.strokeStyle = '#45475a';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            this._drawEdges(child, ox, oy);
        }
    }

    _drawNodes(node, ox, oy) {
        const x = node._x + ox;
        const y = node._y + oy;
        const r = this.nodeRadius;
        const size = r * 2;

        if (node.symbol === 'ε') {
            this.ctx.fillStyle = '#313244';
            this.ctx.strokeStyle = '#585b70';
        } else if (node.isTerminal) {
            this.ctx.fillStyle = '#1e3a2a';
            this.ctx.strokeStyle = '#a6e3a1';
        } else {
            this.ctx.fillStyle = '#1e2a40';
            this.ctx.strokeStyle = '#89b4fa';
        }

        this.ctx.fillRect(x - r, y - r, size, size);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - r, y - r, size, size);
        this.ctx.fillStyle = '#cdd6f4';
        this.ctx.font = `bold ${this.fontSize}px 'JetBrains Mono', Consolas, 'Courier New', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.symbol, x, y);

        for (const child of node.children) {
            this._drawNodes(child, ox, oy);
        }
    }
}
