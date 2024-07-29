import React from 'react'

export const NotifiContext = React.createContext()

export default function NotifiProvider() {
  return (
    <NotifiContext>NotifiProvider</NotifiContext>
  )
}
