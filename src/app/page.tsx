"use client";

import { useState } from "react";
import ControlPanel from "../components/ControlPanel";
import FluxCanvas from "../components/FluxCanvas";
import { defaultFluxSettings, type FluxSettings } from "../components/FluxCanvas";
import Footer from "../components/Footer";
import SchemePicker from "../components/SchemePicker";
import { colorSchemes, defaultSchemeId } from "../lib/colorSchemes";

export default function Home() {
  const [scheme, setScheme] = useState(
    () => colorSchemes.find((s) => s.id === defaultSchemeId) ?? colorSchemes[0]
  );
  const [settings, setSettings] = useState(defaultFluxSettings);

  const updateSettings = (next: Partial<FluxSettings>) => {
    setSettings((current) => ({ ...current, ...next }));
  };

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-black">
      <FluxCanvas scheme={scheme} settings={settings} />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-4 pt-5 sm:justify-start sm:pl-6">
        <SchemePicker value={scheme} onChange={setScheme} />
      </div>

      <ControlPanel
        settings={settings}
        onChange={updateSettings}
        onReset={() => setSettings(defaultFluxSettings)}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-5 sm:justify-start sm:pl-6">
        <a
          href="https://github.com/sandydoo/flux"
          target="_blank"
          rel="noreferrer noopener"
          className="pointer-events-auto rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        >
          inspired by sandydoo/flux ↗
        </a>
      </div>

      <Footer />
    </main>
  );
}
