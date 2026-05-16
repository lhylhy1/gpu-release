<template>
  <section class="banner">
    <div class="banner-content">
      <div class="banner-logo">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 18.36V15.24C17.64 15.12 17.76 15 17.88 15H30.12C30.24 15 30.36 15.12 30.36 15.24V18.36C30.36 18.48 30.24 18.6 30.12 18.6H17.88C17.76 18.6 17.64 18.48 17.64 18.36Z" fill="#76B900"/>
          <path d="M20.76 22.2V19.08C20.76 18.96 20.88 18.84 21 18.84H27C27.12 18.84 27.24 18.96 27.24 19.08V22.2C27.24 22.32 27.12 22.44 27 22.44H21C20.88 22.44 20.76 22.32 20.76 22.2Z" fill="#76B900"/>
          <path d="M24 26.16V23.04C24 22.92 24.12 22.8 24.24 22.8H30C30.12 22.8 30.24 22.92 30.24 23.04V26.16C30.24 26.28 30.12 26.4 30 26.4H24.24C24.12 26.4 24 26.28 24 26.16Z" fill="#76B900"/>
          <path d="M17.64 26.16V23.04C17.64 22.92 17.76 22.8 17.88 22.8H23.64C23.76 22.8 23.88 22.92 23.88 23.04V26.16C23.88 26.28 23.76 26.4 23.64 26.4H17.88C17.76 26.4 17.64 26.28 17.64 26.16Z" fill="#76B900"/>
          <path d="M24 30.12V27C24 26.88 24.12 26.76 24.24 26.76H30C30.12 26.76 30.24 26.88 30.24 27V30.12C30.24 30.24 30.12 30.36 30 30.36H24.24C24.12 30.36 24 30.24 24 30.12Z" fill="#76B900"/>
          <path d="M17.64 30.12V27C17.64 26.88 17.76 26.76 17.88 26.76H23.64C23.76 26.76 23.88 26.88 23.88 27V30.12C23.88 30.24 23.76 30.36 23.64 30.36H17.88C17.76 30.36 17.64 30.24 17.64 30.12Z" fill="#76B900"/>
          <path d="M6 33V15C6 10.03 10.03 6 15 6H33C37.97 6 42 10.03 42 15V33C42 37.97 37.97 42 33 42H15C10.03 42 6 37.97 6 33Z" stroke="#76B900" stroke-width="2"/>
        </svg>
        <span>NVIDIA Data Center</span>
      </div>
      <h1>GPU Driver Releases</h1>
      <p>Linux Data Center GPU driver aggregation — download .run installers, review fixed issues, and access full release notes.</p>
    </div>
  </section>
</template>

<style scoped>
.banner {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-bottom: 3px solid var(--nv-green);
  padding: 60px 0 50px;
  position: relative;
  overflow: hidden;
}

.banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2376B900' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.banner-logo {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.banner-logo svg {
  width: 48px;
  height: 48px;
}

.banner-logo span {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--nv-green);
}

.banner h1 {
  font-size: 42px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.banner p {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 600px;
}

@media (max-width: 480px) {
  .banner {
    padding: 40px 0 30px;
  }
  .banner h1 {
    font-size: 22px;
  }
  .banner p {
    font-size: 15px;
  }
}
</style>