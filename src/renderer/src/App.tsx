function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div className="container">
      <h1>Meow Palette</h1>
      <p>Welcome to the cat/meow palette app.</p>
      <button onClick={ipcHandle}>Ping Main Process</button>
    </div>
  )
}

export default App
