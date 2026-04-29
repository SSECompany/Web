import React, { useState } from "react";
import "./Home.css";
import Chart from "react-apexcharts";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setText } from "../../store/reducers/claimsSlice";
import { addNotify } from "../../firebase/services";


const Home = () => {
  const [chartStyle, setChartStyle] = useState("line");
  const navigate = useNavigate();
  const dispatch = useDispatch()
  const handleTest =(value)=>{
    navigate(value)
  }
  const handleStyle = () => {
    Notification.requestPermission().then(per=>{
      if(per === 'granted'){
        const notify = new Notification("MH test",{
          body:'Casi nafy ddeeer test',
          data:{Mach:'hung'},
          image:'https://www.pockettactics.com/wp-content/sites/pockettactics/2022/09/genshin-impact-anniversary.jpg',
          icon:'https://pbs.twimg.com/media/E-IHYr2WYAc2swi.jpg:large',
          timeStamp:2000,
        })

        notify.onclick=e=>{
          dispatch(setText('23112001'))
          console.log(e.target.data)
        }
      }


    })


    setChartStyle("bar");
  };

  const state = {
    series: [
      {
        name: "Mạch Hưng",
        data: [31, 40, 28, 51, 42, 109, 100],
      },
      {
        name: "Mạch Hưng 2",
        data: [11, 32, 45, 32, 34, 52, 41],
      },
      {
        name: "Mạch Hưng 3",
        data: [11, 32, 51, 42, 109, 100, 52],
      },
    ],
    options: {
      dataLabels: {
        enabled: false,
      },
      title: {
        text: "Báo cáo vip vờ lờ",
        style: {
          fontWeight: "bold",
          fontFamily: "Poppins",
        },
      },
      stroke: {
        curve: "smooth",
      },
      xaxis: {
        type: "datetime",
        categories: [
          "2018-09-19T00:00:00.000Z",
          "2019-09-19T01:30:00.000Z",
          "2020-09-19T02:30:00.000Z",
          "2021-09-19T03:30:00.000Z",
          "2022-09-19T04:30:00.000Z",
          "2023-09-19T05:30:00.000Z",
          "2024-09-19T06:30:00.000Z",
        ],
      },
      tooltip: {
        x: {
          format: "dd/MM/yy HH:mm",
        },
      },
    },
  };

  return (
    <div className="Home">
   
      <div className="home_container">
      <Outlet/>
        <div className="home_container_left">
          <div className="home_container_left_item">
            <Chart
              options={state.options}
              series={state.series}
              type={chartStyle}
            />
          </div>
          <div className="home_container_left_item">
            <Chart
              options={state.options}
              series={state.series}
              type={chartStyle}
            />
          </div>
          <div className="home_container_left_item">
            <Chart options={state.options} series={state.series} type={"bar"} />
          </div>
          <div className="home_container_left_item">
            <Chart options={state.options} series={state.series} type={"bar"} />
          </div>
        </div>
        <div className="home_container_right">
          <span>bên phải nè</span>
          <button onClick={handleStyle}>Change Style</button>
          <span onClick={e=>handleTest('machhung')}>test</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
