import { React, ReactDOM } from './react'

function apiCall(cb, delay = 300) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(cb())
    }, delay)
  })
}

function App() {
  const [incrementing, setIncrementing] = React.useState(false)
  const [count, setCount] = React.useState(0)

  const onClick = async () => {
    setIncrementing(true)
    await apiCall(() => {
      setCount(count + 1)
    }, 3000)
    setIncrementing(false)
  }

  return (
    <div>
      <h3>Incrementing = {incrementing}</h3>
      <button onClick={onClick}>Count {count}</button>
    </div>
  )
}

ReactDOM.render(document.getElementById('root'), <App />)
