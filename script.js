// Canvas setup for subtle particle animation
const canvas = document.getElementById("background-canvas");
const ctx = canvas.getContext("2d");

// Set canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Color palette inspired by social network wool image
const particleColors = [
  "#e8856d", // warm coral/red
  "#f5a962", // warm orange
  "#f5d96b", // warm yellow
  "#6ba587", // muted green
  "#6b8fbf", // soft blue
];

// Particle class
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    // ADJUST VELOCITY HERE: decrease these numbers for slower movement
    this.vx = (Math.random() - 0.5) * 0.15; // was 0.5, now 0.2 for slower
    this.vy = (Math.random() - 0.5) * 0.15; // was 0.5, now 0.2 for slower
    this.radius = Math.random() * 1.5 + 0.5;
    this.opacity = Math.random() * 0.3 + 0.1;
    // Assign color and store as both hex and colorIndex for grouping
    this.colorIndex = Math.floor(Math.random() * particleColors.length);
    this.color = particleColors[this.colorIndex];
  }

  update() {
    // Apply very subtle gravity attraction to cursor (just a gentle nudge)
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const gravityRadius = 150; // ADJUST: how far cursor affects particles (try 100-250)

    if (distance < gravityRadius && distance > 0) {
      const gravityStrength = 0.02; // ADJUST: pull strength (try 0.02-0.08, very subtle)
      const force = (1 - distance / gravityRadius) * gravityStrength;
      this.vx += (dx / distance) * force;
      this.vy += (dy / distance) * force;
    }

    // Repel particles away from text area
    const heroText = document.querySelector(".hero-text");
    if (heroText) {
      const textRect = heroText.getBoundingClientRect();
      const textCenterX = textRect.left + textRect.width / 2;
      const textCenterY = textRect.top + textRect.height / 2;

      // Create a bounding box around text with padding
      const padding = 80;
      const textBoxLeft = textRect.left - padding;
      const textBoxRight = textRect.right + padding;
      const textBoxTop = textRect.top - padding;
      const textBoxBottom = textRect.bottom + padding;

      // Check if particle is near text area and push it away
      if (
        this.x > textBoxLeft &&
        this.x < textBoxRight &&
        this.y > textBoxTop &&
        this.y < textBoxBottom
      ) {
        // Calculate repulsion direction (away from text center)
        const repelDx = this.x - textCenterX;
        const repelDy = this.y - textCenterY;
        const repelDistance = Math.sqrt(repelDx * repelDx + repelDy * repelDy);

        if (repelDistance > 0) {
          const repelStrength = 0.15; // ADJUST: push strength (try 0.1-0.3)
          this.vx += (repelDx / repelDistance) * repelStrength;
          this.vy += (repelDy / repelDistance) * repelStrength;
        }
      }
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Strong damping/friction to keep movement subtle
    this.vx *= 0.94;
    this.vy *= 0.94;

    // Bounce off edges
    if (this.x < 0 || this.x > canvas.width) {
      this.vx *= -1;
    }
    if (this.y < 0 || this.y > canvas.height) {
      this.vy *= -1;
    }

    // Keep particle in bounds
    this.x = Math.max(0, Math.min(canvas.width, this.x));
    this.y = Math.max(0, Math.min(canvas.height, this.y));
  }

  draw() {
    ctx.fillStyle = `rgba(${parseInt(this.color.slice(1, 3), 16)}, ${parseInt(this.color.slice(3, 5), 16)}, ${parseInt(this.color.slice(5, 7), 16)}, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Create particles
const particleCount = 20;
const particles = [];

for (let i = 0; i < particleCount; i++) {
  particles.push(new Particle());
}

// Draw lines between nearby particles (within same color groups)
function drawConnections() {
  // ADJUST CONNECTION LENGTH HERE: increase this number for longer lines
  const maxDistance = 280; // was 150, now 220 for longer connections

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      // Only connect particles of the same color (same genre/group)
      if (particles[i].colorIndex !== particles[j].colorIndex) continue;

      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance) {
        const opacity = (1 - distance / maxDistance) * 0.12;
        // Use the particle's color for the connection line
        ctx.strokeStyle = `${particles[i].color}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

// Draw lines from image to nearby particles on hover
function drawImageConnections(
  imageX,
  imageY,
  imageWidth,
  imageHeight,
  hoverTransition,
) {
  if (!hoverTransition) return;

  const connectDistance = 900;
  const imageRadius =
    Math.sqrt(imageWidth * imageWidth + imageHeight * imageHeight) / 2;

  // Get edge points of the image to draw from
  const edgePoints = [
    { x: imageX, y: imageY }, // top-left
    { x: imageX + imageWidth, y: imageY }, // top-right
    { x: imageX, y: imageY + imageHeight }, // bottom-left
    { x: imageX + imageWidth, y: imageY + imageHeight }, // bottom-right
  ];

  particles.forEach((particle) => {
    let closestDistance = connectDistance;

    for (let point of edgePoints) {
      const dx = particle.x - point.x;
      const dy = particle.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      closestDistance = Math.min(closestDistance, distance);

      if (distance < connectDistance && distance > 50) {
        const opacity =
          (1 - distance / connectDistance) * 0.25 * hoverTransition;
        // Use the particle's own color for the extending lines
        ctx.strokeStyle = `${particle.color}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();
      }
    }

    // Brighten particles near the image on hover (using their own color)
    if (closestDistance < connectDistance && hoverTransition > 0) {
      const glowIntensity =
        (1 - closestDistance / connectDistance) * hoverTransition;
      ctx.fillStyle = `${particle.color}${Math.round(glowIntensity * 100)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius + 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Draw lines from text elements to nearby particles (connection reinforcement)
function drawTextConnections() {
  const heroText = document.querySelector(".hero-text");
  if (!heroText) return;

  const textRect = heroText.getBoundingClientRect();
  const textCenterX = textRect.left + textRect.width / 2;
  const textCenterY = textRect.top + textRect.height / 2;

  const textConnectDistance = 500; // ADJUST: how far particles connect to text (try 200-400)

  particles.forEach((particle) => {
    const dx = particle.x - textCenterX;
    const dy = particle.y - (textCenterY - scrollY); // Account for scroll
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < textConnectDistance && distance > 50) {
      const opacity = (1 - distance / textConnectDistance) * 0.08;
      ctx.strokeStyle = `${particle.color}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(textCenterX, textCenterY - scrollY);
      ctx.lineTo(particle.x, particle.y);
      ctx.stroke();
    }
  });
}

// Draw lines from cursor to nearby particles (cross-genre connections to show bridging)
function drawCursorConnections() {
  particles.forEach((particle) => {
    const dx = particle.x - mouseX;
    const dy = particle.y - mouseY;
    const distanceToCursor = Math.sqrt(dx * dx + dy * dy);

    // Only process particles near cursor
    if (distanceToCursor < cursorInfluenceRadius) {
      // Draw lines to nearby particles (ALL particles, showing cross-genre connections)
      const connectionDistance = 280;
      particles.forEach((otherParticle) => {
        if (particle === otherParticle) return;

        const pdx = particle.x - otherParticle.x;
        const pdy = particle.y - otherParticle.y;
        const particleDistance = Math.sqrt(pdx * pdx + pdy * pdy);

        if (particleDistance < connectionDistance) {
          // Fade opacity based on distance to cursor
          const cursorInfluence = 1 - distanceToCursor / cursorInfluenceRadius;
          const distanceInfluence = 1 - particleDistance / connectionDistance;
          const opacity = cursorInfluence * distanceInfluence * 0.2;

          // Use the particle's color for the connection line
          ctx.strokeStyle = `${particle.color}${Math.round(opacity * 255)
            .toString(16)
            .padStart(2, "0")}`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(otherParticle.x, otherParticle.y);
          ctx.stroke();
        }
      });

      // Brighten the particle itself with its own color
      const glowIntensity = 1 - distanceToCursor / cursorInfluenceRadius;
      ctx.fillStyle = `${particle.color}${Math.round(glowIntensity * 150)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Mouse tracking for particle interaction
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
const cursorInfluenceRadius = 150; // ADJUST: distance at which particles activate (try 100-250)

// Scroll tracking for parallax
let scrollY = 0;
const parallaxStrength = 0.3; // ADJUST: scroll parallax intensity (try 0.1-0.5)

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

document.addEventListener("mouseleave", () => {
  mouseX = canvas.width / 2;
  mouseY = canvas.height / 2;
});

window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
});

// Animation loop
let imageHovering = false;
let imageRect = null;
let hoverTransition = 0; // Tracks fade 0-1
const transitionSpeed = 0.02; // ADJUST HERE: lower = slower fade (try 0.01-0.1)

function animate() {
  // Clear canvas with slight fade for trail effect
  ctx.fillStyle = "rgba(240, 237, 232, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update hover transition smoothly
  if (imageHovering) {
    hoverTransition = Math.min(1, hoverTransition + transitionSpeed);
  } else {
    hoverTransition = Math.max(0, hoverTransition - transitionSpeed);
  }

  // Update and draw particles
  particles.forEach((particle) => {
    particle.update();
    particle.draw();
  });

  // Draw connections between particles
  drawConnections();

  // Draw connections from text to particles
  drawTextConnections();

  // Draw cursor-influenced connections
  drawCursorConnections();

  // Draw connections from image to particles on hover (with smooth transition)
  if (hoverTransition > 0 && imageRect) {
    drawImageConnections(
      imageRect.left,
      imageRect.top,
      imageRect.width,
      imageRect.height,
      hoverTransition,
    );
  }

  requestAnimationFrame(animate);
}

// Tagline rotation
const taglineLines = document.querySelectorAll(".tagline-line");
let currentLineIndex = 0;
const cycleDuration = 5000; // ADJUST: milliseconds each line is visible (try 3000-5000)

function rotateTagline() {
  // Hide current line
  taglineLines[currentLineIndex].style.opacity = "0";

  // Move to next line
  currentLineIndex = (currentLineIndex + 1) % taglineLines.length;

  // Show next line
  taglineLines[currentLineIndex].style.opacity = "1";

  // Schedule next rotation
  setTimeout(rotateTagline, cycleDuration);
}

// Initialize: show first line
if (taglineLines.length > 0) {
  taglineLines[0].style.opacity = "1";
  // Start rotation after initial display time
  setTimeout(rotateTagline, cycleDuration);
}

// Start animation
animate();

// Image hover effect with extending lines
const heroImage = document.querySelector(".hero-image");
const heroImageWrapper = document.querySelector(".hero-image-wrapper");

if (heroImage && heroImageWrapper) {
  heroImage.addEventListener("mouseenter", () => {
    imageHovering = true;
    imageRect = heroImage.getBoundingClientRect();
    heroImage.style.boxShadow = "0 30px 80px rgba(0, 0, 0, 0.12)";
  });

  heroImage.addEventListener("mouseleave", () => {
    imageHovering = false;
    heroImage.style.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.08)";
  });

  // Update image rect on scroll
  window.addEventListener("scroll", () => {
    if (imageHovering) {
      imageRect = heroImage.getBoundingClientRect();
    }
  });
}
