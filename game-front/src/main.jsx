import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles' // Import ThemeProvider
import CssBaseline from '@mui/material/CssBaseline' // Ensure CssBaseline is used
import App from './App.jsx'
import theme from './theme' // Import your custom theme
import './index.css' // Import global styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}> 
      {/* CssBaseline applies basic resets and theme defaults (like background) */}
      <CssBaseline /> 
      <App />
    </ThemeProvider>
  </React.StrictMode>,
) 