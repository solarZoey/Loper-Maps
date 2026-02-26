/*
Author: Nova Solarz (it/they/she)
Date of creation: 2026-02-17
Date of last edit: 2026-02-18
Directive:
	Create root html elements to be lodaded with Main.jsx
*/

import { useState } from 'react'
import './App.css'

function App() {
	const [count, setCount] = useState(0)

	return (
		<>
			<h1>Loper Maps</h1>
			<p><i>UNK campus navigation</i></p>
			<p>Move the view with the arrow keys! Zoom in and out with "=" and "-" respectively!</p>
			<canvas id="gl_canvas" />
			<script async type="module" src="/src/graphics.js" onLoad={console.log("graphics script loaded.")}/>
		</>
	)
}

export default App
