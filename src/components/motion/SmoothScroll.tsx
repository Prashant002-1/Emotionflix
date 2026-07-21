import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useLocation } from 'react-router-dom';

const SmoothScroll = () => {
  const location = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cleanupReveal: (() => void) | undefined;

    document.documentElement.style.removeProperty('--page-scroll');
    document.documentElement.style.removeProperty('--page-progress');

    if (location.pathname !== '/') {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => element.dataset.revealState = 'visible');
      return;
    }

    const startRevealObserver = () => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
      if (motionQuery.matches) {
        elements.forEach(element => element.dataset.revealState = 'visible');
        const reducedMutationObserver = new MutationObserver(() => {
          document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => element.dataset.revealState = 'visible');
        });
        reducedMutationObserver.observe(document.body, { childList: true, subtree: true });
        return () => reducedMutationObserver.disconnect();
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.revealState = 'visible';
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      const observeReveals = (root: ParentNode = document) => {
        root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-observed])').forEach(element => {
          element.dataset.revealObserved = 'true';
          observer.observe(element);
        });
      };
      observeReveals();
      const mutationObserver = new MutationObserver(records => {
        records.forEach(record => record.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            if (node.matches('[data-reveal]:not([data-reveal-observed])')) {
              node.dataset.revealObserved = 'true';
              observer.observe(node);
            }
            observeReveals(node);
          }
        }));
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
      return () => {
        observer.disconnect();
        mutationObserver.disconnect();
      };
    };

    const mount = () => {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      cleanupReveal?.();

      if (!motionQuery.matches) {
        const lenis = new Lenis({
          anchors: { offset: -72 },
          autoToggle: true,
          autoRaf: true,
          lerp: 0.1,
          overscroll: false,
          smoothWheel: true,
          stopInertiaOnNavigate: true,
          syncTouch: false,
          wheelMultiplier: 1,
        });
        lenisRef.current = lenis;
      }

      cleanupReveal = startRevealObserver();
    };

    mount();
    motionQuery.addEventListener('change', mount);
    return () => {
      motionQuery.removeEventListener('change', mount);
      cleanupReveal?.();
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [location.pathname]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!location.hash) lenisRef.current?.scrollTo(0, { immediate: true });
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) element.dataset.revealState = 'visible';
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);

  return null;
};

export default SmoothScroll;
