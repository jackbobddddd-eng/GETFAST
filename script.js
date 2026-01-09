import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

let scene, camera, renderer, player, stars, grid, walls = [];
let score = 0, speed = 0.8, isDead = false, isStarted = false, sizeIndex = 0;
let spawnCounter = 0;

const BASE_SPAWN_INTERVAL = 60; // Base spacing
const SIZES = [0.6, 2.8]; 
const HOOP_SIZES = [0.95, 3.2]; 
const LABELS = ["SMALL", "LARGE"];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050010);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 2, 0);

    if (!renderer) {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('game-view').appendChild(renderer.domElement);
    }

    player = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    scene.add(player);

    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(5000 * 3);
    for(let i=0; i<15000; i++) starPos[i] = (Math.random()-0.5) * 600;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({color: 0xffffff, size: 0.25}));
    scene.add(stars);

    grid = new THREE.GridHelper(1000, 80, 0xff00ff, 0x220033);
    grid.position.y = -6;
    scene.add(grid);

    score = 0; speed = 0.8; isDead = false; walls = []; spawnCounter = 0;
    document.getElementById('score-val').innerText = "0000";
}

function spawnWall() {
    const idx = Math.floor(Math.random() * 2);
    const group = new THREE.Group();
    
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(HOOP_SIZES[idx], 0.25, 16, 100),
        new THREE.MeshBasicMaterial({ color: 0xff00ff })
    );
    group.add(ring);
    
    const canv = document.createElement('canvas');
    const x = canv.getContext('2d');
    canv.width = 256; canv.height = 128;
    x.fillStyle = "white"; x.font = "bold 60px Orbitron"; x.textAlign = "center";
    x.fillText(LABELS[idx], 128, 80);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(canv)}));
    sprite.scale.set(12, 6, 1); sprite.position.y = HOOP_SIZES[idx] + 4;
    group.add(sprite);

    group.position.z = -250;
    group.userData = { target: idx, passed: false };
    scene.add(group);
    walls.push(group);
}

function animate() {
    requestAnimationFrame(animate);
    if (!isStarted || isDead) return;

    // Movement speeds up over time
    speed += 0.0004; 
    
    stars.position.z += speed; if(stars.position.z > 200) stars.position.z = 0;
    grid.position.z += speed * 2.5; if(grid.position.z > 10) grid.position.z = 0;

    player.scale.lerp(new THREE.Vector3(SIZES[sizeIndex], SIZES[sizeIndex], SIZES[sizeIndex]), 0.2);

    // Dynamic Spawning: Interval shortens slightly as speed increases to maintain gap
    spawnCounter += speed;
    if(spawnCounter >= (BASE_SPAWN_INTERVAL + (speed * 10))) {
        spawnWall();
        spawnCounter = 0;
    }

    for(let i = walls.length - 1; i >= 0; i--) {
        walls[i].position.z += speed * 4;
        
        // Accurate Collision Check
        if(walls[i].position.z > -2 && walls[i].position.z < 5) {
            if(sizeIndex !== walls[i].userData.target) {
                isDead = true;
                document.getElementById('death-screen').classList.remove('hidden');
                document.getElementById('final-stats').innerText = "STATION_CRASH // SCORE: " + score;
            } else if(!walls[i].userData.passed) {
                score += 10;
                walls[i].userData.passed = true;
                document.getElementById('score-val').innerText = score.toString().padStart(4, '0');
            }
        }
        if(walls[i].position.z > 50) { scene.remove(walls[i]); walls.splice(i, 1); }
    }
    renderer.render(scene, camera);
}

// Global Controls
window.addEventListener('keydown', (e) => {
    if(!isStarted || isDead) return;
    const k = e.key.toLowerCase();
    if(k === 'w' || e.key === "ArrowUp") sizeIndex = 1;
    if(k === 's' || e.key === "ArrowDown") sizeIndex = 0;
    document.getElementById('tag-0').className = sizeIndex === 0 ? 'active' : '';
    document.getElementById('tag-1').className = sizeIndex === 1 ? 'active' : '';
});

document.getElementById('start-btn').onclick = () => {
    isStarted = true;
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    init();
};

document.getElementById('reboot-btn').onclick = () => {
    isDead = false;
    document.getElementById('death-screen').classList.add('hidden');
    init();
};

window.addEventListener('resize', () => {
    if(camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

animate();