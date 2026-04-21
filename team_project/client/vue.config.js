module.exports = {
  assetsDir: "@/assets/",
  devServer: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        pathRewrite: { "^/api": "" },
      },
      "/uploads": {
        target: "http://localhost:3000", // ← 여기도 서버로 프록시
        changeOrigin: true,
      },
    },
  },

  //outputDir: "../server/public",
};
