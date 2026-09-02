import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AdminUserProps } from '../../types/types'

const initialState: AdminUserProps = {
  id: 0,
  coordinatorId: '',
  name: '',
  email: '',
  phone: '',
  school: '',
  department: '',
  program: '',
  batch: '',
  specialization: '',
  role: '',
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setAdmin: (state, action: PayloadAction<any>) => {
      state.id = action.payload.id
      state.name = action.payload.name
      state.email = action.payload.email
      state.role = action.payload.role
      state.coordinatorId = action.payload.coordinatorId
      state.school = action.payload.school
      state.department = action.payload.department
      state.program = action.payload.program
      state.batch = action.payload.batch
      state.specialization = action.payload.specialization
    },
    clearAdmin: (state) => {
      state.id = 0
      state.name = ''
      state.email = ''
      state.role = ''
      state.coordinatorId = ''
      state.school = ''
      state.department = ''
      state.program = ''
      state.batch = ''
      state.specialization = ''
    },
  },
})

export const { setAdmin, clearAdmin } = adminSlice.actions
export default adminSlice.reducer
