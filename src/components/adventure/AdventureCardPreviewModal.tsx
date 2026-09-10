import React from 'react';
import { X, Zap } from 'lucide-react';
import { AdventureStage } from '../../types';

interface AdventureCardPreviewModalProps {
  stage: AdventureStage | null;
  onClose: () => void;
}

/**
 * High-resolution pixel art inspect modal for Adventure Path character cards.
 */
export const AdventureCardPreviewModal: React.FC<AdventureCardPreviewModalProps> = ({
  stage,
  onClose
}) => {
  if (!stage) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#141414] border border-[#333] rounded-xl shadow-2xl overflow-hidden text-white flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top */}
        <div className="p-4 bg-gradient-to-r from-[#1c1c1c] to-[#161616] border-b border-[#282828] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-amber-400 font-mono">
              LEVEL {stage.stageNumber}
            </span>
            <span className="text-neutral-500">•</span>
            <h3 className="text-sm font-bold text-white tracking-wide">
              {stage.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Character Card Visual */}
          <div className="w-48 sm:w-52 aspect-[3/4] shrink-0 rounded-lg overflow-hidden border-2 border-[#383838] shadow-2xl bg-black/90 relative group">
            {stage.imageUrl ? (
              <img
                src={stage.imageUrl}
                alt={stage.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl bg-neutral-900">
                {stage.badgeIcon?.startsWith('/') || stage.badgeIcon?.endsWith('.svg') || stage.badgeIcon?.endsWith('.png') ? (
                  <img src={stage.badgeIcon} alt={stage.title} className="w-20 h-20 object-contain" />
                ) : (
                  stage.badgeIcon
                )}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 text-center">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-300">
                {stage.title}
              </span>
            </div>
          </div>

          {/* Character Lore & Details */}
          <div className="space-y-3 flex-1 text-left">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Role Tier Rank
              </span>
              <h4 className="text-base font-bold text-white">
                {stage.title}
              </h4>
              <p className="text-xs text-amber-300 font-mono">
                {stage.subtitle}
              </p>
            </div>

            <div className="p-3 bg-[#1a1a1a] rounded border border-[#2b2b2b]">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Chronicle Lore
              </span>
              <p className="text-xs text-neutral-300 italic leading-relaxed">
                "{stage.lore}"
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Operational Mandate
              </span>
              <p className="text-xs text-neutral-200">
                {stage.objective}
              </p>
            </div>

            {/* Rewards pill */}
            <div className="pt-2 border-t border-[#262626] flex items-center gap-3">
              <div>
                <span className="text-[9px] uppercase font-bold text-neutral-400 block">
                  Rank Bounty
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  +{stage.xpReward} XP
                </span>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-neutral-400 block">
                  Unlocked Title
                </span>
                <span className="text-xs font-semibold text-white flex items-center gap-1">
                  {stage.badgeIcon?.startsWith('/') || stage.badgeIcon?.endsWith('.svg') || stage.badgeIcon?.endsWith('.png') ? (
                    <img src={stage.badgeIcon} alt="badge" className="w-4 h-4 object-contain inline-block" />
                  ) : (
                    <span>{stage.badgeIcon}</span>
                  )}
                  <span>{stage.badgeTitle}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-3 bg-[#111] border-t border-[#252525] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
