import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image で最適化・表示してよい外部ドメインの許可リスト。
    // GoogleログインのプロフィールアイコンURLがこのドメインから配信されるため追加。
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        // 楽天ブックスの表紙画像
        protocol: "https",
        hostname: "thumbnail.image.rakuten.co.jp",
      },
      {
        // Google Booksの表紙画像
        protocol: "https",
        hostname: "books.google.com",
      },
    ],
  },
};

export default nextConfig;
