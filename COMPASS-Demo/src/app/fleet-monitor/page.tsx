"use client";

import { Header } from "@/components";

const A400_URL =
  process.env.NEXT_PUBLIC_A400_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net"
    : "http://localhost:3000");

export default function FleetMonitorPage() {
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Header />
      <iframe
        src={A400_URL}
        className="flex-1 w-full border-0"
        allow="accelerometer; gyroscope"
        title="Sentry AI Fleet Monitor"
      />
    </div>
  );
}
