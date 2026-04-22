import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import examplePathData from './Example_Return.json'

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || ''

const GRAPH_ENDPOINTS = [
	'/api/navigation-graph',
	'/api/graph',
	'/api/nodes',
	'/api/path/nodes',
]

const PATH_ENDPOINTS = ['/api/path']

const LOCATION_POST_ENDPOINTS = ['/location', '/api/location']
const MAP_OVERLAY_URL = '/api/map-overlay'

const MAP_OVERLAY_BOUNDS = {
	minLat: 40.6972,
	maxLat: 40.7056,
	minLon: -99.1117,
	maxLon: -99.0923,
}

function endpointUrl(path) {
	if (!BACKEND_BASE_URL) {
		return path
	}

	return `${BACKEND_BASE_URL}${path}`
}

function toNumber(value) {
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : null
}

function normalizeNode(rawNode, fallbackId) {
	const lat = toNumber(
		rawNode?.latitude ?? rawNode?.lat ?? rawNode?.y ?? rawNode?.coords?.lat,
	)
	const lon = toNumber(
		rawNode?.longitude ?? rawNode?.lng ?? rawNode?.lon ?? rawNode?.x ?? rawNode?.coords?.lon,
	)

	const id = String(rawNode?.id ?? rawNode?.index ?? rawNode?.name ?? fallbackId)
	const name = String(rawNode?.name ?? rawNode?.label ?? id)

	return {
		id,
		name,
		lat,
		lon,
		hasCoordinates: lat !== null && lon !== null,
	}
}

function normalizeEdge(rawEdge) {
	const from = rawEdge?.from ?? rawEdge?.source ?? rawEdge?.a ?? rawEdge?.start
	const to = rawEdge?.to ?? rawEdge?.target ?? rawEdge?.b ?? rawEdge?.end
	const weight = toNumber(rawEdge?.weight ?? rawEdge?.cost ?? rawEdge?.distance)

	if (from === undefined || to === undefined) {
		return null
	}

	return {
		from: String(from),
		to: String(to),
		weight,
	}
}

function normalizeGraphPayload(payload) {
	const rawNodes = payload?.nodes ?? payload?.navigationPoints ?? payload?.points ?? []
	const rawEdges = payload?.edges ?? payload?.connections ?? payload?.segments ?? []

	const nodes = rawNodes.map((node, index) => normalizeNode(node, index))
	const nodeMap = new Map(nodes.map((node) => [node.id, node]))

	const edges = rawEdges
		.map(normalizeEdge)
		.filter(Boolean)
		.filter((edge) => nodeMap.has(edge.from) && nodeMap.has(edge.to))

	return {
		nodes,
		edges,
		source: 'backend',
	}
}

function buildFallbackGraph() {
	const nodes = (examplePathData?.nodes ?? []).map((node, index) =>
		normalizeNode(node, node?.index ?? index),
	)

	const coordinateNodes = nodes.filter((node) => node.hasCoordinates)
	const edges = []

	for (let i = 0; i < coordinateNodes.length - 1; i += 1) {
		edges.push({ from: coordinateNodes[i].id, to: coordinateNodes[i + 1].id, weight: null })
	}

	return {
		nodes,
		edges,
		source: 'example-fallback',
	}
}

function haversineMeters(lat1, lon1, lat2, lon2) {
	const toRadians = (deg) => (deg * Math.PI) / 180
	const earthRadiusMeters = 6371000

	const dLat = toRadians(lat2 - lat1)
	const dLon = toRadians(lon2 - lon1)
	const rLat1 = toRadians(lat1)
	const rLat2 = toRadians(lat2)

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2

	return earthRadiusMeters * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function nearestNodeToLocation(nodes, lat, lon) {
	let bestNode = null
	let bestDistance = Number.POSITIVE_INFINITY

	for (const node of nodes) {
		if (!node.hasCoordinates) {
			continue
		}

		const distance = haversineMeters(lat, lon, node.lat, node.lon)
		if (distance < bestDistance) {
			bestDistance = distance
			bestNode = node
		}
	}

	return bestNode
}

function routeFromBackendPayload(payload) {
	const routeNodes = payload?.nodes ?? payload?.path ?? payload?.route ?? []

	return routeNodes.map((node, index) => normalizeNode(node, node?.index ?? index))
}

async function fetchJsonOrNull(url, init) {
	try {
		const response = await fetch(url, init)
		if (!response.ok) {
			return null
		}
		return await response.json()
	} catch {
		return null
	}
}

async function requestPathPayload(endpoint, startBuilding, goalBuilding) {
	try {
		const response = await fetch(endpointUrl(endpoint), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				startBuilding,
				goalBuilding,
			}),
		})

		const rawText = await response.text()
		let payload = null
		if (rawText.trim()) {
			try {
				payload = JSON.parse(rawText)
			} catch {
				payload = null
			}
		}

		if (!response.ok) {
			return {
				ok: false,
				error:
					typeof payload?.error === 'string' && payload.error.trim()
						? payload.error.trim()
						: `HTTP ${response.status}`,
			}
		}

		return {
			ok: true,
			payload,
		}
	} catch (error) {
		return {
			ok: false,
			error: String(error?.message ?? error),
		}
	}
}

async function postOk(url, init) {
	try {
		const response = await fetch(url, init)
		return response.ok
	} catch {
		return false
	}
}

async function sendLocationToBackend(location) {
	for (const endpoint of LOCATION_POST_ENDPOINTS) {
		const ok = await postOk(endpointUrl(endpoint), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				lat: location.lat,
				lon: location.lon,
			}),
		})

		if (ok) {
			return true
		}
	}

	return false
}

function buildCoordinateProjector(nodes, userLocation) {
	const points = nodes.filter((node) => node.hasCoordinates)

	if (userLocation?.lat !== null && userLocation?.lon !== null) {
		points.push({ lat: userLocation.lat, lon: userLocation.lon })
	}

	if (points.length === 0) {
		return {
			width: 100,
			height: 100,
			project: () => ({ x: 50, y: 50 }),
		}
	}

	const lats = points.map((point) => point.lat)
	const lons = points.map((point) => point.lon)

	const minLat = Math.min(MAP_OVERLAY_BOUNDS.minLat, Math.min(...lats))
	const maxLat = Math.max(MAP_OVERLAY_BOUNDS.maxLat, Math.max(...lats))
	const minLon = Math.min(MAP_OVERLAY_BOUNDS.minLon, Math.min(...lons))
	const maxLon = Math.max(MAP_OVERLAY_BOUNDS.maxLon, Math.max(...lons))

	const width = 1000
	const height = 800
	const pad = 40

	const lonSpan = maxLon - minLon || 0.00001
	const latSpan = maxLat - minLat || 0.00001

	const project = (lat, lon) => {
		const x = pad + ((lon - minLon) / lonSpan) * (width - pad * 2)
		const y = pad + (1 - (lat - minLat) / latSpan) * (height - pad * 2)
		return { x, y }
	}

	return { width, height, project }
}

function App() {
	const [graph, setGraph] = useState({ nodes: [], edges: [], source: 'loading' })
	const [locationState, setLocationState] = useState({
		lat: null,
		lon: null,
		accuracy: null,
		heading: null,
		speed: null,
		timestamp: null,
		error: '',
	})
	const [tracking, setTracking] = useState(false)
	const [targetBuildingId, setTargetBuildingId] = useState('')
	const [routePoints, setRoutePoints] = useState([])
	const [routeMessage, setRouteMessage] = useState('')
	const [overlayTransform, setOverlayTransform] = useState({ x: 0, y: 0, scale: 1 })
	const [hoveredNode, setHoveredNode] = useState(null)
	const [hoverPoint, setHoverPoint] = useState(null)

	const watchIdRef = useRef(null)
	const dragStateRef = useRef(null)

	useEffect(() => {
		let cancelled = false

		async function loadGraph() {
			for (const endpoint of GRAPH_ENDPOINTS) {
				const payload = await fetchJsonOrNull(endpointUrl(endpoint))
				if (!payload) {
					continue
				}

				const parsed = normalizeGraphPayload(payload)
				if (parsed.nodes.length > 0 && !cancelled) {
					setGraph(parsed)
					return
				}
			}

			if (!cancelled) {
				setGraph(buildFallbackGraph())
			}
		}

		loadGraph()

		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current)
			}
		}
	}, [])

	const buildingNodes = useMemo(() => {
		return graph.nodes
			.filter((node) => node.hasCoordinates)
			.filter((node) => !node.name.toLowerCase().startsWith('sn'))
			.sort((a, b) => a.name.localeCompare(b.name))
	}, [graph.nodes])

	const nodeMap = useMemo(() => {
		return new Map(graph.nodes.map((node) => [node.id, node]))
	}, [graph.nodes])

	const nodeMapByName = useMemo(() => {
		return new Map(
			graph.nodes.map((node) => [node.name.replace(/\s+/g, '').toLowerCase(), node]),
		)
	}, [graph.nodes])

	const projector = useMemo(
		() => buildCoordinateProjector(graph.nodes, locationState),
		[graph.nodes, locationState],
	)

	function stopLocationTracking() {
		if (watchIdRef.current !== null) {
			navigator.geolocation.clearWatch(watchIdRef.current)
			watchIdRef.current = null
		}
		setTracking(false)
	}

	function handleLocationSuccess(position) {
		const updated = {
			lat: position.coords.latitude,
			lon: position.coords.longitude,
			accuracy: position.coords.accuracy,
			heading: position.coords.heading,
			speed: position.coords.speed,
			timestamp: position.timestamp,
			error: '',
		}

		setLocationState(updated)

		window.dispatchEvent(
			new CustomEvent('location:update', {
				detail: {
					latitude: updated.lat,
					longitude: updated.lon,
					accuracy: updated.accuracy,
					heading: updated.heading,
					speed: updated.speed,
					timestamp: updated.timestamp,
				},
			}),
		)

		sendLocationToBackend(updated)
	}

	function handleLocationError(error) {
		let message = 'An unknown geolocation error occurred.'

		if (error.code === error.PERMISSION_DENIED) {
			message = 'Location access denied. Please allow location permissions.'
		} else if (error.code === error.POSITION_UNAVAILABLE) {
			message = 'Location information is unavailable.'
		} else if (error.code === error.TIMEOUT) {
			message = 'Location request timed out. Try again.'
		}

		setLocationState((previous) => ({ ...previous, error: message }))
		setTracking(false)
	}

	function startLocationTracking() {
		if (!navigator.geolocation) {
			setLocationState((previous) => ({
				...previous,
				error: 'Geolocation is not supported by this browser.',
			}))
			return
		}

		const geoOptions = {
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 0,
		}

		navigator.geolocation.getCurrentPosition(
			handleLocationSuccess,
			handleLocationError,
			geoOptions,
		)

		if (watchIdRef.current !== null) {
			navigator.geolocation.clearWatch(watchIdRef.current)
		}

		watchIdRef.current = navigator.geolocation.watchPosition(
			handleLocationSuccess,
			handleLocationError,
			geoOptions,
		)

		setTracking(true)
	}

	async function buildRouteToTarget(goalNodeId) {
		if (!goalNodeId) {
			setRouteMessage('Select a building first.')
			return
		}

		if (locationState.lat === null || locationState.lon === null) {
			setRouteMessage('Start location tracking so your start position is known.')
			return
		}

		const nearest = nearestNodeToLocation(graph.nodes, locationState.lat, locationState.lon)
		if (!nearest) {
			setRouteMessage('No routable navigation node with coordinates was found.')
			return
		}

		const goalNode = nodeMap.get(goalNodeId)
		if (!goalNode) {
			setRouteMessage('Selected destination could not be resolved.')
			return
		}

		const nearestBuilding = nearestNodeToLocation(buildingNodes, locationState.lat, locationState.lon)
		const startCandidates = [...new Set([
			nearest.name,
			nearestBuilding?.name,
		].filter(Boolean))]

		let lastError = ''

		for (const startName of startCandidates) {
			for (const endpoint of PATH_ENDPOINTS) {
				const response = await requestPathPayload(endpoint, startName, goalNode.name)

				if (!response.ok) {
					lastError = response.error
					continue
				}

				const backendRoute = routeFromBackendPayload(response.payload)

				if (backendRoute.length === 0) {
					lastError = 'Route API returned no nodes.'
					continue
				}

				const resolvedPoints = backendRoute
					.map((node) => {
						if (node.hasCoordinates) {
							return { lat: node.lat, lon: node.lon }
						}

						const match = nodeMapByName.get(
							node.name.replace(/\s+/g, '').toLowerCase(),
						)
						if (!match?.hasCoordinates) {
							return null
						}

						return { lat: match.lat, lon: match.lon }
					})
					.filter(Boolean)

				if (resolvedPoints.length === 0) {
					setRouteMessage('Route found, but no coordinates were available to draw it.')
					return
				}

				setRoutePoints([
					{ lat: locationState.lat, lon: locationState.lon },
					...resolvedPoints,
				])
				setRouteMessage(`Route built from ${startName} to ${goalNode.name}.`)
				return
			}
			}

		const startsTried = startCandidates.join(', ')
		setRouteMessage(
			`Path request failed from [${startsTried}] to ${goalNode.name}. ${lastError || 'Directory_Processor.js did not return a route.'}`,
		)
	}

	function buildRoute() {
		buildRouteToTarget(targetBuildingId)
	}

	function startOverlayDrag(event) {
		dragStateRef.current = {
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startX: overlayTransform.x,
			startY: overlayTransform.y,
		}
		event.currentTarget.setPointerCapture(event.pointerId)
	}

	function handleOverlayDrag(event) {
		if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
			return
		}

		const dx = event.clientX - dragStateRef.current.startClientX
		const dy = event.clientY - dragStateRef.current.startClientY

		setOverlayTransform((previous) => ({
			...previous,
			x: dragStateRef.current.startX + dx,
			y: dragStateRef.current.startY + dy,
		}))
	}

	function stopOverlayDrag(event) {
		if (dragStateRef.current?.pointerId === event.pointerId) {
			dragStateRef.current = null
		}
	}

	function handleOverlayWheel(event) {
		event.preventDefault()
		const nextScale = overlayTransform.scale + (event.deltaY < 0 ? 0.05 : -0.05)
		setOverlayTransform((previous) => ({
			...previous,
			scale: Math.min(2.2, Math.max(0.4, Number(nextScale.toFixed(2)))),
		}))
	}

	function resetOverlayTransform() {
		setOverlayTransform({ x: 0, y: 0, scale: 1 })
	}

	function handleNodeHover(node, point) {
		setHoveredNode(node)
		setHoverPoint(point)
	}

	function clearNodeHover() {
		setHoveredNode(null)
		setHoverPoint(null)
	}

	function handleNodeClick(node) {
		setTargetBuildingId(node.id)
		buildRouteToTarget(node.id)
	}

	const routePolyline = routePoints
		.map((pointData) => {
			const point = projector.project(pointData.lat, pointData.lon)
			return `${point.x},${point.y}`
		})
		.join(' ')

	const userPoint =
		locationState.lat !== null && locationState.lon !== null
			? projector.project(locationState.lat, locationState.lon)
			: null

	return (
		<main className="app-shell">
			<section className="panel controls-panel">
				<h1>Loper Maps</h1>
				<p className="subtitle">UNK campus navigation with live GPS routing</p>

				<div className="button-row">
					<button type="button" onClick={startLocationTracking} className="primary-btn">
						Start GPS Tracking
					</button>
					<button type="button" onClick={stopLocationTracking} className="secondary-btn">
						Stop
					</button>
				</div>

				<label htmlFor="building-select" className="field-label">
					Destination building
				</label>
				<select
					id="building-select"
					value={targetBuildingId}
					onChange={(event) => setTargetBuildingId(event.target.value)}
					className="input"
				>
					<option value="">Choose a destination...</option>
					{buildingNodes.map((node) => (
						<option key={node.id} value={node.id}>
							{node.name}
						</option>
					))}
				</select>

				<button type="button" onClick={buildRoute} className="route-btn">
					Plot Route
				</button>

				<div className="status-card">
					<h2>Live Location</h2>
					<p>Tracking: {tracking ? 'On' : 'Off'}</p>
					<p>Latitude: {locationState.lat ?? 'N/A'}</p>
					<p>Longitude: {locationState.lon ?? 'N/A'}</p>
					<p>Accuracy: {locationState.accuracy ? `${locationState.accuracy.toFixed(1)} m` : 'N/A'}</p>
					<p>Heading: {locationState.heading ?? 'N/A'}</p>
					<p>Speed: {locationState.speed ?? 'N/A'}</p>
					<p>Data Source: {graph.source}</p>
					<p>Overlay Scale: {overlayTransform.scale.toFixed(2)}x</p>
					{locationState.error ? <p className="error-text">{locationState.error}</p> : null}
					{routeMessage ? <p className="route-message">{routeMessage}</p> : null}
				</div>

				<div className="overlay-controls">
					<button
						type="button"
						onClick={() =>
							setOverlayTransform((previous) => ({
								...previous,
								scale: Math.min(2.2, Number((previous.scale + 0.1).toFixed(2))),
							}))
						}
						className="secondary-btn"
					>
						Overlay +
					</button>
					<button
						type="button"
						onClick={() =>
							setOverlayTransform((previous) => ({
								...previous,
								scale: Math.max(0.4, Number((previous.scale - 0.1).toFixed(2))),
							}))
						}
						className="secondary-btn"
					>
						Overlay -
					</button>
					<button type="button" onClick={resetOverlayTransform} className="secondary-btn">
						Overlay Reset
					</button>
				</div>
			</section>

			<section className="panel map-panel">
				<h2>Navigation Graph and Route</h2>
				<svg
					className="map-canvas"
					viewBox={`0 0 ${projector.width} ${projector.height}`}
					role="img"
					aria-label="Campus route map"
					onPointerMove={handleOverlayDrag}
					onPointerUp={stopOverlayDrag}
					onPointerCancel={stopOverlayDrag}
					onWheel={handleOverlayWheel}
				>
					<image
						href={MAP_OVERLAY_URL}
						x={overlayTransform.x}
						y={overlayTransform.y}
						width={projector.width * overlayTransform.scale}
						height={projector.height * overlayTransform.scale}
						preserveAspectRatio="none"
						className="map-overlay-image"
						onPointerDown={startOverlayDrag}
					/>

					{graph.edges.map((edge, index) => {
						const fromNode = nodeMap.get(edge.from)
						const toNode = nodeMap.get(edge.to)

						if (!fromNode?.hasCoordinates || !toNode?.hasCoordinates) {
							return null
						}

						const from = projector.project(fromNode.lat, fromNode.lon)
						const to = projector.project(toNode.lat, toNode.lon)

						return (
							<line
								key={`edge-${index}-${edge.from}-${edge.to}`}
								x1={from.x}
								y1={from.y}
								x2={to.x}
								y2={to.y}
								className="graph-edge"
							/>
						)
					})}

					{routePolyline ? <polyline points={routePolyline} className="route-line" /> : null}

					{graph.nodes
						.filter((node) => node.hasCoordinates)
						.map((node) => {
							const point = projector.project(node.lat, node.lon)
							const isBuilding = !node.name.toLowerCase().startsWith('sn')

							return (
								<g key={`node-${node.id}`}>
									<circle
										cx={point.x}
										cy={point.y}
										r={isBuilding ? 6 : 3}
										className={isBuilding ? 'building-node' : 'waypoint-node'}
										onMouseEnter={() => handleNodeHover(node, point)}
										onMouseLeave={clearNodeHover}
										onClick={() => handleNodeClick(node)}
									/>
								</g>
							)
						})}

					{hoveredNode && hoverPoint ? (
						<g className="node-tooltip" pointerEvents="none">
							<rect x={hoverPoint.x + 10} y={hoverPoint.y - 28} width="152" height="22" rx="4" />
							<text x={hoverPoint.x + 16} y={hoverPoint.y - 13}>
								{hoveredNode.name}
							</text>
						</g>
					) : null}

					{userPoint ? <circle cx={userPoint.x} cy={userPoint.y} r={8} className="user-node" /> : null}
				</svg>
				<p className="map-help-text">
					Drag the map image to align it. Use mouse wheel or overlay buttons to resize. Hover points
					for labels and click a point to start navigation.
				</p>
			</section>
		</main>
	)
}

export default App
