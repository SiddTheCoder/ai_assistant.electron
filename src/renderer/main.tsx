import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './store/store.ts'
import { SocketProvider } from './context/socketContextProvider.tsx'

const user = {
  _id: "user_1"
}

createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
      <SocketProvider value={user}>
        <App />
      </SocketProvider>
    </Provider>
);
