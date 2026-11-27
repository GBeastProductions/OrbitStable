import React from 'react';
import { motion } from 'motion/react';

interface ArcadeSwitchProps {
  checked: boolean;
  onToggle: () => void;
  labelOn?: string;
  labelOff?: string;
}

export const ArcadeSwitch: React.FC<ArcadeSwitchProps> = ({
  checked,
  onToggle,
  labelOn = 'ON',
  labelOff = 'OFF',
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`tactile-btn lazer-slant-sm relative inline-flex min-w-[76px] items-center justify-between gap-2 border px-3 py-1.5 text-xs font-bold cursor-pointer ${
        checked
          ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
          : 'border-white/15 bg-[#121622] text-[#a1abbe] hover:border-white/30'
      }`}
    >
      <span className="lazer-unslant-sm flex w-full items-center justify-between gap-2 whitespace-nowrap">
        <span className="tabular-nums text-[11px] font-extrabold tracking-wide">
          {checked ? labelOn : labelOff}
        </span>
        <span
          className={`h-2 w-2 rounded-full ${
            checked ? 'bg-white' : 'bg-white/25'
          }`}
        />
      </span>
    </button>
  );
};

interface ZoomWarpTransitionProps {
  active: boolean;
  label: string;
}

export const ZoomWarpTransition: React.FC<ZoomWarpTransitionProps> = ({ active, label }) => {
  if (!active) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#07080d]/92"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="lazer-slant border-y-2 border-[var(--accent-bright)] bg-[#0f131f]/95 px-12 py-6 text-center"
      >
        <div className="lazer-unslant">
          <p className="text-xs font-semibold tracking-[0.26em] text-[#22d3ee] uppercase">
            ステージ開始 · Launching Stage
          </p>
          <p className="font-display mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-white">
            {label}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
