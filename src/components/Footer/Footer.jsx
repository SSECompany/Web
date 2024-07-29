import React, { useState } from 'react'
import './Footer.css'
import { UilAngleDoubleUp } from '@iconscout/react-unicons'

const Footer = () => {
    const [footer_detail,setFooterDetail] =  useState(false)

  return (
    <div className={`Footer ${footer_detail?'show_detail':''}`}>
        <span className={`btn_show_detail`} onClick={e=> setFooterDetail(!footer_detail)}><UilAngleDoubleUp size="50"></UilAngleDoubleUp></span>
    </div>
  )
}

export default Footer