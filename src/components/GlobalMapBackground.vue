<template>
  <div class="map-background">
    <div class="map-grid"></div>
    <div class="map-dots">
      <div v-for="n in 20" :key="n" class="map-dot" :style="getDotStyle(n)"></div>
    </div>
    <!-- 浮动装饰元素 -->
    <div class="floating-shape shape-1"></div>
    <div class="floating-shape shape-2"></div>
    <div class="floating-shape shape-3"></div>
  </div>
</template>

<script setup>
const getDotStyle = (n) => {
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.5 + 0.2
  }
}
</script>

<style scoped>
.map-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, #f8fafc 0%, #e2e8f0 100%);
  pointer-events: none; /* 确保不阻挡点击 */
}

.map-grid {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background-image: 
    linear-gradient(rgba(203, 213, 225, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(203, 213, 225, 0.3) 1px, transparent 1px);
  background-size: 40px 40px;
  transform: perspective(500px) rotateX(60deg);
  opacity: 0.5;
}

.map-dots {
  position: absolute;
  width: 100%;
  height: 100%;
}

.map-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  animation: pulse 3s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.4; }
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: rgba(59, 130, 246, 0.2);
  top: -100px;
  left: -100px;
}

.shape-2 {
  width: 300px;
  height: 300px;
  background: rgba(236, 72, 153, 0.2);
  bottom: -50px;
  right: -50px;
  animation-delay: -10s;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: rgba(16, 185, 129, 0.2);
  top: 40%;
  left: 60%;
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  50% { transform: translate(30px, 50px); }
  100% { transform: translate(0, 0); }
}
</style>
