// http://localhost:3000/isolated/exercise/06.js
// Fix "perf death by a thousand cuts"

import * as React from 'react'
import {
  useForceRerender,
  useDebouncedState,
  AppGrid,
  updateGridState,
  updateGridCellState,
} from '../utils'

const AppStateContext = React.createContext();
AppStateContext.displayName = 'AppStateContext';
const AppDispatchContext = React.createContext();
AppDispatchContext.displayName = 'AppDispatchContext';
const AppDogNameContext = React.createContext();

const initialGrid = Array.from({length: 100}, () =>
  Array.from({length: 100}, () => Math.random() * 100),
)

function appReducer(state, action) {
  switch (action.type) {
  // we're no longer managing the dogName state in our reducer
    // 💣 remove this case
    case 'TYPED_IN_DOG_INPUT': {
      return {...state, dogName: action.dogName}
    }
    case 'UPDATE_GRID_CELL': {
      return {...state, grid: updateGridCellState(state.grid, action)}
    }
    case 'UPDATE_GRID': {
      return {...state, grid: updateGridState(state.grid)}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function dogReducer(state, action){
  switch (action.type) {
    case 'TYPED_IN_DOG_INPUT':
      return {...state, dogName: action.payload}
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function AppProvider({children}) {
  const [state, dispatch] = React.useReducer(appReducer, {
    grid: initialGrid,
  })

  return (
    <AppStateContext.Provider value={state} >
      <AppDispatchContext.Provider value={dispatch} displayName={AppDispatchContext}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}

function DogNameProvider({ children }) {
  const [{ dogName }, dispatch ] = React.useReducer(dogReducer, {
    dogName: ''
  });

  return (
    <AppDogNameContext.Provider value={[dogName, dispatch]}>
      {children}
    </AppDogNameContext.Provider>
  )
}

function useAppState() {
  const context = React.useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within the AppProvider')
  }
  return context
}

function useAppDispatch() {
  const context = React.useContext(AppDispatchContext)
  if (!context) {
    throw new Error('useAppDispatch must be used within the AppProvider')
  }
  return context
}

function useDogNameContext() {
  const dogName = React.useContext(AppDogNameContext)
  if (dogName == null) {
    throw new Error('useDogNameContext must be used within the AppProvider')
  }
  return dogName
}

function Grid() {
  const dispatch = useAppDispatch()
  const [rows, setRows] = useDebouncedState(50)
  const [columns, setColumns] = useDebouncedState(50)
  const updateGridData = () => dispatch({type: 'UPDATE_GRID'})
  return (
    <AppGrid
      onUpdateGrid={updateGridData}
      rows={rows}
      handleRowsChange={setRows}
      columns={columns}
      handleColumnsChange={setColumns}
      Cell={Cell}
    />
  )
}
Grid = React.memo(Grid)

// JP: Check final excercises for complete implementation
function withStateSlice(WrappedComponent, stateGetterFunction) {
  function WrapperComponent(props) {
    const state = useAppState();
    const slicedState = stateGetterFunction(state, props);
    return <WrappedComponent {...props} cell={slicedState} />
  }
  return React.memo(WrapperComponent)
}

function Cell({cell, row, column}) {
  const dispatch = useAppDispatch()
  const handleClick = () => dispatch({type: 'UPDATE_GRID_CELL', row, column})
  return (
    <button
      className="cell"
      onClick={handleClick}
      style={{
        color: cell > 50 ? 'white' : 'black',
        backgroundColor: `rgba(0, 0, 0, ${cell / 100})`,
      }}
    >
      {Math.floor(cell)}
    </button>
  )
}
Cell = withStateSlice(Cell, (state, props) => state.grid[props.row][props.column])

function DogNameInput() {
  // 🐨 replace the useAppState and useAppDispatch with a normal useState here
  // to manage the dogName locally within this component
  const [dogName, dispatch] = useDogNameContext();

  function handleChange(event) {
    const newDogName = event.target.value
    // 🐨 change this to call your state setter that you get from useState
    dispatch({type: 'TYPED_IN_DOG_INPUT', payload: newDogName})
  }

  return (
    <form onSubmit={e => e.preventDefault()}>
      <label htmlFor="dogName">Dog Name</label>
      <input
        value={dogName}
        onChange={handleChange}
        id="dogName"
        placeholder="Toto"
      />
      {dogName ? (
        <div>
          <strong>{dogName}</strong>, I've a feeling we're not in Kansas anymore
        </div>
      ) : null}
    </form>
  )
}
function App() {
  const forceRerender = useForceRerender()
  return (
    <div className="grid-app">
      <button onClick={forceRerender}>force rerender</button>
      <AppProvider>
        <DogNameProvider>
          <div>
            <DogNameInput />
            <Grid />
          </div>
        </DogNameProvider> 
      </AppProvider>
    </div>
  )
}

export default App

/*
eslint
  no-func-assign: 0,
*/
