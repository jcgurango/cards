import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { cardImageSources } from './components/Card';

// Generate a player ID.
const id = localStorage.getItem('id') || (Math.floor(Math.random() * 100000000000000000)).toString();
localStorage.setItem('id', id);

ReactDOM.render((
    <BrowserRouter>
        <div>
            {Object.keys(cardImageSources).map((key) => (
                <img src={cardImageSources[key]} key={key} style={{ position: 'absolute', top: -10000000, left: -100000000 }} />
            ))}
        </div>
        <App />
    </BrowserRouter>
), document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
