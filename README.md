
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bryden vs JOHN CENA - Street Fighter Style!</title>
  <style>
    body {
      margin:0;
      height:100vh;
      background:#0a0a23;
      color:#fff;
      font-family:Arial, Helvetica, sans-serif;
      overflow:hidden;
    }
    canvas {
      display:block;
      margin:20px auto;
      border:4px solid #0ff;
      background:linear-gradient(to bottom, #111, #000);
      box-shadow:0 0 40px #0ff;
    }
    #hud {
      position:absolute;
      top:10px;
      left:10px;
      right:10px;
      display:flex;
      justify-content:space-between;
      font-size:32px;
      color:#0ff;
      pointer-events:none;
      z-index:10;
    }
    .health-bar {
      width:380px;
      height:38px;
      background:#111;
      border:4px solid #0ff;
      overflow:hidden;
      position:relative;
      border-radius:6px;
    }
    .health-fill {
      height:100%;
      transition:width 0.18s ease-out;
    }
    #p1-fill { background:linear-gradient(90deg, #c62828, #ff5252); box-shadow:0 0 12px #f00; }
    #p2-fill { background:linear-gradient(90deg, #0d47a1, #1976d2); box-shadow:0 0 12px #2196f3; }
    #controls {
      position:absolute;
      bottom:45px;
      left:0;
      right:0;
      text-align:center;
      font-size:18px;
      color:#0ff;
      text-shadow:0 0 6px #000;
      z-index:5;
    }
    #credits {
      position:absolute;
      bottom:10px;
      left:0;
      right:0;
      text-align:center;
      font-size:16px;
      color:#88ffff;
      text-shadow:0 0 8px #0ff;
      pointer-events:none;
      z-index:5;
    }
    #winner {
      position:absolute;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%);
      font-size:100px;
      color:#ffeb3b;
      display:none;
      text-shadow:0 0 40px #f00, 0 0 80px #f00;
      z-index:20;
      font-weight:bold;
    }
  </style>
</head>
<body>
<div id="hud">
  <div>BRYDEN
    <div class="health-bar"><div id="p1-fill" class="health-fill" style="width:100%"></div></div>
  </div>
  <div>ROUND 1</div>
  <div>JOHN CENA
    <div class="health-bar"><div id="p2-fill" class="health-fill" style="width:100%"></div></div>
  </div>
</div>
<canvas id="game" width="960" height="540"></canvas>
<div id="controls">A/D = move | W = jump | S = crouch/block | J=LP | K=MP | L=HP | Q=Attitude Adjustment | Click to focus!</div>
<div id="credits">Owned by Bryden Harris • Made by Drake Tupper</div>
<div id="winner"></div>

<script>
window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.tabIndex = 1;
  canvas.focus();

  let keys = {};
  let gameOver = false;
  let shake = {x:0, y:0};
  let particles = [];
  let projectiles = [];
  let attackPops = [];
  let voiceLines = [];
  let lastTauntTime = 0;

  const cenaLines = [
    "You CAN'T SEE ME! 🤣",
    "HUSTLE? You BUSTLE! 💀",
    "MY TIME IS NOW... NAP TIME FOR YOU! 😴",
    "THE CHAMP IS HEEEERE... TO YEET YA! 🚀",
    "NEVER GIVE UP? TAP OUT, BRYDEN! 🔔",
    "YOU WANT SOME? COME GET THIS L! 😂",
    "WORD LIIIFE... OR WORD LOSE! 🤡",
    "YOUR CAREER IS UP... IN FLAMES! 🔥",
    "I'M THE PROTOTYPE... YOU'RE THE FAKE! 🤖",
    "ACKNOWLEDGE ME... OR PERISH! 👑",
    "CENA SLAMMIN' ON YA RAP GAME! 🎤💥",
    "Bryden? More like BRY-DONE! 🪦",
    "HOSTILE TAKEOVER... OF YOUR HEALTH BAR! 🏥",
    "PIZZA? NAH, HERE'S A CENA-BLOCK! 🍕🚫"
  ];

  function playCenaVoice(strength = null, isTaunt = false) {
    let line;
    if (strength === 'hadouken') {
      line = "ATTITUDE ADJUSTMENT... TO OBLIVION! 💥😂";
    } else if (strength === 'heavy') {
      line = Math.random() < 0.4 ? "You CAN'T SEE ME! 🤣" : 
             Math.random() < 0.7 ? "THE CHAMP IS HEEEERE... TO OWN YA! 👑" : "BOOM! HEADSHOT! 🎯";
    } else if (isTaunt) {
      line = "Bryden, you fightin' like a CHUMP! 😭";
    } else if (Math.random() < 0.4) {
      line = cenaLines[Math.floor(Math.random() * cenaLines.length)];
    } else {
      return;
    }

    voiceLines.push({
      x: p2.x + p2.w / 2,
      y: p2.y - 50,
      text: line,
      life: 90,
      vy: -0.8,
      color: Math.random() < 0.5 ? '#ffff00' : '#ff4444',
      scale: 1.3
    });
  }

  const p1 = {
    x: 180,
    y: 340,
    w: 80,
    h: 160,
    color: '#d32f2f',
    hp: 100,
    velX: 0,
    velY: 0,
    onGround: true,
    crouching: false,
    blocking: false,
    hitstun: 0,
    attackCooldown: 0,
    comboCount: 0,
    lastAttackTime: 0
  };

  const p2 = {
    x: 720,
    y: 340,
    w: 90,
    h: 170,
    color: '#0d47a1',
    accent: '#ff0000',
    hp: 100,
    velX: 0,
    velY: 0,
    onGround: true,
    crouching: false,
    blocking: false,
    hitstun: 0,
    attackCooldown: 0,
    comboCount: 0,
    lastAttackTime: 0,
    facing: -1
  };

  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  function shakeScreen(amount = 12) {
    shake.x = (Math.random()-0.5)*amount;
    shake.y = (Math.random()-0.5)*amount*0.6;
  }

  function addParticle(x, y, color = '#ff9800') {
    for(let i=0; i<12; i++) {
      particles.push({
        x, y,
        vx: (Math.random()-0.5)*14,
        vy: (Math.random()-0.5)*14 - 4,
        life: 22 + Math.random()*14,
        color
      });
    }
  }

  function addAttackPop(x, y, strength) {
    const names = {
      light: 'LP!',
      medium: 'MP!',
      heavy: 'HP!',
      hadouken: 'ATTITUDE ADJUSTMENT!'
    };
    const colors = {
      light: '#ffffff',
      medium: '#ffaa00',
      heavy: '#ff4400',
      hadouken: '#ff2200'
    };
    attackPops.push({
      x, y,
      text: names[strength],
      color: colors[strength],
      vy: -12,
      life: 60,
      scale: 1.0
    });
  }

  class Projectile {
    constructor(x, y, dir) {
      this.x = x;
      this.y = y;
      this.dir = dir;
      this.speed = 11;
      this.w = 50;
      this.h = 30;
      this.life = 180;
    }
    update() {
      this.x += this.speed * this.dir;
      this.life--;
    }
    draw() {
      ctx.fillStyle = 'rgba(255,140,0,0.9)';
      ctx.fillRect(this.x, this.y-15, this.w, this.h);
      ctx.fillStyle = 'rgba(255,220,80,0.7)';
      ctx.fillRect(this.x+8, this.y-11, this.w-16, this.h-8);
    }
  }

  function tryAttack(attacker, strength) {
    if (attacker.attackCooldown > 0 || attacker.hitstun > 0) return false;

    let damage = 0;
    let hitstun = 0;
    let knockback = 0;
    let cooldown = 12;

    switch(strength) {
      case 'light':
        damage = 9;
        hitstun = 14;
        knockback = 6;
        cooldown = 10;
        break;
      case 'medium':
        damage = 16;
        hitstun = 22;
        knockback = 11;
        cooldown = 18;
        break;
      case 'heavy':
        damage = 28;
        hitstun = 32;
        knockback = 18;
        cooldown = 28;
        break;
      case 'hadouken':
        const projX = attacker === p1 ? attacker.x + 80 : attacker.x - 50;
        projectiles.push(new Projectile(projX, attacker.y + 60, attacker === p1 ? 1 : -1));
        addAttackPop(attacker.x + attacker.w / 2, attacker.y - 20, 'hadouken');
        if (attacker === p2) playCenaVoice('hadouken');
        cooldown = 45;
        attacker.attackCooldown = cooldown;
        shakeScreen(6);
        return true;
    }

    const now = performance.now();
    if (now - attacker.lastAttackTime < 400 && attacker.comboCount > 0) {
      damage *= 0.85;
      attacker.comboCount++;
    } else {
      attacker.comboCount = 1;
    }
    attacker.lastAttackTime = now;

    const defender = attacker === p1 ? p2 : p1;
    const dist = Math.abs(attacker.x - defender.x);

    if (dist < 130) {
      let blocked = defender.blocking;
      if (defender.crouching && strength === 'heavy') blocked = false;

      let finalDmg = blocked ? Math.floor(damage * 0.3) : damage;
      defender.hp -= finalDmg;
      defender.hitstun = blocked ? 8 : hitstun;
      defender.velX += knockback * (defender.x > attacker.x ? 1 : -1) * (blocked ? 0.4 : 1);

      shakeScreen(blocked ? 5 : 14);
      addParticle(defender.x + defender.w/2, defender.y + 60);
      addAttackPop(attacker.x + attacker.w / 2, attacker.y - 20, strength);

      if (attacker === p2) playCenaVoice(strength);

      attacker.attackCooldown = cooldown;
      attacker.comboCount = blocked ? 0 : attacker.comboCount;

      if (defender.hp <= 0) defender.hp = 0;
      return true;
    }
    return false;
  }

  function update() {
    if (gameOver) return;

    shake.x *= 0.82;
    shake.y *= 0.82;

    voiceLines.forEach(v => {
      v.y += v.vy;
      v.life--;
      v.scale += 0.02;
      v.vy += 0.1;
    });
    voiceLines = voiceLines.filter(v => v.life > 0);

    attackPops.forEach(pop => {
      pop.y += pop.vy;
      pop.vy += 0.25;
      pop.life--;
      pop.scale = 1 + (60 - pop.life) / 60 * 0.8;
    });
    attackPops = attackPops.filter(pop => pop.life > 0);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5;
      p.life--;
    });
    particles = particles.filter(p => p.life > 0);

    projectiles.forEach(proj => {
      proj.update();

      const hitP1 = Math.abs(proj.x - p1.x) < 80 && Math.abs(proj.y - (p1.y+60)) < 70;
      const hitP2 = Math.abs(proj.x - p2.x) < 80 && Math.abs(proj.y - (p2.y+60)) < 70;

      if (hitP1 && proj.dir === -1) {
        p1.hp -= 22;
        p1.hitstun = 24;
        p1.velX += 14;
        shakeScreen(10);
        addParticle(p1.x + 40, p1.y + 60, '#ff5722');
        proj.life = 0;
      }
      if (hitP2 && proj.dir === 1) {
        p2.hp -= 22;
        p2.hitstun = 24;
        p2.velX -= 14;
        shakeScreen(10);
        addParticle(p2.x + 40, p2.y + 60, '#ff5722');
        proj.life = 0;
      }
    });
    projectiles = projectiles.filter(p => p.life > 0 && p.x > -100 && p.x < canvas.width + 100);

    const now = performance.now();
    if (p1.hp < 30 && p2.hp > 40 && now - lastTauntTime > 3000 && Math.random() < 0.015) {
      playCenaVoice(null, true);
      lastTauntTime = now;
    }

    p1.blocking = keys['s'];
    p1.crouching = keys['s'];

    if (p1.hitstun <= 0 && p1.attackCooldown <= 0) {
      p1.velX = 0;
      if (keys['a']) p1.velX = -6.5;
      if (keys['d']) p1.velX =  6.5;

      if (keys['w'] && p1.onGround) {
        p1.velY = -17.5;
        p1.onGround = false;
      }

      if (keys['j']) tryAttack(p1, 'light');
      if (keys['k']) tryAttack(p1, 'medium');
      if (keys['l']) tryAttack(p1, 'heavy');
      if (keys['q']) tryAttack(p1, 'hadouken');
    }

    p1.hitstun = Math.max(0, p1.hitstun - 1);
    p1.attackCooldown = Math.max(0, p1.attackCooldown - 1);

    p1.x += p1.velX;
    p1.velY += 0.95;
    p1.y += p1.velY;

    if (p1.y >= 340) {
      p1.y = 340;
      p1.velY = 0;
      p1.onGround = true;
    }
    p1.x = Math.max(40, Math.min(420, p1.x));

    if (p2.hitstun <= 0) {
      const dist = Math.abs(p1.x - p2.x);
      p2.blocking = (dist < 160 && Math.random() < 0.35);
      p2.crouching = (dist < 120 && Math.random() < 0.22);
    }

    if (p2.hitstun <= 0 && p2.attackCooldown <= 0) {
      const dist = p1.x - p2.x;
      const absDist = Math.abs(dist);

      if (absDist > 300) {
        p2.velX = dist > 0 ? 6.5 : -6.5;
      } else if (absDist > 140) {
        p2.velX = dist > 0 ? 6 : -6;
      } else {
        p2.velX = 0;
      }

      if (Math.random() < 0.01 && p2.onGround && p1.y < 300) {
        p2.velY = -15.5;
        p2.onGround = false;
      }

      const r = Math.random();
      if (absDist < 130) {
        if (r < 0.28) tryAttack(p2, 'light');
        else if (r < 0.50) tryAttack(p2, 'medium');
        else if (r < 0.65) tryAttack(p2, 'heavy');
      }
      if (absDist > 180 && absDist < 420 && r < 0.035) {
        tryAttack(p2, 'hadouken');
      }
    }

    p2.hitstun = Math.max(0, p2.hitstun - 1);
    p2.attackCooldown = Math.max(0, p2.attackCooldown - 1);

    p2.x += p2.velX;
    p2.velY += 0.95;
    p2.y += p2.velY;

    if (p2.y >= 340) {
      p2.y = 340;
      p2.velY = 0;
      p2.onGround = true;
    }
    p2.x = Math.max(480, Math.min(880, p2.x));

    if (p1.hp <= 0 || p2.hp <= 0) {
      gameOver = true;
      const winner = p1.hp > 0 ? "BRYDEN WINS!" : "JOHN CENA WINS!";
      document.getElementById('winner').textContent = winner;
      document.getElementById('winner').style.display = 'block';
      if (p2.hp > 0) {
        voiceLines.push({
          x: canvas.width / 2,
          y: 200,
          text: "YOU CAN'T SEE ME... BUT I SEE THE W! 🏆😂",
          life: 180,
          vy: 0,
          color: '#ffff00',
          scale: 2.0
        });
      }
    }
  }

  function draw() {
    ctx.save();
    ctx.translate(shake.x, shake.y);

    ctx.clearRect(-shake.x, -shake.y, canvas.width, canvas.height);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 460, canvas.width, 80);

    voiceLines.forEach(v => {
      ctx.save();
      ctx.globalAlpha = Math.sin(v.life / 20) * 0.95 + 0.05;
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetX = 8;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = v.color;
      ctx.font = `bold ${Math.floor(44 * v.scale)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(v.text, v.x, v.y);
      ctx.restore();
    });

    attackPops.forEach(pop => {
      ctx.save();
      ctx.globalAlpha = (pop.life / 60) * 0.9;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = pop.color;
      ctx.font = `bold ${Math.floor(36 * pop.scale)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });

    particles.forEach(p => {
      ctx.globalAlpha = p.life / 35;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x-3, p.y-3, 6, 6);
    });
    ctx.globalAlpha = 1;

    projectiles.forEach(p => p.draw());

    [p1, p2].forEach((p, i) => {
      const isP1 = i === 0;
      const facingRight = isP1;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(p.x + 10, 430, p.w - 20, 20);

      ctx.fillStyle = p.color;
      const bodyH = p.crouching ? 90 : 130;
      ctx.fillRect(p.x, p.y + (p.crouching ? 60 : 40), p.w, bodyH);

      ctx.fillStyle = '#ffe0b2';
      ctx.fillRect(p.x + 15, p.y + 10, p.w - 30, 55);
      if (!isP1) {
        ctx.fillStyle = '#d50000';
        ctx.fillRect(p.x + 10, p.y + 5, p.w - 20, 20);
      }

      ctx.fillStyle = '#000';
      ctx.fillRect(p.x + (facingRight ? 38 : 22), p.y + 30, 10, 10);

      if (!isP1) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(p.x + (facingRight ? -20 : p.w - 10), p.y + 50, 30, 60);
      }

      if (p.crouching) {
        ctx.fillStyle = '#333';
        ctx.fillRect(p.x - 10, p.y + bodyH, p.w + 20, 70);
      }

      if (p.blocking) {
        ctx.strokeStyle = isP1 ? '#2196f3' : '#ff1744';
        ctx.lineWidth = 8;
        ctx.strokeRect(p.x - 18, p.y - 10, p.w + 36, 180 + (p.crouching ? -40 : 0));
      }

      if (p.attackCooldown > 0 && p.attackCooldown > 15) {
        ctx.fillStyle = 'rgba(255,235,59,0.4)';
        const offset = facingRight ? p.w - 10 : -100;
        ctx.fillRect(p.x + offset, p.y + 40, 110, 90);
      }

      if (p.hp < 25) {
        ctx.fillStyle = 'rgba(244,67,54,0.35)';
        ctx.fillRect(p.x - 30, p.y - 20, p.w + 60, 190);
      }
    });

    ctx.restore();

    document.getElementById('p1-fill').style.width = Math.max(0, p1.hp) + '%';
    document.getElementById('p2-fill').style.width = Math.max(0, p2.hp) + '%';
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
});
</script>
</body>
</html>
