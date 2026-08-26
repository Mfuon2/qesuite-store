import { ref, nextTick, onBeforeUnmount, type Ref } from 'vue';

/**
 * Shared trigger+teleported-panel behavior for QeSelect / QeDatePicker:
 * fixed-position placement that flips above the trigger when there isn't
 * room below, plus outside-click/scroll/resize handling. Both components
 * render their panel via <Teleport to="body"> so it escapes any clipping
 * ancestor (a scrollable modal, an overflow-hidden card, ...).
 */
export function useFloatingPanel(maxPanelHeight = 320, opts: { matchTriggerWidth?: boolean } = {}) {
  const matchTriggerWidth = opts.matchTriggerWidth ?? true;
  const triggerRef: Ref<HTMLElement | null> = ref(null);
  const panelRef: Ref<HTMLElement | null> = ref(null);
  const open = ref(false);
  const panelStyle = ref<Record<string, string>>({});

  function updatePosition() {
    const trigger = triggerRef.value;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom;
    const openUpward = spaceBelow < maxPanelHeight && rect.top > spaceBelow;

    const style: Record<string, string> = {
      position: 'fixed',
      maxHeight: `${maxPanelHeight}px`,
      ...(openUpward ? { bottom: `${viewportH - rect.top + 6}px` } : { top: `${rect.bottom + 6}px` }),
    };

    if (matchTriggerWidth) {
      style.left = `${rect.left}px`;
      style.width = `${rect.width}px`;
    } else {
      // Panel has its own intrinsic width (e.g. a calendar grid) — clamp its
      // left edge so it stays fully on-screen regardless of trigger position.
      const panelWidth = panelRef.value?.getBoundingClientRect().width ?? rect.width;
      const left = Math.min(Math.max(rect.left, 8), viewportW - panelWidth - 8);
      style.left = `${left}px`;
    }

    panelStyle.value = style;
  }

  function onScrollOrResize() {
    if (open.value) updatePosition();
  }

  function onDocumentPointerDown(e: PointerEvent) {
    const target = e.target as Node;
    if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) return;
    hide();
  }

  function attachGlobalListeners() {
    window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
  }

  function detachGlobalListeners() {
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  }

  async function show() {
    if (open.value) return;
    open.value = true;
    await nextTick();
    updatePosition();
    attachGlobalListeners();
  }

  function hide() {
    if (!open.value) return;
    open.value = false;
    detachGlobalListeners();
  }

  function toggle() {
    if (open.value) hide();
    else show();
  }

  function focusTrigger() {
    triggerRef.value?.focus();
  }

  onBeforeUnmount(detachGlobalListeners);

  return { triggerRef, panelRef, open, panelStyle, show, hide, toggle, focusTrigger, updatePosition };
}
