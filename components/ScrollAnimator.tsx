'use client';

import { useEffect, useRef } from 'react';

export function ScrollAnimator({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      },
    );

    const currentRef = ref.current;

    if (currentRef) {
      const elements = currentRef.querySelectorAll('[data-scroll-animation]');
      elements.forEach((el) => observer.observe(el));
    }

    return () => {
      if (currentRef) {
        const elements = currentRef.querySelectorAll('[data-scroll-animation]');
        elements.forEach((el) => observer.unobserve(el));
      }
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
