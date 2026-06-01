"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface EffectContextType {
  mouseTrail: boolean;
  seasonalEffect: boolean;
  starTrail: boolean;
  toggleMouseTrail: () => void;
  toggleSeasonalEffect: () => void;
  toggleStarTrail: () => void;
}

const EffectContext = createContext<EffectContextType>({
  mouseTrail: false,
  seasonalEffect: true,
  starTrail: false,
  toggleMouseTrail: () => {},
  toggleSeasonalEffect: () => {},
  toggleStarTrail: () => {},
});

export function EffectProvider({ children }: { children: ReactNode }) {
  const [mouseTrail, setMouseTrail] = useState(false);
  const [seasonalEffect, setSeasonalEffect] = useState(true);
  const [starTrail, setStarTrail] = useState(false);

  useEffect(() => {
    const savedTrail = localStorage.getItem("custom_mouseTrail");
    const savedSeasonal = localStorage.getItem("custom_seasonalEffect");
    const savedStar = localStorage.getItem("custom_starTrail");
    if (savedTrail !== null) setMouseTrail(savedTrail === "true");
    if (savedSeasonal !== null) setSeasonalEffect(savedSeasonal === "true");
    if (savedStar !== null) setStarTrail(savedStar === "true");
  }, []);

  const toggleMouseTrail = () => {
    setMouseTrail((prev) => { localStorage.setItem("custom_mouseTrail", String(!prev)); return !prev; });
  };
  const toggleSeasonalEffect = () => {
    setSeasonalEffect((prev) => { localStorage.setItem("custom_seasonalEffect", String(!prev)); return !prev; });
  };
  const toggleStarTrail = () => {
    setStarTrail((prev) => { localStorage.setItem("custom_starTrail", String(!prev)); return !prev; });
  };

  return (
    <EffectContext.Provider value={{ mouseTrail, seasonalEffect, starTrail, toggleMouseTrail, toggleSeasonalEffect, toggleStarTrail }}>
      {children}
    </EffectContext.Provider>
  );
}

export function useEffects() {
  return useContext(EffectContext);
}
