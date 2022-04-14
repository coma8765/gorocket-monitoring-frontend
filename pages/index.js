import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);
import {getOldMeasures} from "../shared/api";

export const options = {
    responsive: true,
    animation: {
        duration: 2, // general animation time
    },
    plugins: {
        legend: {
            position: 'top',
        },
    },
    scales: {
        x: {
            grid: {
               display: false
           }
        },
        y: {
            grid: {
                display: false
            }
        },
        xAxes: [{
            type: 'linear',
            position: 'bottom',
            ticks: {
                max: 12,
                min: 1,
                stepSize: 1,
                callback: function(value, index, values) {
                    return 1;
                }
            }
        }]
    },
    annotation: {
        annotations: [
            {
                drawTime: "afterDatasetsDraw",
                type: "line",
                mode: "vertical",
                scaleID: "x-axis-0",
                value: 3.8,
                borderWidth: 5,
                borderColor: "red",
                label: {
                    content: "TODAY",
                    enabled: true,
                    position: "top"
                }
            }
        ]
    },
};

export default function App(callback, deps) {
    const [rawData, setRawData] = useState([]);
    const [WSState, setWSState] = useState(false);
    const ws = useRef(null);

    useEffect(async () => setRawData((
        (await getOldMeasures())
            .filter(v => v.IS_STARTED)
            // .filter((_, i) => i % Math.sqrt(i) % 8 === 0)
    )), []);

    useEffect(() => {
        ws.current = new WebSocket(`ws://${window.location.hostname}:8000/ws`); // создаем ws соединение
        ws.current.onopen = () => setWSState("Соединение открыто");  // callback на ивент открытия соединения
        ws.current.onclose = () => setWSState("Соединение закрыто"); // callback на ивент закрытия соединения

        gettingData();

        return () => ws.current.close(); // кода меняется isPaused - соединение закрывается
    }, [ws]);


    const gettingData = useCallback(() => {
        if (!ws.current) return;

        ws.current.onmessage = e => {                //подписка на получение данных по вебсокету
            const messages = JSON.parse(e.data).data;
                // .filter(v => v.IS_STARTED);
            setRawData(s => [...s, ...messages]); //
        };
    }, []);

    const someData = rawData
        .slice(-250, -1)
        // .filter((_, i) => i % 4 === 0).slice(-50, -1)
    const data = {
        labels: someData.map(v => ""), //!v.IS_STARTED ? "PENDING" : "Started") ,
        datasets: [
            {
                label: "Altitude",
                data: someData.map(v => v.ALTITUDE),
                borderColor: 'green',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }, {
                label: "Voltage",
                data: someData.map(v => v.VOLTAGE),
                borderColor: 'red',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }, {
                label: "Absolute vector",
                data: someData.map(v => v.VECTOR_ABS),
                borderColor: 'blue',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }
        ]
    };

    return <Line options={options} data={data} />;
}
