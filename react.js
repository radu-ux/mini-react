/**
 * FIBER SHAPTE
 *
 * FIBER = {
 *  type --- string (host component), Function (react component), TEXT_ELEMENT (string)
 *  dom --- real dom representation of the fiber
 *  props --- react specific props
 *  parent --- fiber
 *  child --- fiber
 *  sibling --- fiber
 *  alternate --- alternate version of the fiber, used in reconcilaiation
 *  effectTag --- PLACEMENT / UPDATE / DELETION
 * }
 */

let wipFiber = null
let wipRoot = null
let currentRoot = null
let nextUnitOfWork = null
let deletions = null
let effects = []
let fibersWithEffects = []
let oldEffects = []
let hookIndex = 0

/** COMMIT PAHSE */
const isEvent = (key) => key.startsWith('on')
const isProperty = (key) => !isEvent(key)
const isNew = (prevProps, nextProps) => (key) =>
  prevProps[key] !== nextProps[key]
const isGone = (prevProps, nextProps) => (key) =>
  key in prevProps && !key in nextProps
function updateDom(dom, prevProps, nextProps) {
  // Remove old event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      (key) =>
        isGone(prevProps, nextProps)(key) || isNew(prevProps, nextProps)(key)
    )
    .forEach((event) => {
      const eventName = event.toLowerCase().substring(2)
      dom.removeEventListener(eventName, prevProps[event])
    })

  // Remove old attributes
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(
      (key) =>
        isGone(prevProps, nextProps)(key) || isNew(prevProps, nextProps)(key)
    )
    .forEach((attribute) => {
      dom[attribute] = ''
    })

  // Add new event listeners
  if (nextProps) {
    Object.keys(nextProps)
      .filter(isEvent)
      .filter(isNew(prevProps, nextProps))
      .forEach((event) => {
        const eventName = event.toLowerCase().substring(2)
        dom.addEventListener(eventName, nextProps[event])
      })

    // Add new properties
    Object.keys(nextProps)
      .filter(isProperty)
      .filter(isNew(prevProps, nextProps))
      .forEach((attribute) => (dom[attribute] = nextProps[attribute]))
  }
}
function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type)

  updateDom(dom, {}, fiber.props)

  return dom
}

function commitDeletion(domParent, fiber) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(domParent, fiber.child)
  }
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    domParent.appendChild(fiber.dom)
  }

  if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(
      fiber.dom,
      fiber.alternate ? fiber.alternate.props : {},
      fiber.props
    )
  }

  if (fiber.effectTag === 'DELETION') {
    commitDeletion(domParent, fiber)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function resetCurrentRoot() {
  let root = wipRoot.child
  while (root.parent) {
    root.reconcileSibling = undefined
    root = root.parent
  }

  currentRoot = root
}

function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  resetCurrentRoot()
  // currentRoot = wipRoot
  wipRoot = null
  commitEffects()
}

function render(container, element) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  }
  fibersWithEffects = []
  oldEffects = effects
  deletions = []
  effects = []
  nextUnitOfWork = wipRoot
}
/** END OF RENDER PHASE */

/** RENDER PHASE */
function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

function createElement(type, props, ...children) {
  if (type === undefined) {
    return null
  }

  return {
    type,
    props: {
      ...props,
      children: children
        .map((child) =>
          typeof child === 'object'
            ? child
            : child !== undefined
            ? createTextElement(child)
            : undefined
        )
        .flat(),
    },
  }
}
/** END OF RENDER PHASE */

/** RECONCILIATION PHASE */
function reconcileChildren(wipFiber, children) {
  let childIndex = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibiling = null
  // TO DO: check oldFiber.props.onClick === onClickFn

  while (childIndex < children.length || oldFiber) {
    let newFiber = null
    const element = children[childIndex]
    const isSameType = oldFiber && element && element.type === oldFiber.type

    if (isSameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: oldFiber.dom,
        alternate: oldFiber,
        parent: wipFiber,
        effectTag: 'UPDATE',
      }
    }

    if (element && !isSameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        alternate: null,
        parent: wipFiber,
        effectTag: 'PLACEMENT',
      }
    }

    if (!element && oldFiber) {
      oldFiber.effectTag = 'DELETION'
      deletions.push(oldFiber)
    }

    if (childIndex === 0) {
      wipFiber.child = newFiber
    } else if (element) {
      prevSibiling.sibling = newFiber
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    childIndex++
    prevSibiling = newFiber
  }
}

function updateFunctionComponent(fiber) {
  /**
   * we need to keep a refference to the current wip fiber in order to get back to it when main tharead finishes its job
   */
  wipFiber = fiber
  wipFiber.hooks = []
  wipFiber.effects = []
  hookIndex = 0
  const isFragment = fiber.type === Symbol.for('react.fragment')
  const children = isFragment
    ? fiber.props.children
    : [fiber.type(fiber.props)].flat()
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

function performUnitOfWork(fiber) {
  const isComponent = typeof fiber.type === 'function'
  const isFragment = fiber.type === Symbol.for('react.fragment')

  if (isComponent || isFragment) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // Return child as the next unit of work
  if (fiber.child) {
    return fiber.child
  }

  // Return any valid sibling as the next unit of work
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling && nextFiber.reconcileSibling !== false) {
      return nextFiber.sibling
    }

    // Check the parent siblings
    nextFiber = nextFiber.parent
  }
}

function workLoop(deadline) {
  let shouldExit = false
  while (nextUnitOfWork && !shouldExit) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldExit = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    // Entering the commit phase
    commitRoot()
  }

  requestIdleCallback(workLoop)
}
/** END OF RECONCILIATION PHASE */

/** HOOKS */

export function updateFiberInVDOM(fiber, current) {
  if (!current) {
    return
  }

  if (current.child && current.child.type === fiber.type) {
    if (current.child.sibling) {
      fiber.sibling = current.child.sibling
    }
    current.child = fiber
    fiber.parent = current

    return
  }

  if (current.sibling && current.sibling.type === fiber.type) {
    if (current.sibling.sibling) {
      fiber.sibling = current.sibling.sibling
    }
    current.sibling = fiber
    fiber.parent = current.parent

    return
  }

  if (current.child) {
    updateFiberInVDOM(fiber, current.child)
  } else if (current.sibling) {
    updateFiberInVDOM(fiber, current.sibling)
  } else if (current.parent) {
    updateFiberInVDOM(fiber, current.parent.sibling)
  }
}

export function useReducer(initial, reducerFn) {
  let currentFiber = wipFiber
  let currentHookIndex = hookIndex
  const oldHook =
    wipFiber &&
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }
  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    const newState = reducerFn
      ? reducerFn(hook.state, action)
      : typeof action === 'function'
      ? action(hook.state)
      : action
    hook.state = newState
  })

  const dispatch = (action) => {
    hook.queue.push(action)
    nextUnitOfWork = {
      type: currentFiber.type,
      hooks: currentFiber.hooks,
      effects: currentFiber.effects,
      props: currentFiber.props,
      dom: currentFiber.dom,
      alternate: currentFiber,
      child: currentFiber.child,
      reconcileSibling: false,
      effectTag: 'UPDATE',
    }
    wipRoot = { ...currentRoot }
    updateFiberInVDOM(nextUnitOfWork, wipRoot)
    wipRoot = nextUnitOfWork
    deletions = []
  }

  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, dispatch]
}

function useState(initial) {
  return useReducer(initial)
}

function useRef(init) {
  const oldHook =
    wipFiber &&
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const hook = { current: oldHook ? oldHook.current : init }

  wipFiber.hooks.push(hook)
  hookIndex++

  return hook
}

function useMemo(cb, deps) {
  const oldHook =
    wipFiber &&
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const oldHookDeps = oldHook && oldHook.deps
  const hook = {
    memoResult: oldHookDeps
      ? deps.some((d, i) => !Object.is(d, oldHookDeps[i]))
        ? cb()
        : oldHook.memoResult
      : cb(),
    deps: deps,
  }

  wipFiber.hooks.push(hook)
  hookIndex++

  return hook.memoResult
}

function useCallback(cb, deps) {
  return useMemo(() => cb, deps)
}

function useSyncExternalStore(subscribe, getSnapshot) {
  const [state, setState] = useState(getSnapshot())

  useEffect(() => {
    const unsubscribe = subscribe(setState)

    return () => {
      unsubscribe()
    }
  }, [setState])

  return state
}

function useEffect(effect, deps) {
  if (wipFiber.effects) {
    wipFiber.effects.push({ effect, deps })
  } else {
    wipFiber.effects = [{ effect, deps }]
  }
  fibersWithEffects.push(wipFiber)
}
function commitEffects() {
  let index = fibersWithEffects.length - 1
  while (index >= 0) {
    const fiber = fibersWithEffects[index]
    const oldFiber = fiber.alternate

    for (
      let effectIndex = 0;
      effectIndex < fiber.effects.length;
      effectIndex++
    ) {
      const newEffect = fiber.effects[effectIndex]
      if (!oldFiber) {
        const cleanup = newEffect.effect()
        newEffect.cleanup = cleanup
      } else {
        const oldEffect = oldFiber.effects[effectIndex]
        const depsHaveChanged = newEffect.deps.some(
          (d, i) => !Object.is(d, oldEffect.deps[i])
        )

        if (depsHaveChanged) {
          oldEffect.cleanup?.()
        }

        newEffect.cleanup = newEffect.effect()
      }
    }

    index--
  }

  fibersWithEffects = []
}

function useContext(context) {
  let parentWithContextFiber = wipFiber.parent
  while (parentWithContextFiber && parentWithContextFiber.context !== context) {
    parentWithContextFiber = parentWithContextFiber.parent
  }

  return parentWithContextFiber?.context.value
}
function useSubscribeToContext(context) {
  if (!wipFiber || (wipFiber && !Object.is(wipFiber.context, context))) {
    wipFiber.context = context
  }
}
function createContext(initial) {
  const context = {
    value: initial,
    Provider({ value, children }) {
      context.value = value

      useSubscribeToContext(context)

      return children
    },
  }

  return context
}
/** END OF HOOKS */

/** REACT BOOTSTRAPING */
requestIdleCallback(workLoop)
/** END OF REACT BOOTSTRAPING */

/** REACT DEFINITION */
export const React = {
  createElement,
  createContext,
  useState,
  useReducer,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useSyncExternalStore,
  Fragment: Symbol.for('react.fragment'),
}
/** END OF REACT DEFINITION  */

/** REACTDOM DEFINITION */
export const ReactDOM = {
  render,
}
/** END OF REACTDOM DEFINITION */
