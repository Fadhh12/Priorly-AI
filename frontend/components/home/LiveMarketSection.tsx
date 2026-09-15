"use client";

import { useEffect, useState } from "react";
import { getInstruments, type Instrument } from "@/lib/api";
import { Hero } from "./Hero";
import { TickerStrip } from "./TickerStrip";

const POLL_INTERVAL_MS = 4000;

type LiveStatus = "loading" | "ready" | "error";

export function LiveMarketSection() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [status, setStatus] = useState<LiveStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const data = await getInstruments();
        if (cancelled) return;
        setInstruments(data);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus((prev) => (prev === "ready" ? prev : "error"));
      }
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <Hero status={status} instruments={instruments} />
      <TickerStrip instruments={instruments} />
    </>
  );
}
