/**
 * Light Native HTML5 Canvas Chart Rendering Engine
 */
class CustomChartEngine {
    static drawLineChart(canvasId, labels, dataPoints, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        this.resizeCanvas(canvas);

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        const maxVal = Math.max(...dataPoints, 1);
        const minVal = 0;

        // Draw Axis Lines
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        if (dataPoints.length === 0) return;

        // Draw Area Fill
        const stepX = graphWidth / Math.max(dataPoints.length - 1, 1);
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);

        dataPoints.forEach((val, idx) => {
            const x = padding + idx * stepX;
            const y = height - padding - ((val - minVal) / (maxVal - minVal)) * graphHeight;
            ctx.lineTo(x, y);
        });

        ctx.lineTo(padding + (dataPoints.length - 1) * stepX, height - padding);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, padding, 0, height - padding);
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw Main Trend Line
        ctx.beginPath();
        dataPoints.forEach((val, idx) => {
            const x = padding + idx * stepX;
            const y = height - padding - ((val - minVal) / (maxVal - minVal)) * graphHeight;
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    static drawBarChart(canvasId, labels, dataPoints) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        this.resizeCanvas(canvas);

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        const maxVal = Math.max(...dataPoints, 1);
        const barWidth = (graphWidth / Math.max(dataPoints.length, 1)) * 0.6;
        const gap = (graphWidth / Math.max(dataPoints.length, 1)) * 0.4;

        dataPoints.forEach((val, idx) => {
            const barH = (val / maxVal) * graphHeight;
            const x = padding + idx * (barWidth + gap) + gap / 2;
            const y = height - padding - barH;

            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(x, y, barWidth, barH);
        });
    }

    static drawDonutChart(canvasId, labels, dataPoints) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        this.resizeCanvas(canvas);

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const total = dataPoints.reduce((a, b) => a + b, 0);
        if (total === 0) return;

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;

        let startAngle = 0;
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

        dataPoints.forEach((val, idx) => {
            const sliceAngle = (val / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.arc(centerX, centerY, radius * 0.55, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();

            ctx.fillStyle = colors[idx % colors.length];
            ctx.fill();

            startAngle += sliceAngle;
        });
    }

    static drawScatterPlot(canvasId, dataPoints) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        this.resizeCanvas(canvas);

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        ctx.fillStyle = '#10b981';
        dataPoints.forEach(pt => {
            const x = padding + (pt.x / 100) * graphWidth;
            const y = height - padding - (pt.y / 100) * graphHeight;

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    static drawRadarChart(canvasId, labels, dataPoints) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        this.resizeCanvas(canvas);

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 30;
        const numSides = Math.max(labels.length, 3);
        const angleStep = (Math.PI * 2) / numSides;

        // Draw web levels
        ctx.strokeStyle = '#334155';
        for (let level = 1; level <= 4; level++) {
            const r = (radius / 4) * level;
            ctx.beginPath();
            for (let i = 0; i < numSides; i++) {
                const x = centerX + r * Math.cos(i * angleStep - Math.PI / 2);
                const y = centerY + r * Math.sin(i * angleStep - Math.PI / 2);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw radar filled area
        ctx.beginPath();
        const maxVal = Math.max(...dataPoints, 1);
        dataPoints.forEach((val, i) => {
            const r = (val / maxVal) * radius;
            const x = centerX + r * Math.cos(i * angleStep - Math.PI / 2);
            const y = centerY + r * Math.sin(i * angleStep - Math.PI / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    static resizeCanvas(canvas) {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width || 400;
        canvas.height = rect.height || 300;
    }
}
