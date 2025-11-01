// Audio Context and Analyser
let audioContext;
let analyser;
let dataArray;
let source;
let stream;
let animationId;

// Canvas elements
const canvases = {
    spectrum: document.getElementById('spectrumCanvas'),
    waveform: document.getElementById('waveformCanvas'),
    circular: document.getElementById('circularCanvas'),
    particles: document.getElementById('particlesCanvas'),
    orb: document.getElementById('orbCanvas'),
    matrix: document.getElementById('matrixCanvas'),
    tunnel: document.getElementById('tunnelCanvas'),
    kaleidoscope: document.getElementById('kaleidoscopeCanvas'),
    mandala: document.getElementById('mandalaCanvas'),
    dual: document.getElementById('dualCanvas'),
    interference: document.getElementById('interferenceCanvas'),
    fractal: document.getElementById('fractalCanvas'),
    physics: document.getElementById('physicsCanvas'),
    explosion: document.getElementById('explosionCanvas'),
    grid4: document.getElementById('grid4Canvas'),
    liquid: document.getElementById('liquidCanvas'),
    webgl3d: document.getElementById('webgl3dCanvas')
};

const ctx = {};
let currentMode = 'spectrum';
let sensitivity = 100;
let volume = 100;
let autoColors = false;
let mouseInteraction = false;
let mouseX = 0;
let mouseY = 0;
let colorRotation = 0;
let colorHue = 0;
let gravity = 100;
let chaosMode = false;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let webcamActive = false;
let webcamStream = null;

// BPM Detection
let bpmDetector = {
    lastBeat: 0,
    beatTimes: [],
    bpm: 0,
    beatCount: 0,
    threshold: 0.7
};

// Initialize canvas contexts
Object.keys(canvases).forEach(mode => {
    if (canvases[mode]) {
        ctx[mode] = canvases[mode].getContext('2d');
        resizeCanvas(canvases[mode]);
    }
});

// Resize canvas
function resizeCanvas(canvas) {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

window.addEventListener('resize', () => {
    Object.values(canvases).forEach(canvas => resizeCanvas(canvas));
});

// Particle System
const particles = [];
const maxParticles = 150;

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvases.particles.width;
        this.y = Math.random() * canvases.particles.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = Math.random() > 0.5 ? 'rgba(139, 92, 246,' : 'rgba(236, 72, 153,';
    }

    update(amplitude) {
        this.x += this.speedX + amplitude * 2;
        this.y += this.speedY + amplitude * 2;
        
        if (this.x < 0 || this.x > canvases.particles.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvases.particles.height) this.speedY *= -1;
        
        this.opacity = 0.2 + amplitude * 0.8;
        this.size = 1 + amplitude * 4;
    }

    draw(context) {
        context.fillStyle = this.color + this.opacity + ')';
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
    }
}

// Initialize particles
for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
}

// Start Audio Capture - Screen Share with Audio
async function startAudioCapture() {
    try {
        // Request screen share with audio
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: true, // Required for some browsers
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                sampleRate: 44100
            }
        });

        // Check if audio track exists
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            stream.getTracks().forEach(track => track.stop());
            throw new Error('No audio track found. Please make sure to check "Share audio" when sharing your screen.');
        }

        // Stop video tracks if not needed
        stream.getVideoTracks().forEach(track => track.stop());

        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaStreamSource(stream);
        
        // Create analyser
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Update UI
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('micBtn').classList.add('hidden');
        document.getElementById('stopBtn').classList.remove('hidden');
        document.getElementById('instructions').classList.add('hidden');
        document.getElementById('audioControls').classList.remove('hidden');

        // Start visualization
        visualize();

        // Handle stream end
        audioTracks[0].onended = () => {
            stopAudioCapture();
        };

    } catch (error) {
        console.error('Error accessing audio:', error);
        
        // Provide helpful error message
        const errorMsg = error.message || 'Unable to access audio.';
        if (errorMsg.includes('Share audio')) {
            alert('⚠️ No audio detected!\n\nPlease:\n1. Click "Start" again\n2. Select "Share screen" or "Share tab"\n3. Make sure to CHECK the "Share audio" checkbox\n4. Select your music app or browser tab\n\nAlternatively, try using "Use Microphone" option for testing.');
        } else {
            alert(`⚠️ ${errorMsg}\n\nTip: Make sure to check "Share audio" when sharing your screen, or try the microphone option.`);
        }
    }
}

// Start Audio Capture - Microphone Fallback
async function startMicrophoneCapture() {
    try {
        // Request microphone access
        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                sampleRate: 44100
            }
        });

        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaStreamSource(stream);
        
        // Create analyser
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Update UI
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('micBtn').classList.add('hidden');
        document.getElementById('stopBtn').classList.remove('hidden');
        document.getElementById('instructions').classList.add('hidden');
        document.getElementById('audioControls').classList.remove('hidden');

        // Start visualization
        visualize();

        // Handle stream end
        stream.getAudioTracks()[0].onended = () => {
            stopAudioCapture();
        };

    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert(`⚠️ Unable to access microphone.\n\nError: ${error.message}\n\nPlease grant microphone permissions and try again.`);
    }
}

// Stop Audio Capture
function stopAudioCapture() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    // Clear canvases
    Object.values(ctx).forEach(context => {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    });

    // Reset UI
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('micBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('instructions').classList.remove('hidden');
    document.getElementById('audioControls').classList.add('hidden');

    // Reset stats
    document.getElementById('frequencyValue').textContent = '-- Hz';
    document.getElementById('bassValue').textContent = '--';
    document.getElementById('midValue').textContent = '--';
    document.getElementById('trebleValue').textContent = '--';
    document.getElementById('bpmValue').textContent = '-- BPM';
    document.getElementById('beatsValue').textContent = '0';
    bpmDetector.beatCount = 0;
    bpmDetector.bpm = 0;
}

// Get Audio Data
function getAudioData() {
    if (!analyser) return null;

    analyser.getByteFrequencyData(dataArray);
    
    // Get time domain data for waveform
    const waveformData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(waveformData);

    return { frequency: dataArray, waveform: waveformData };
}

// Calculate Audio Stats
function calculateStats(frequencyData) {
    if (!frequencyData) return null;

    const bassEnd = Math.floor(frequencyData.length * 0.1);
    const midStart = bassEnd;
    const midEnd = Math.floor(frequencyData.length * 0.5);
    const trebleStart = midEnd;

    const bass = frequencyData.slice(0, bassEnd).reduce((a, b) => a + b, 0) / bassEnd;
    const mid = frequencyData.slice(midStart, midEnd).reduce((a, b) => a + b, 0) / (midEnd - midStart);
    const treble = frequencyData.slice(trebleStart).reduce((a, b) => a + b, 0) / (frequencyData.length - trebleStart);

    // Find peak frequency
    let maxValue = 0;
    let maxIndex = 0;
    for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxValue) {
            maxValue = frequencyData[i];
            maxIndex = i;
        }
    }
    const sampleRate = audioContext.sampleRate;
    const nyquist = sampleRate / 2;
    const frequency = (maxIndex * nyquist) / analyser.frequencyBinCount;

    return { bass, mid, treble, frequency, amplitude: maxValue / 255 };
}

// Visualization Functions
function visualize() {
    if (!analyser) return;

    const audioData = getAudioData();
    if (!audioData) return;

    const stats = calculateStats(audioData.frequency);
    updateStats(stats);

    // Clear all canvases
    Object.values(canvases).forEach(canvas => {
        if (!canvas.classList.contains('hidden')) {
            ctx[currentMode].clearRect(0, 0, canvas.width, canvas.height);
        }
    });

    // Render current mode
    switch (currentMode) {
        case 'spectrum':
            drawSpectrum(audioData.frequency, stats);
            break;
        case 'waveform':
            drawWaveform(audioData.waveform, stats);
            break;
        case 'circular':
            drawCircular(audioData.frequency, stats);
            break;
        case 'particles':
            drawParticles(audioData.frequency, stats);
            break;
        case 'orb':
            drawOrb(audioData.frequency, stats);
            break;
        case 'matrix':
            drawMatrix(audioData.frequency, stats);
            break;
        case 'tunnel':
            drawTunnel(audioData.frequency, stats);
            break;
        case 'kaleidoscope':
            drawKaleidoscope(audioData.frequency, stats);
            break;
        case 'mandala':
            drawMandala(audioData.frequency, stats);
            break;
        case 'dual':
            drawDual(audioData.frequency, audioData.waveform, stats);
            break;
        case 'interference':
            drawInterference(audioData.frequency, stats);
            break;
        case 'fractal':
            drawFractal(audioData.frequency, stats);
            break;
        case 'physics':
            drawPhysics(audioData.frequency, stats);
            break;
        case 'explosion':
            drawExplosion(audioData.frequency, stats);
            break;
        case 'grid4':
            drawGrid4(audioData.frequency, audioData.waveform, stats);
            break;
        case 'liquid':
            drawLiquid(audioData.frequency, stats);
            break;
        case 'webgl3d':
            drawWebGL3D(audioData.frequency, stats);
            break;
    }
    
    // Update color rotation
    if (autoColors) {
        colorRotation += 0.5;
        colorHue = (colorRotation / 360) % 1;
    }
    
    // Detect beats
    detectBeat(stats);

    animationId = requestAnimationFrame(visualize);
}

// Spectrum Visualization
function drawSpectrum(frequencyData, stats) {
    const canvas = canvases.spectrum;
    const context = ctx.spectrum;
    const barCount = 128;
    const barWidth = canvas.width / barCount;
    const scale = (sensitivity / 100) * 2;

    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * frequencyData.length);
        const value = (frequencyData[dataIndex] / 255) * scale;
        const barHeight = Math.max(2, value * canvas.height * 0.8);

        // Gradient colors based on frequency
        const gradient = context.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        
        if (i < barCount / 3) {
            gradient.addColorStop(0, `rgba(139, 92, 246, ${0.8 + Math.min(value, 0.2)})`);
            gradient.addColorStop(1, `rgba(139, 92, 246, 0.3)`);
        } else if (i < (barCount * 2) / 3) {
            gradient.addColorStop(0, `rgba(236, 72, 153, ${0.8 + Math.min(value, 0.2)})`);
            gradient.addColorStop(1, `rgba(236, 72, 153, 0.3)`);
        } else {
            gradient.addColorStop(0, `rgba(6, 182, 212, ${0.8 + Math.min(value, 0.2)})`);
            gradient.addColorStop(1, `rgba(6, 182, 212, 0.3)`);
        }

        context.fillStyle = gradient;
        context.shadowBlur = 15;
        context.shadowColor = i < barCount / 3 ? 'rgba(139, 92, 246, 0.6)' : 
                              i < (barCount * 2) / 3 ? 'rgba(236, 72, 153, 0.6)' : 
                              'rgba(6, 182, 212, 0.6)';
        context.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
    }

    context.shadowBlur = 0;
}

// Waveform Visualization
function drawWaveform(waveformData, stats) {
    const canvas = canvases.waveform;
    const context = ctx.waveform;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = `rgba(139, 92, 246, 0.8)`;
    context.lineWidth = 3;
    context.shadowBlur = 30;
    context.shadowColor = 'rgba(139, 92, 246, 0.8)';
    context.beginPath();

    const sliceWidth = canvas.width / waveformData.length;
    let x = 0;

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

    // Mirror waveform
    context.strokeStyle = `rgba(236, 72, 153, 0.8)`;
    context.shadowColor = 'rgba(236, 72, 153, 0.8)';
    context.beginPath();
    x = 0;
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
    context.shadowBlur = 0;
}

// Circular Visualization
function drawCircular(frequencyData, stats) {
    const canvas = canvases.circular;
    const context = ctx.circular;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;
    const barCount = 256;
    const angleStep = (Math.PI * 2) / barCount;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(centerX, centerY);

    for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * frequencyData.length);
        const value = (frequencyData[dataIndex] / 255) * (sensitivity / 100) * 2;
        const barLength = value * radius;

        const angle = i * angleStep;
        const x1 = Math.cos(angle) * radius;
        const y1 = Math.sin(angle) * radius;
        const x2 = Math.cos(angle) * (radius + barLength);
        const y2 = Math.sin(angle) * (radius + barLength);

        // Color based on angle
        const hue = (i / barCount) * 360;
        let color;
        if (i < barCount / 3) {
            color = `rgba(139, 92, 246, ${0.6 + Math.min(value, 0.4)})`;
        } else if (i < (barCount * 2) / 3) {
            color = `rgba(236, 72, 153, ${0.6 + Math.min(value, 0.4)})`;
        } else {
            color = `rgba(6, 182, 212, ${0.6 + Math.min(value, 0.4)})`;
        }

        context.strokeStyle = color;
        context.lineWidth = 2;
        context.shadowBlur = 10;
        context.shadowColor = color;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
    }

    // Center circle
    context.shadowBlur = 30;
    context.beginPath();
    context.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    context.fillStyle = `rgba(139, 92, 246, ${0.3 + (stats?.amplitude || 0) * 0.5})`;
    context.fill();

    context.restore();
    context.shadowBlur = 0;
}

// Particles Visualization
function drawParticles(frequencyData, stats) {
    const canvas = canvases.particles;
    const context = ctx.particles;
    
    context.fillStyle = 'rgba(10, 10, 15, 0.1)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const amplitude = stats?.amplitude || 0;

    particles.forEach((particle, index) => {
        // Update particle based on audio
        const freqIndex = Math.floor((index / particles.length) * frequencyData.length);
        const freqValue = frequencyData[freqIndex] / 255;
        particle.update(freqValue * (sensitivity / 100));

        particle.draw(context);

        // Connect nearby particles
        particles.slice(index + 1).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                context.strokeStyle = `rgba(139, 92, 246, ${(1 - distance / 150) * 0.3})`;
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(particle.x, particle.y);
                context.lineTo(otherParticle.x, otherParticle.y);
                context.stroke();
            }
        });
    });
}

// Orb Visualization
let orbRotation = 0;
function drawOrb(frequencyData, stats) {
    const canvas = canvases.orb;
    const context = ctx.orb;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) / 4;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(centerX, centerY);

    orbRotation += 0.01;

    // Outer orbs
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + orbRotation;
        const dataIndex = Math.floor((i / 8) * frequencyData.length);
        const value = (frequencyData[dataIndex] / 255) * (sensitivity / 100);
        const radius = baseRadius * 0.3 + value * baseRadius * 1.5;

        const x = Math.cos(angle) * baseRadius;
        const y = Math.sin(angle) * baseRadius;

        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        if (i < 3) {
            gradient.addColorStop(0, `rgba(139, 92, 246, ${0.8 + Math.min(value, 0.2)})`);
            gradient.addColorStop(1, `rgba(139, 92, 246, 0)`);
        } else if (i < 6) {
            gradient.addColorStop(0, `rgba(236, 72, 153, ${0.8 + Math.min(value, 0.2)})`);
            gradient.addColorStop(1, `rgba(236, 72, 153, 0)`);
        } else {
            gradient.addColorStop(0, `rgba(6, 182, 212, ${0.8 + Math.min(value, 0.2)})`);
            gradient.addColorStop(1, `rgba(6, 182, 212, 0)`);
        }

        context.fillStyle = gradient;
        context.shadowBlur = 20;
        context.shadowColor = i < 3 ? 'rgba(139, 92, 246, 0.8)' : 
                              i < 6 ? 'rgba(236, 72, 153, 0.8)' : 
                              'rgba(6, 182, 212, 0.8)';
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    // Central orb
    const centralGradient = context.createRadialGradient(0, 0, 0, 0, 0, baseRadius);
    centralGradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 + (stats?.amplitude || 0) * 0.5})`);
    centralGradient.addColorStop(1, `rgba(139, 92, 246, 0)`);

    context.fillStyle = centralGradient;
    context.shadowBlur = 40;
    context.shadowColor = 'rgba(139, 92, 246, 0.8)';
    context.beginPath();
    context.arc(0, 0, baseRadius * (0.5 + (stats?.amplitude || 0) * 0.5), 0, Math.PI * 2);
    context.fill();

    context.restore();
    context.shadowBlur = 0;
}

// Matrix Visualization
const matrixChars = [];
function initMatrix() {
    const canvas = canvases.matrix;
    if (!canvas) return;
    
    const cols = Math.floor(canvas.width / 20);
    const charCount = Math.floor(canvas.height / 20);
    
    matrixChars.length = 0;
    for (let i = 0; i < cols; i++) {
        matrixChars[i] = {
            y: Math.random() * canvas.height,
            speed: Math.random() * 3 + 1,
            chars: Array.from({ length: charCount }, () => 
                String.fromCharCode(0x30A0 + Math.random() * 96)
            )
        };
    }
}

function drawMatrix(frequencyData, stats) {
    const canvas = canvases.matrix;
    const context = ctx.matrix;

    if (!canvas || matrixChars.length === 0) {
        initMatrix();
        return;
    }

    // Fade effect
    context.fillStyle = 'rgba(10, 10, 15, 0.1)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const cols = matrixChars.length;
    const colWidth = canvas.width / cols;
    const amplitude = stats?.amplitude || 0;

    matrixChars.forEach((col, colIndex) => {
        col.y += col.speed * (1 + amplitude);

        if (col.y > canvas.height) {
            col.y = -20;
        }

        const dataIndex = Math.floor((colIndex / cols) * frequencyData.length);
        const brightness = frequencyData[dataIndex] / 255;

        col.chars.forEach((char, charIndex) => {
            const y = col.y + charIndex * 20;
            if (y > 0 && y < canvas.height) {
                const fade = 1 - (charIndex / col.chars.length);
                const alpha = brightness * fade * (0.5 + amplitude);

                context.fillStyle = `rgba(139, 92, 246, ${alpha})`;
                context.font = '16px monospace';
                context.fillText(char, colIndex * colWidth, y);
            }
        });
    });
}

// Update Stats Display
function updateStats(stats) {
    if (!stats) return;

    document.getElementById('frequencyValue').textContent = Math.round(stats.frequency) + ' Hz';
    document.getElementById('bassValue').textContent = Math.round(stats.bass);
    document.getElementById('midValue').textContent = Math.round(stats.mid);
    document.getElementById('trebleValue').textContent = Math.round(stats.treble);
}

// Event Listeners
document.getElementById('startBtn').addEventListener('click', startAudioCapture);
document.getElementById('micBtn').addEventListener('click', startMicrophoneCapture);
document.getElementById('stopBtn').addEventListener('click', stopAudioCapture);

document.getElementById('visualMode').addEventListener('change', (e) => {
    // Hide all canvases
    Object.values(canvases).forEach(canvas => {
        if (canvas) canvas.classList.add('hidden');
    });
    
    // Hide webcam video if active
    const webcamVideo = document.getElementById('webcamVideo');
    if (webcamVideo) webcamVideo.classList.add('hidden');
    
    // Show selected canvas
    currentMode = e.target.value;
    const selectedCanvas = canvases[currentMode];
    
    if (selectedCanvas) {
        selectedCanvas.classList.remove('hidden');
        resizeCanvas(selectedCanvas);
        
        // Initialize context if not already done
        if (!ctx[currentMode]) {
            ctx[currentMode] = selectedCanvas.getContext('2d');
        }
        
        // Mode-specific initialization
        if (currentMode === 'matrix') {
            initMatrix();
        } else if (currentMode === 'particles') {
            // Reset particles on mode change
            particles.forEach(particle => particle.reset());
        } else if (currentMode === 'liquid') {
            // Initialize liquid particles
            if (typeof initLiquidParticles === 'function') {
                initLiquidParticles();
            }
        } else if (currentMode === 'physics') {
            // Initialize physics particles
            if (typeof initPhysicsParticles === 'function') {
                initPhysicsParticles();
            }
        }
    }
});

document.getElementById('sensitivity').addEventListener('input', (e) => {
    sensitivity = parseInt(e.target.value);
    document.getElementById('sensitivityValue').textContent = sensitivity + '%';
});

document.getElementById('volume').addEventListener('input', (e) => {
    volume = parseInt(e.target.value);
    document.getElementById('volumeValue').textContent = volume + '%';
    if (source && source.gainNode) {
        source.gainNode.gain.value = volume / 100;
    }
});

document.getElementById('autoColors').addEventListener('change', (e) => {
    autoColors = e.target.checked;
    if (!autoColors) {
        colorRotation = 0;
        colorHue = 0;
    }
});

document.getElementById('mouseInteraction').addEventListener('change', (e) => {
    mouseInteraction = e.target.checked;
});

document.getElementById('fullscreenBtn').addEventListener('click', () => {
    toggleFullscreen();
});

document.getElementById('screenshotBtn').addEventListener('click', () => {
    takeScreenshot();
});

document.getElementById('recordBtn').addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

document.getElementById('webcamBtn').addEventListener('click', () => {
    if (webcamActive) {
        stopWebcam();
    } else {
        startWebcam();
    }
});

document.getElementById('gravity').addEventListener('input', (e) => {
    gravity = parseInt(e.target.value);
    document.getElementById('gravityValue').textContent = gravity + '%';
});

document.getElementById('chaosMode').addEventListener('change', (e) => {
    chaosMode = e.target.checked;
    if (chaosMode) {
        sensitivity = Math.min(300, sensitivity * 1.5);
        document.getElementById('sensitivity').value = sensitivity;
        document.getElementById('sensitivityValue').textContent = sensitivity + '%';
    }
});

