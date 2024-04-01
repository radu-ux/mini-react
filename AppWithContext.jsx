import { React } from './react'
import { ReactDOM } from './react'

const AppContext = React.createContext({})

function App({ children }) {
  const [user, setUser] = React.useState({})

  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  )
}

function UserProfile() {
  const userContext = React.useContext(AppContext)

  React.useEffect(() => {
    let timer = setTimeout(() => {
      userContext.setUser({ name: 'Test User' })
    }, 1000)

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [])

  return <h1>{JSON.stringify(userContext.user)}</h1>
}

function UserName() {
  const userContext = React.useContext(AppContext)

  return <h1>{userContext.value?.name}</h1>
}

ReactDOM.render(
  document.getElementById('root'),
  <App>
    <UserProfile />
    <UserName />
  </App>
)
