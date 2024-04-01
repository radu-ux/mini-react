import { React, ReactDOM } from './react'

function Child() {
  console.log('CHILD')
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    console.log('child-effect')
    let timeout = setTimeout(() => {
      setCount((c) => c + 1)
    }, 3000)

    return () => {
      console.log('child-cleanup')
      if (timeout) {
        console.log('child: clearing timeout')
        clearTimeout(timeout)
      }
    }
  }, [count, setCount])

  return <h2>Child {count}</h2>
}

function App() {
  console.log('PARENT')
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    console.log('parent-effect')
    let timeout = setTimeout(() => {
      setCount((c) => c + 1)
    }, 3000)

    return () => {
      console.log('parent-cleanup')
      if (timeout) {
        console.log('parent: clearing timeout')
        clearTimeout(timeout)
      }
    }
  }, [count, setCount])

  return (
    <div>
      <h1>Parent {count}</h1>
      <Child />
    </div>
  )
}

ReactDOM.render(document.getElementById('root'), <App />)
