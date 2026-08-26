import { ref } from 'vue'

/** Shared centered-snap carousel state used by dense mobile dashboard sections. */
export function useSnapCarousel() {
  const scroller = ref<HTMLElement | null>(null)
  const activeIndex = ref(0)

  function updateActiveIndex() {
    const element = scroller.value
    if (!element) return

    const viewportCenter = element.scrollLeft + element.clientWidth / 2
    const items = Array.from(element.children) as HTMLElement[]
    let closestIndex = 0
    let closestDistance = Number.POSITIVE_INFINITY

    items.forEach((item, index) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2
      const distance = Math.abs(itemCenter - viewportCenter)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    activeIndex.value = closestIndex
  }

  function scrollToIndex(index: number) {
    const element = scroller.value
    const item = element?.children[index] as HTMLElement | undefined
    if (!element || !item) return

    element.scrollTo({
      left: item.offsetLeft - (element.clientWidth - item.offsetWidth) / 2,
      behavior: 'smooth',
    })
  }

  return { scroller, activeIndex, updateActiveIndex, scrollToIndex }
}
