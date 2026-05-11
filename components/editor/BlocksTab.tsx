'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { EditorBundle } from '@/lib/editor/bundle';
import type { SectionKey } from '@/lib/editor/section-order';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';
import { SECTIONS } from '@/lib/editor/sections';
import { EditorPane } from './EditorPane';
import { 
  UserCircle, 
  Music, 
  Camera, 
  Briefcase, 
  Link as LinkIcon, 
  Mail, 
  Download, 
  LayoutGrid,
  ChevronDown, 
  GripVertical,
  type LucideIcon
  } from 'lucide-react';

  export interface BlocksTabProps {
  active: SectionKey | null;
  order: SectionKey[];
  bundle: EditorBundle;
  supabaseUserId: string;
  onSelect: (key: SectionKey | null) => void;
  onReorder: (next: SectionKey[]) => void;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
  }

  const SECTION_META: Record<SectionKey, { icon: LucideIcon; subtitle: string }> = {
  hero: { icon: UserCircle, subtitle: 'Bio & Identificação' },
  about: { icon: UserCircle, subtitle: 'Sobre o artista' },
  services: { icon: Briefcase, subtitle: 'Catálogo de serviços' },
  photoGallery: { icon: Camera, subtitle: 'Fotos e registros' },
  socialLinks: { icon: LinkIcon, subtitle: 'Redes sociais' },
  contact: { icon: Mail, subtitle: 'Contato terminal' },
  pressKitLink: { icon: Download, subtitle: 'Download presskit' },
  featuredTrack: { icon: Music, subtitle: 'Sets e mixes' },
  instagramFeed: { icon: LayoutGrid, subtitle: 'Feed social' },
};

export function BlocksTab({
  active,
  order,
  bundle,
  supabaseUserId,
  onSelect,
  onReorder,
  onMutate,
}: BlocksTabProps) {
  const [draggedKey, setDraggedKey] = useState<SectionKey | null>(null);

  const handleDragStart = (key: SectionKey) => {
    setDraggedKey(key);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetKey: SectionKey) => {
    if (!draggedKey || draggedKey === targetKey) return;

    const draggedIdx = order.indexOf(draggedKey);
    const targetIdx = order.indexOf(targetKey);

    const next = [...order];
    next.splice(draggedIdx, 1);
    next.splice(targetIdx, 0, draggedKey);

    onReorder(next);
    setDraggedKey(null);
  };

  return (
    <div className="flex flex-col gap-2 px-3 pb-4 pt-4">
      {order.map((key) => {
        const section = SECTIONS[key];
        const isOpen = active === key;
        const displayName = section.label || key;
        const meta = SECTION_META[key] || { icon: LayoutGrid, subtitle: 'Seção de conteúdo' };
        const Icon = meta.icon;

        return (
          <div
            key={key}
            draggable
            onDragStart={() => handleDragStart(key)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(key)}
            className={cn(
              'group border overflow-hidden transition-all rounded-lg',
              'bg-surface border-border',
              isOpen ? 'border-l-2 border-l-accent shadow-sm' : 'border-l-2 border-l-transparent',
              draggedKey === key && 'opacity-60',
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(isOpen ? null : key)}
              className={cn(
                'w-full px-3.5 h-[60px] flex items-center gap-3 cursor-pointer transition-all duration-300 text-left',
                isOpen ? 'bg-[#161616]' : 'hover:bg-[#111]',
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center transition-all duration-300 rounded",
                isOpen ? "text-accent bg-accent/10" : "text-text-muted group-hover:text-white"
              )}>
                 <Icon size={18} />
              </div>

              <div className="flex flex-1 flex-col overflow-hidden">
                <span className={cn(
                  "truncate text-[13px] font-bold uppercase tracking-tight transition-colors",
                  isOpen ? "text-accent" : "text-white"
                )}>
                  {displayName}
                </span>
                <span className={cn(
                  "truncate text-[11px] transition-colors",
                  isOpen ? "text-accent/60" : "text-text-muted group-hover:text-[#888]"
                )}>
                  {meta.subtitle}
                </span>
              </div>

              <div className="flex items-center gap-2 text-text-muted">
                <ChevronDown
                  size={14}
                  className={cn(
                    'transition-transform duration-300 ease-in-out',
                    isOpen && 'rotate-180 text-accent'
                  )}
                />
                <div 
                  aria-hidden="true"
                  className={cn(
                    'transition-all duration-300 cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-white/10',
                    'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0',
                    isOpen && 'opacity-100 translate-x-0'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical size={14} className={isOpen ? "text-accent" : ""} />
                </div>
              </div>
            </button>

            <div className={cn(
              "grid transition-[grid-template-rows] duration-200 ease-in-out motion-reduce:transition-none",
              isOpen ? "grid-rows-[1fr] border-t border-border" : "grid-rows-[0fr]"
            )}>
              <div className="overflow-hidden">
                <div className="px-3.5 py-4">
                  {isOpen && (
                    <EditorPane
                      active={key}
                      bundle={bundle}
                      supabaseUserId={supabaseUserId}
                      onMutate={onMutate}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
