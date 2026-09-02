import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { StudentUserProps } from '../../types/types'

const initialState: StudentUserProps = {
  student: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<any>) => {
      state.student = action.payload
    },
    clearUser: (state) => {
      state.student = null
    },
  },
})

export const { setUser, clearUser } = userSlice.actions
export default userSlice.reducer
