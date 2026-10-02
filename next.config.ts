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
    ],
  },
};

export default nextConfig;
