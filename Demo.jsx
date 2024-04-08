import { React, ReactDOM } from './react'

function crearteTodoStore(initialTodos = []) {
  let store = initialTodos
  let nextId = initialTodos[initialTodos.length - 1]?.id ?? 1
  const listeners = new Set()

  const fakeAPICall =
    (cb, delay = 300) =>
    (...args) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(cb(...args))
        }, delay)
      })
    }

  const emitChanges = () => {
    listeners.forEach((l) => l(store))
  }

  const subscribe = (subscriber) => {
    console.log('subscribing')
    listeners.add(subscriber)

    return () => {
      listeners.delete(subscriber)
    }
  }

  const add = fakeAPICall(({ title, description, createdAt }) => {
    store = [...store, { id: nextId, title, description, createdAt }]
    nextId++
    emitChanges()

    return store[store.length - 1]
  })

  const remove = fakeAPICall((id) => {
    store = store.filter((todo) => todo.id !== id)
    emitChanges()
    return id
  }, 3000)

  const get = () => {
    return store
  }

  const getListeners = () => {
    return listeners
  }

  return {
    subscribe,
    add,
    remove,
    get,
    getListeners,
  }
}

const todoStore = crearteTodoStore()

function useTodos() {
  return React.useSyncExternalStore(todoStore.subscribe, todoStore.get)
}

function useMutation(cb, options) {
  const [fetching, setFetching] = React.useState(false)
  const [error, setError] = React.useState(null)

  const mutate = async (args) => {
    try {
      setFetching(true)
      const response = await cb(args)
      setFetching(false)
      options?.onSuccess?.(response)
    } catch (e) {
      setError(e)
      options?.onError?.(e)
      setFetching(false)
    }
  }

  return { mutate, fetching, error }
}

function useSaveTodo(options) {
  return useMutation(todoStore.add, options)
}

function useDeleteTodo(options) {
  return useMutation(todoStore.remove, options)
}

function Todo({ title, description, createdAt, id }) {
  const deleteTodo = useDeleteTodo()

  const onRemove = async () => {
    await deleteTodo.mutate(id)
  }

  return (
    <div className="todo">
      <p className="todo__title">{title}</p>
      <p className="todo__createdAt">Created at: {createdAt}</p>
      <p className="todo__description">{description}</p>
      <button
        className="todo__remove"
        onClick={onRemove}
        disabled={deleteTodo.fetching}
      >
        X
      </button>
    </div>
  )
}

function App() {
  const todos = useTodos()
  const saveTodo = useSaveTodo()

  const onSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const formData = new FormData(e.target)
    const title = formData.get('title')
    const description = formData.get('description')
    const createdAt = new Date().toLocaleDateString()

    saveTodo.mutate({ title, description, createdAt })
  }

  return (
    <div className="todos">
      <form onSubmit={onSubmit} className="todos__form">
        <div className="todos__form__input_group">
          <label htmlFor="title" aria-hidden>
            Title
          </label>
          <input
            type="text"
            name="title"
            placeholder="Enter todo title"
            required
          />
        </div>
        <div className="todos__form__input_group">
          <label htmlFor="description" aria-hidden>
            Description
          </label>
          <textarea
            type="text"
            name="description"
            placeholder="Enter todo description"
            required
          />
        </div>
        <button type="submit" disabled={saveTodo.fetching}>
          Add Todo
        </button>
      </form>
      <div className="todos__container">
        {todos.map((todo) => (
          <Todo
            key={todo.id}
            id={todo.id}
            title={todo.title}
            description={todo.description}
            createdAt={todo.createdAt}
          />
        ))}
      </div>
    </div>
  )
}

ReactDOM.render(document.getElementById('root'), <App />)
