export const getContextBoxPosition = (event, ref, extraTop = 0, extraLeft = 0) => {
    const viewportHeight = window.innerHeight - extraTop
    const viewportWidth = window.innerWidth - extraLeft
    const boxWidth = ref.current?.offsetWidth
    const boxHeight = ref.current?.offsetHeight

    let top = event.clientY
    let left = event.clientX

    if (top + boxHeight > viewportHeight) {
        top = viewportHeight - boxHeight
    }

    if (left + boxWidth > viewportWidth) {
        left = viewportWidth - boxWidth
    }

    if (top < 0) {
        top = 0
    }

    if (left < 0) {
        left = 0
    }

    return (
        { top, left }
    )
}