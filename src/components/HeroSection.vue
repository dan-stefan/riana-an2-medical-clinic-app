<template>
  <div class="hero-section">
    <div class="hero-content">
      <h1>Aici se dezvolta proiectul lui Dan</h1>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HeroSection'
}
</script>

<style scoped>
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.hero-content {
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 3rem;
  color: #2c3e50;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}
</style> 