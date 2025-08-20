// app.js
App({
  onLaunch() {
    // 在小程序启动时设置全局数据
    this.globalData = {
      BACKEND_URL: 'YOUR_BACKEND_URL_HERE' // <--- 请将此替换为您的实际后端API地址
    };
  },
  globalData: {
    // 初始值，onLaunch 会覆盖
    BACKEND_URL: '' 
  }
});