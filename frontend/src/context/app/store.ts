import { configureStore } from '@reduxjs/toolkit'
import userReducer from '../features/userSlice'
import adminReducer from '../features/adminSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    admin: adminReducer,
  },
})

// Types for TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch