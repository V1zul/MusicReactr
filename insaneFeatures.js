// Fractal Storm Visualization
let fractalZoom = 1;
let fractalOffsetX = 0;
let fractalOffsetY = 0;
function drawFractal(frequencyData, stats) {
    const canvas = canvases.fractal;
    const context = ctx.fractal;
    
    if (!canvas) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    const amplitude = stats?.amplitude || 0;
    fractalZoom += 0.01 + amplitude * 0.05;
    fractalOffsetX += (amplitude * 0.1);
    fractalOffsetY += (amplitude * 0.1);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxIterations = 50; // Reduced for performance
    const step = 2; // Skip pixels for performance
    
    // Use regular drawing instead of ImageData for better performance
    for (let x = 0; x < canvas.width; x += step) {
        for (let y = 0; y < canvas.height; y += step) {
            const cx = (x - centerX) / (200 / fractalZoom) + fractalOffsetX;
            const cy = (y - centerY) / (200 / fractalZoom) + fractalOffsetY;
            
            let zx = 0;
            let zy = 0;
            let iterations = 0;
            
            while (zx * zx + zy * zy < 4 && iterations < maxIterations) {
                const temp = zx * zx - zy * zy + cx;
                zy = 2 * zx * zy + cy;
                zx = temp;
                iterations++;
            }
            
            if (iterations < maxIterations) {
                const freqIndex = Math.floor((iterations / maxIterations) * frequencyData.length);
                const freqValue = frequencyData[freqIndex] / 255;
                
                const hue = (iterations * 3 + colorRotation) % 360;
                const alpha = 0.3 + (iterations / maxIterations) * 0.7 * (0.7 + freqValue * 0.3);
                
                context.fillStyle = `hsla(${hue}, 80%, ${50 + freqValue * 30}%, ${alpha})`;
                context.fillRect(x, y, step, step);
            }
        }
    }
}

// Physics-Based Particle System with Gravity
const physicsParticles = [];
const maxPhysicsParticles = 200;

class PhysicsParticle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * (canvases.physics?.width || 800);
        this.y = Math.random() * (canvases.physics?.height || 600) * 0.3;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = Math.random() * 2;
        this.size = Math.random() * 5 + 2;
        this.mass = this.size;
        this.hue = Math.random() * 360;
        this.life = 1.0;
    }
    
    update(amplitude, bass, gravityValue) {
        const canvas = canvases.physics;
        if (!canvas) return;
        
        // Apply gravity
        this.vy += (gravityValue / 100) * 0.1;
        
        // Audio-reactive forces
        const audioForceX = Math.sin(amplitude * Math.PI * 2) * amplitude * 2;
        const audioForceY = Math.cos(bass * Math.PI) * bass * 2;
        
        this.vx += audioForceX * 0.1;
        this.vy += audioForceY * 0.1;
        
        // Velocity damping
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary collisions
        if (this.x < 0 || this.x > canvas.width) {
            this.vx *= -0.8;
            this.x = Math.max(0, Math.min(canvas.width, this.x));
        }
        
        if (this.y > canvas.height) {
            this.vy *= -0.7;
            this.y = canvas.height;
            this.vx += (Math.random() - 0.5) * 0.5;
        }
        
        if (this.y < 0) {
            this.y = 0;
            this.vy *= -0.5;
        }
        
        // Size pulsing with audio
        this.size = 2 + amplitude * 8;
        this.hue = (this.hue + 0.5) % 360;
        
        // Life decay
        this.life -= 0.002;
        if (this.life <= 0) {
            this.reset();
        }
    }
    
    draw(context) {
        context.save();
        context.globalAlpha = this.life * 0.8;
        
        const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, 1)`);
        gradient.addColorStop(1, `hsla(${this.hue}, 80%, 60%, 0)`);
        
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
        
        context.restore();
    }
}

// Initialize physics particles - will be done when physics mode is first accessed
let physicsParticlesInitialized = false;

function initPhysicsParticles() {
    if (physicsParticlesInitialized) return;
    const canvas = canvases.physics;
    if (!canvas) return;
    
    physicsParticles.length = 0;
    for (let i = 0; i < maxPhysicsParticles; i++) {
        physicsParticles.push(new PhysicsParticle());
    }
    physicsParticlesInitialized = true;
}

function drawPhysics(frequencyData, stats) {
    const canvas = canvases.physics;
    const context = ctx.physics;
    
    if (!canvas || !context) return;
    
    // Initialize particles if needed
    if (!physicsParticlesInitialized) {
        initPhysicsParticles();
    }
    
    // Fade effect
    context.fillStyle = 'rgba(10, 10, 15, 0.1)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const amplitude = stats?.amplitude || 0;
    const bass = (stats?.bass || 0) / 255;
    
    physicsParticles.forEach((particle, i) => {
        particle.update(amplitude, bass, gravity);
        particle.draw(context);
        
        // Draw connections (only check nearby particles for performance)
        physicsParticles.slice(i + 1, Math.min(i + 10, physicsParticles.length)).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150 && amplitude > 0.3) {
                context.strokeStyle = `hsla(${(particle.hue + otherParticle.hue) / 2}, 70%, 60%, ${(1 - distance / 150) * 0.3})`;
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(particle.x, particle.y);
                context.lineTo(otherParticle.x, otherParticle.y);
                context.stroke();
            }
        });
    });
}

// Beat Explosions
const explosions = [];
let lastExplosionTime = 0;
let explosionsInitialized = false;

class Explosion {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.color = color;
        this.age = 0;
        
        // Create explosion particles
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 5 + 2,
                life: 1.0
            });
        }
    }
    
    update() {
        this.age += 0.02;
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            p.vx *= 0.98; // Friction
            p.vy *= 0.98;
            p.life -= 0.02;
            p.size *= 0.98;
        });
        
        this.particles = this.particles.filter(p => p.life > 0 && p.size > 0.1);
        return this.particles.length > 0;
    }
    
    draw(context) {
        context.save();
        this.particles.forEach(p => {
            context.globalAlpha = p.life * 0.8;
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            context.fill();
        });
        context.restore();
    }
}

function drawExplosion(frequencyData, stats) {
    const canvas = canvases.explosion;
    const context = ctx.explosion;
    
    if (!canvas || !context) return;
    
    // Fade effect
    context.fillStyle = 'rgba(10, 10, 15, 0.15)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const amplitude = stats?.amplitude || 0;
    
    // Check for beat and create explosion - lower threshold for more explosions
    const now = Date.now();
    if (amplitude > 0.4 && now - lastExplosionTime > 300) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.5;
        const hue = (Math.random() * 360 + colorRotation) % 360;
        const color = `hsla(${hue}, 80%, 60%, 1)`;
        explosions.push(new Explosion(x, y, color));
        lastExplosionTime = now;
    }
    
    // Also create explosions on strong beats
    if (amplitude > 0.6 && now - lastExplosionTime > 200) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.3;
        const hue = (Math.random() * 360 + colorRotation + 180) % 360;
        const color = `hsla(${hue}, 80%, 70%, 1)`;
        explosions.push(new Explosion(x, y, color));
        lastExplosionTime = now;
    }
    
    // Update and draw explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        if (explosion.update()) {
            explosion.draw(context);
        } else {
            explosions.splice(i, 1);
        }
    }
    
    // Draw spectrum in background
    const barCount = 128;
    const barWidth = canvas.width / barCount;
    
    for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * frequencyData.length);
        const value = (frequencyData[dataIndex] / 255) * (sensitivity / 100) * 2;
        const barHeight = Math.max(1, value * canvas.height * 0.3);
        
        const hue = (i / barCount * 360 + colorRotation) % 360;
        context.fillStyle = `hsla(${hue}, 70%, 50%, 0.3)`;
        context.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
    }
    
    // Draw info text if no explosions yet
    if (explosions.length === 0 && amplitude < 0.4) {
        context.fillStyle = 'rgba(139, 92, 246, 0.5)';
        context.font = '24px sans-serif';
        context.textAlign = 'center';
        context.fillText('Waiting for beats...', canvas.width / 2, canvas.height / 2);
    }
}

// 4-Way Grid View
function drawGrid4(frequencyData, waveformData, stats) {
    const canvas = canvases.grid4;
    const context = ctx.grid4;
    
    if (!canvas) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height / 2;
    
    // Top Left - Spectrum
    context.save();
    context.beginPath();
    context.rect(0, 0, halfWidth, halfHeight);
    context.clip();
    
    const barCount = 32;
    const barWidth = halfWidth / barCount;
    for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * frequencyData.length);
        const value = (frequencyData[dataIndex] / 255) * (sensitivity / 100) * 2;
        const barHeight = Math.max(2, value * halfHeight * 0.8);
        const hue = (i / barCount * 360 + colorRotation) % 360;
        context.fillStyle = `hsla(${hue}, 80%, 60%, 0.9)`;
        context.fillRect(i * barWidth, halfHeight - barHeight, barWidth - 1, barHeight);
    }
    context.restore();
    
    // Top Right - Circular
    context.save();
    context.beginPath();
    context.rect(halfWidth, 0, halfWidth, halfHeight);
    context.clip();
    context.translate(halfWidth + halfWidth/2, halfHeight/2);
    const radius = halfHeight / 3;
    const segments = 64;
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const dataIndex = Math.floor((i / segments) * frequencyData.length);
        const value = (frequencyData[dataIndex] / 255) * (sensitivity / 100) * 2;
        const barLength = value * radius;
        const x1 = Math.cos(angle) * radius;
        const y1 = Math.sin(angle) * radius;
        const x2 = Math.cos(angle) * (radius + barLength);
        const y2 = Math.sin(angle) * (radius + barLength);
        const hue = (i / segments * 360 + colorRotation) % 360;
        context.strokeStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
    }
    context.restore();
    
    // Bottom Left - Waveform
    context.save();
    context.beginPath();
    context.rect(0, halfHeight, halfWidth, halfHeight);
    context.clip();
    context.strokeStyle = `hsla(${(colorRotation + 120) % 360}, 80%, 60%, 0.8)`;
    context.lineWidth = 2;
    context.beginPath();
    const sliceWidth = halfWidth / waveformData.length;
    let x = 0;
    for (let i = 0; i < waveformData.length; i++) {
        const v = waveformData[i] / 128.0;
        const y = halfHeight + (v * halfHeight) / 2;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
        x += sliceWidth;
    }
    context.stroke();
    context.restore();
    
    // Bottom Right - Particles
    context.save();
    context.beginPath();
    context.rect(halfWidth, halfHeight, halfWidth, halfHeight);
    context.clip();
    const particleCount = Math.min(20, particles.length);
    for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        const freqIndex = Math.floor((i / particleCount) * frequencyData.length);
        const value = frequencyData[freqIndex] / 255;
        p.update(value * (sensitivity / 100));
        context.save();
        context.translate(halfWidth, halfHeight);
        p.draw(context);
        context.restore();
    }
    context.restore();
}

// Liquid Flow Effect
const liquidParticles = [];
const maxLiquidParticles = 300;

class LiquidParticle {
    constructor() {
        this.reset();
    }
    
    reset() {
        const canvas = canvases.liquid;
        this.x = Math.random() * (canvas?.width || 800);
        this.y = Math.random() * (canvas?.height || 600);
        this.vx = 0;
        this.vy = 0;
        this.size = Math.random() * 3 + 1;
        this.hue = Math.random() * 360;
        this.life = Math.random() * 0.5 + 0.5;
    }
    
    update(frequencyData, index) {
        const canvas = canvases.liquid;
        if (!canvas) return;
        
        const amplitude = frequencyData[index % frequencyData.length] / 255;
        
        // Flow field
        const angle = (this.x / canvas.width + this.y / canvas.height) * Math.PI * 4 + Date.now() * 0.001;
        this.vx += Math.cos(angle) * amplitude * 0.5;
        this.vy += Math.sin(angle) * amplitude * 0.5;
        
        // Velocity limits
        this.vx *= 0.95;
        this.vy *= 0.95;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Wrap around
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
        
        this.hue = (this.hue + 0.5) % 360;
        this.size = 1 + amplitude * 5;
    }
    
    draw(context) {
        context.fillStyle = `hsla(${this.hue}, 80%, 60%, ${this.life * 0.6})`;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
    }
}

// Initialize liquid particles - will be done when liquid mode is first accessed
let liquidParticlesInitialized = false;

function initLiquidParticles() {
    if (liquidParticlesInitialized) return;
    const canvas = canvases.liquid;
    if (!canvas) return;
    
    liquidParticles.length = 0;
    for (let i = 0; i < maxLiquidParticles; i++) {
        liquidParticles.push(new LiquidParticle());
    }
    liquidParticlesInitialized = true;
}

function drawLiquid(frequencyData, stats) {
    const canvas = canvases.liquid;
    const context = ctx.liquid;
    
    if (!canvas || !context) return;
    
    // Initialize particles if needed
    if (!liquidParticlesInitialized) {
        initLiquidParticles();
    }
    
    context.fillStyle = 'rgba(10, 10, 15, 0.1)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    liquidParticles.forEach((particle, i) => {
        particle.update(frequencyData, i);
        particle.draw(context);
        
        // Draw connections
        liquidParticles.slice(i + 1, Math.min(i + 5, liquidParticles.length)).forEach(other => {
            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 80) {
                context.strokeStyle = `hsla(${(particle.hue + other.hue) / 2}, 70%, 60%, ${(1 - distance / 80) * 0.2})`;
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(particle.x, particle.y);
                context.lineTo(other.x, other.y);
                context.stroke();
            }
        });
    });
}

// 3D WebGL Visualization (Simplified - uses canvas for now, but can be extended with Three.js)
function drawWebGL3D(frequencyData, stats) {
    const canvas = canvases.webgl3d;
    const context = ctx.webgl3d;
    
    if (!canvas) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const amplitude = stats?.amplitude || 0;
    
    // 3D-like bars
    const barCount = 64;
    const barWidth = canvas.width / barCount;
    const maxDepth = 200;
    
    for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * frequencyData.length);
        const value = (frequencyData[dataIndex] / 255) * (sensitivity / 100);
        const barHeight = value * canvas.height * 0.8;
        const depth = (i / barCount) * maxDepth;
        
        // 3D perspective
        const scale = 1 - depth / maxDepth;
        const x = centerX + (i - barCount/2) * barWidth * scale;
        const w = barWidth * scale;
        const h = barHeight * scale;
        
        // Create 3D effect with gradients
        const hue = (i / barCount * 360 + colorRotation) % 360;
        const gradient = context.createLinearGradient(x, centerY - h/2, x, centerY + h/2);
        gradient.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.9)`);
        gradient.addColorStop(0.5, `hsla(${hue + 30}, 80%, 60%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue}, 80%, 50%, 0.6)`);
        
        context.fillStyle = gradient;
        context.shadowBlur = 20;
        context.shadowColor = `hsla(${hue}, 80%, 60%, 0.8)`;
        context.fillRect(x - w/2, centerY - h/2, w, h);
        
        // Top highlight
        context.fillStyle = `hsla(${hue}, 80%, 80%, 0.6)`;
        context.fillRect(x - w/2, centerY - h/2, w, h * 0.1);
    }
    
    context.shadowBlur = 0;
}

// Video Recording
async function startRecording() {
    try {
        const canvas = canvases[currentMode];
        const stream = canvas.captureStream(30); // 30 FPS
        
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `MusicReactr-${currentMode}-${Date.now()}.webm`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        const recordBtn = document.getElementById('recordBtn');
        recordBtn.classList.add('recording');
        recordBtn.querySelector('circle').style.fill = 'red';
        
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Recording not supported in this browser. Try Chrome or Edge.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        const recordBtn = document.getElementById('recordBtn');
        recordBtn.classList.remove('recording');
        recordBtn.querySelector('circle').style.fill = '';
    }
}

// Webcam Integration
async function startWebcam() {
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const webcamVideo = document.getElementById('webcamVideo');
        webcamVideo.srcObject = webcamStream;
        webcamVideo.play();
        webcamActive = true;
        
        // Hide all canvases and show video
        Object.values(canvases).forEach(canvas => canvas.classList.add('hidden'));
        webcamVideo.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error accessing webcam:', error);
        alert('Unable to access webcam. Please grant camera permissions.');
    }
}

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
        webcamActive = false;
        
        const webcamVideo = document.getElementById('webcamVideo');
        webcamVideo.classList.add('hidden');
        webcamVideo.srcObject = null;
        
        // Show current mode canvas
        canvases[currentMode].classList.remove('hidden');
    }
}

