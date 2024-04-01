import { React, ReactDOM } from './react'

let todoId = 0
let todos = []
const listeners = new Set()

function emitChanges() {
  listeners.forEach((l) => l(todos))
}

const todoStore = {
  addTodo() {
    todos = [...todos, { id: todoId++, text: `Todo #${todoId}` }]
    emitChanges()
  },
  subscribe(cb) {
    listeners.add(cb)

    return () => {
      listeners.delete(cb)
    }
  },
  getSnapshot() {
    return todos
  },
}

function Button() {
  console.log('button')
  const [counter, setCount] = React.useState(0)

  return (
    <button
      onClick={() => {
        setCount(counter + 1)
      }}
    >
      Counter {counter}
    </button>
  )
}

function Todos() {
  console.log('todos')
  const todos = React.useSyncExternalStore(
    todoStore.subscribe,
    todoStore.getSnapshot
  )

  const onClick = () => {
    todoStore.addTodo()
  }

  return (
    <div>
      <button onClick={onClick}>Add Todo</button>
      <div>{JSON.stringify(todos)}</div>
    </div>
  )
}

function App() {
  console.log('app')
  const [count, setCount] = React.useState(0)

  return (
    <>
      <button onClick={() => setCount(count + 1)}>App Count {count}</button>
      <Button />
      <Todos />
    </>
  )
}

ReactDOM.render(document.getElementById('root'), <App />)
