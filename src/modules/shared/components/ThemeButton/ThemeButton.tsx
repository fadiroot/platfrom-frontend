import { useState } from 'react'
import { toggleTheme } from '../../store/slices/theme/themeSlice'
import { useAppDispatch, useAppSelector } from '../../store'

const ThemeButton = () => {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.theme.mode)
  const [isChecked, setIsChecked] = useState(theme === 'dark')

  const switchTheme = () => {
    dispatch(toggleTheme())
    setIsChecked(!isChecked)
  }

  return (
    <div className="dark_mode">
      <input
        className="dark_mode_input"
        type="checkbox"
        id="darkmode-toggle"
        onChange={switchTheme}
        checked={isChecked}
      />
      <label className="dark_mode_label" htmlFor="darkmode-toggle">
      </label>
    </div>
  )
}

export default ThemeButton
