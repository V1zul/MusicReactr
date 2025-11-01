// Advanced Visualization Features

// Color Helper Functions
function getColor(hue = null, saturation = 70, lightness = 60, alpha = 1) {
    const h = hue !== null ? hue : colorHue * 360;
    return `hsla(${h}, ${saturation}%, ${lightness}%, ${alpha})`;
}

function getGradientColors(index, total, alpha = 1) {
    const hue = (index / total * 360 + colorRotation) % 360;
    const hue2 = ((index + 1) / total * 360 + colorRotation) % 360;
    return {
        start: getColor(hue, 70, 60, alpha),
        end: getColor(hue2, 70, 60, alpha)
    };
}

// BPM Detection
function detectBeat(stats) {
    if (!stats) return;
    
    const amplitude = stats.amplitude;
    const now = Date.now();
    
    // Simple beat detection - amplitude threshold
    if (amplitude > bpmDetector.threshold) {
        if (now - bpmDetector.lastBeat > 200) { // Minimum 200ms between beats
            bpmDetector.beatTimes.push(now);
            bpmDetector.beatCount++;
            
            // Keep only last 10 beats
            if (bpmDetector.beatTimes.length > 10) {
                bpmDetector.beatTimes.shift();
            }
            
            bpmDetector.lastBeat = now;
            
            // Calculate BPM
            if (bpmDetector.beatTimes.length >= 2) {
                const timeSpan = bpmDetector.beatTimes[bpmDetector.beatTimes.length - 1] - bpmDetector.beatTimes[0];
                const avgInterval = timeSpan / (bpmDetector.beatTimes.length - 1);
                bpmDetector.bpm = Math.round(60000 / avgInterval);
            }
            
            // Update UI
            document.getElementById('beatsValue').textContent = bpmDetector.beatCount;
            document.getElementById('bpmValue').textContent = bpmDetector.bpm + ' BPM';
            
            // Visual beat indicator
            document.querySelector('.visualizer-container').style.transform = 'scale(1.02)';
            setTimeout(() => {
                document.querySelector('.visualizer-container').style.transform = 'scale(1)';
            }, 100);
        }
    }
}

// Tunnel Visualization
let tunnelRotation = 0;
function drawTunnel(frequencyData, stats) {
    const canvas = canvases.tunnel;
    const context = ctx.tunnel;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    tunnelRotation += 0.02;
    const amplitude = stats?.amplitude || 0;
    const segments = 50;
    
    for (let i = segments; i > 0; i--) {
        const progress = i / segments;
        const radius = progress * Math.min(canvas.width, canvas.height) * 0.8;
        const nextRadius = ((i - 1) / segments) * Math.min(canvas.width, canvas.height) * 0.8;
        
        const points = 64;
        const angleStep = (Math.PI * 2) / points;
        
        context.beginPath();
        
        for (let j = 0; j <= points; j++) {
            const angle = j * angleStep + tunnelRotation + progress * Math.PI * 2;
            const dataIndex = Math.floor((j / points) * frequencyData.length);
            const value = (frequencyData[dataIndex] / 255) * (sensitivity / 100);
            const r = radius + value * radius * 0.5 * (1 - progress);
            
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            if (j === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }
        
        context.closePath();
        
        const alpha = 0.3 + (1 - progress) * 0.7 + amplitude * 0.3;
        const colors = getGradientColors(i, segments, alpha);
        const gradient = context.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius);
        gradient.addColorStop(0, colors.start);
        gradient.addColorStop(1, colors.end);
        
        context.fillStyle = gradient;
        context.fill();
        
        context.strokeStyle = getColor((i * 10 + colorRotation) % 360, 80, 70, alpha);
        context.lineWidth = 2;
        context.stroke();
    }
}

// Kaleidoscope Visualization
let kaleidoscopeRotation = 0;
function drawKaleidoscope(frequencyData, stats) {
    const canvas = canvases.kaleidoscope;
    const context = ctx.kaleidoscope;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    kaleidoscopeRotation += 0.01;
    const amplitude = stats?.amplitude || 0;
    const slices = 12;
    const sliceAngle = (Math.PI * 2) / slices;
    
    context.save();
    context.translate(centerX, centerY);
    
    for (let slice = 0; slice < slices; slice++) {
        context.save();
        context.rotate(slice * sliceAngle + kaleidoscopeRotation);
        
        const barCount = 64;
        const maxRadius = Math.min(canvas.width, canvas.height) / 2;
        
        for (let i = 0; i < barCount; i++) {
            const progress = i / barCount;
            const dataIndex = Math.floor((i / barCount) * frequencyData.length);
            const value = (frequencyData[dataIndex] / 255) * (sensitivity / 100);
            const radius = progress * maxRadius;
            const barLength = value * maxRadius * 0.3;
            
            const angle = (progress * sliceAngle) / 2;
            const x1 = Math.cos(angle) * radius;
            const y1 = Math.sin(angle) * radius;
            const x2 = Math.cos(angle) * (radius + barLength);
            const y2 = Math.sin(angle) * (radius + barLength);
            
            const hue = (i / barCount * 360 + slice * 30 + colorRotation) % 360;
            context.strokeStyle = getColor(hue, 80, 60, 0.8 + value);
            context.lineWidth = 2;
            context.shadowBlur = 15;
            context.shadowColor = getColor(hue, 80, 60, 0.8);
            
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
        }
        
        context.restore();
    }
    
    context.restore();
    context.shadowBlur = 0;
}

// Mandala Visualization
let mandalaRotation = 0;
function drawMandala(frequencyData, stats) {
    const canvas = canvases.mandala;
    const context = ctx.mandala;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    mandalaRotation += 0.005;
    const amplitude = stats?.amplitude || 0;
    const layers = 8;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2;
    
    context.save();
    context.translate(centerX, centerY);
    
    for (let layer = 0; layer < layers; layer++) {
        const layerProgress = layer / layers;
        const radius = layerProgress * maxRadius;
        const petalCount = 6 + layer * 2;
        const petalAngle = (Math.PI * 2) / petalCount;
        
        for (let petal = 0; petal < petalCount; petal++) {
            const angle = petal * petalAngle + mandalaRotation * (layer % 2 === 0 ? 1 : -1);
            const dataIndex = Math.floor((layer / layers) * frequencyData.length);
            const value = (frequencyData[dataIndex] / 255) * (sensitivity / 100);
            const petalLength = maxRadius * 0.15 * (1 - layerProgress) + value * maxRadius * 0.2;
            
            context.save();
            context.rotate(angle);
            
            const hue = (layer * 45 + petal * 30 + colorRotation) % 360;
            const gradient = context.createLinearGradient(0, 0, petalLength, 0);
            gradient.addColorStop(0, getColor(hue, 70, 60, 0.9));
            gradient.addColorStop(1, getColor((hue + 60) % 360, 70, 60, 0.3));
            
            context.fillStyle = gradient;
            context.strokeStyle = getColor(hue, 80, 70, 0.8);
            context.lineWidth = 2;
            context.shadowBlur = 20;
            context.shadowColor = getColor(hue, 80, 70, 0.6);
            
            // Draw petal
            context.beginPath();
            context.moveTo(radius, 0);
            context.quadraticCurveTo(radius + petalLength / 2, -petalLength * 0.3, radius + petalLength, 0);
            context.quadraticCurveTo(radius + petalLength / 2, petalLength * 0.3, radius, 0);
            context.closePath();
            context.fill();
            context.stroke();
            
            context.restore();
        }
    }
    
    // Center circle
    const centerRadius = maxRadius * 0.15 * (1 + amplitude);
    const centerGradient = context.createRadialGradient(0, 0, 0, 0, 0, centerRadius);
    centerGradient.addColorStop(0, getColor(colorRotation % 360, 80, 70, 0.8));
    centerGradient.addColorStop(1, getColor((colorRotation + 180) % 360, 80, 70, 0));
    
    context.fillStyle = centerGradient;
    context.beginPath();
    context.arc(0, 0, centerRadius, 0, Math.PI * 2);
    context.fill();
    
    context.restore();
    context.shadowBlur = 0;
}

// Dual View - Split screen showing two visualizations
function drawDual(frequencyData, waveformData, stats) {
    const canvas = canvases.dual;
    const context = ctx.dual;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    const halfWidth = canvas.width / 2;
    
    // Left side - Spectrum
    context.save();
    context.beginPath();
    context.rect(0, 0, halfWidth, canvas.height);
    context.clip();
    
    const barCount = 64;
    const barWidth = halfWidth / barCount;
    
    for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * frequencyData.length);
        const value = (frequencyData[dataIndex] / 255) * (sensitivity / 100) * 2;
        const barHeight = Math.max(2, value * canvas.height * 0.8);
        
        const hue = (i / barCount * 360 + colorRotation) % 360;
        const gradient = context.createLinearGradient(i * barWidth, canvas.height - barHeight, i * barWidth, canvas.height);
        gradient.addColorStop(0, getColor(hue, 80, 60, 0.9));
        gradient.addColorStop(1, getColor((hue + 60) % 360, 80, 60, 0.3));
        
        context.fillStyle = gradient;
        context.shadowBlur = 10;
        context.shadowColor = getColor(hue, 80, 60, 0.6);
        context.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
    }
    
    context.restore();
    
    // Right side - Waveform
    context.save();
    context.beginPath();
    context.rect(halfWidth, 0, halfWidth, canvas.height);
    context.clip();
    
    context.strokeStyle = getColor((colorRotation + 180) % 360, 80, 60, 0.8);
    context.lineWidth = 3;
    context.shadowBlur = 20;
    context.shadowColor = getColor((colorRotation + 180) % 360, 80, 60, 0.8);
    context.beginPath();
    
    const sliceWidth = halfWidth / waveformData.length;
    let x = halfWidth;
    
    for (let i = 0; i < waveformData.length; i++) {
        const v = waveformData[i] / 128.0;
        const y = (v * canvas.height) / 2;
        
        if (i === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
        
        x += sliceWidth;
    }
    
    context.stroke();
    
    // Mirror
    context.beginPath();
    x = halfWidth;
    for (let i = 0; i < waveformData.length; i++) {
        const v = waveformData[i] / 128.0;
        const y = canvas.height - (v * canvas.height) / 2;
        
        if (i === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
        
        x += sliceWidth;
    }
    
    context.stroke();
    context.restore();
    context.shadowBlur = 0;
}

// Interference Wave Visualization
let interferenceTime = 0;
function drawInterference(frequencyData, stats) {
    const canvas = canvases.interference;
    const context = ctx.interference;
    
    if (!canvas) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    interferenceTime += 0.02;
    const amplitude = stats?.amplitude || 0;
    
    const resolution = 8; // Increased for better performance
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Create image data for better performance
    const imageData = context.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let x = 0; x < canvas.width; x += resolution) {
        for (let y = 0; y < canvas.height; y += resolution) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
            
            // Create interference pattern
            const wave1 = Math.sin((distance / 20 + interferenceTime) * 2) * 0.5;
            const wave2 = Math.sin((distance / 15 - interferenceTime) * 2) * 0.5;
            const interference = wave1 + wave2;
            
            // Map to frequency data
            const freqIndex = Math.floor((distance / maxDist) * frequencyData.length);
            const freqValue = (frequencyData[freqIndex] / 255) * (sensitivity / 100);
            const intensity = (interference + 1) / 2 * freqValue * 2;
            
            const hue = (interferenceTime * 50 + distance * 0.5 + colorRotation) % 360;
            const alpha = Math.min(255, intensity * 255 * 0.8);
            
            // Convert HSL to RGB
            const h = hue / 360;
            const s = 0.8;
            const l = 0.6;
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x_h = c * (1 - Math.abs((h * 6) % 2 - 1));
            let r, g, b;
            
            if (h < 1/6) { r = c; g = x_h; b = 0; }
            else if (h < 2/6) { r = x_h; g = c; b = 0; }
            else if (h < 3/6) { r = 0; g = c; b = x_h; }
            else if (h < 4/6) { r = 0; g = x_h; b = c; }
            else if (h < 5/6) { r = x_h; g = 0; b = c; }
            else { r = c; g = 0; b = x_h; }
            
            const m = l - c/2;
            r = Math.round((r + m) * 255);
            g = Math.round((g + m) * 255);
            b = Math.round((b + m) * 255);
            
            // Fill square area
            for (let px = 0; px < resolution && x + px < canvas.width; px++) {
                for (let py = 0; py < resolution && y + py < canvas.height; py++) {
                    const index = ((y + py) * canvas.width + (x + px)) * 4;
                    data[index] = r;
                    data[index + 1] = g;
                    data[index + 2] = b;
                    data[index + 3] = alpha;
                }
            }
        }
    }
    
    context.putImageData(imageData, 0, 0);
    
    // Add mouse interaction
    if (mouseInteraction) {
        const mx = mouseX - centerX;
        const my = mouseY - centerY;
        const mouseDist = Math.sqrt(mx * mx + my * my);
        
        context.strokeStyle = getColor((colorRotation + 180) % 360, 100, 70, 0.6);
        context.lineWidth = 3;
        context.shadowBlur = 30;
        context.shadowColor = getColor((colorRotation + 180) % 360, 100, 70, 0.8);
        context.beginPath();
        context.arc(mouseX, mouseY, 50 + amplitude * 100, 0, Math.PI * 2);
        context.stroke();
    }
}

// Fullscreen Toggle
function toggleFullscreen() {
    const container = document.querySelector('.visualizer-container');
    
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.error('Error entering fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Screenshot
function takeScreenshot() {
    const canvas = canvases[currentMode];
    const dataURL = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = `MusicReactr-${currentMode}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
}

// Mouse Tracking
document.addEventListener('mousemove', (e) => {
    const container = document.querySelector('.visualizer-container');
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

