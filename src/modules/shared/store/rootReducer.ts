import { combineReducers } from '@reduxjs/toolkit'

import themeReducer from './slices/theme/themeSlice'
import authReducer from '../../auth/data/authSlice'
import levelReducer from '../../levels/data/levelSlice'

const rootReducer = combineReducers({
  theme: themeReducer,
  auth: authReducer,
  levels: levelReducer,
})

export default rootReducer
