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
const BACKEND_REROUTE_INTERVAL_MS = 15000

const MAP_OVERLAY_BOUNDS = {
	minLat: 40.6972,
	maxLat: 40.7056,
	minLon: -99.1117,
	maxLon: -99.0923,
}

const OVERLAY_BASE_WIDTH = 1200

const DEFAULT_GEO_CALIBRATION = {
	offsetX: -0.5,
	offsetY: -56,
	scaleX: 0.865,
	scaleY: 0.905,
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

function preventNativeDrag(event) {
	event.preventDefault()
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

function buildCoordinateProjector(_nodes, userLocation, calibration) {
	const width = userLocation?.overlayWidth ?? 1200
	const height = userLocation?.overlayHeight ?? 800
	const lonSpan = MAP_OVERLAY_BOUNDS.maxLon - MAP_OVERLAY_BOUNDS.minLon || 0.00001
	const latSpan = MAP_OVERLAY_BOUNDS.maxLat - MAP_OVERLAY_BOUNDS.minLat || 0.00001
	const centerX = width / 2
	const centerY = height / 2

	const project = (lat, lon) => {
		const rawX = ((lon - MAP_OVERLAY_BOUNDS.minLon) / lonSpan) * width
		const rawY = (1 - (lat - MAP_OVERLAY_BOUNDS.minLat) / latSpan) * height
		const x = (rawX - centerX) * calibration.scaleX + centerX + calibration.offsetX
		const y = (rawY - centerY) * calibration.scaleY + centerY + calibration.offsetY
		return {
			x: Number.isFinite(x) ? x : width / 2,
			y: Number.isFinite(y) ? y : height / 2,
		}
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
	const [showSubnodes, setShowSubnodes] = useState(true)
	const [autoRerouteEnabled, setAutoRerouteEnabled] = useState(false)
	const [activeRouteTargetId, setActiveRouteTargetId] = useState('')
	const [overlayTransform, setOverlayTransform] = useState({ x: 0, y: 0, scale: 1 })
	const [overlaySize, setOverlaySize] = useState({ width: 1200, height: 800 })
	const geoCalibration = DEFAULT_GEO_CALIBRATION
	const [hoveredNode, setHoveredNode] = useState(null)
	const [hoverPoint, setHoverPoint] = useState(null)

	const watchIdRef = useRef(null)
	const dragStateRef = useRef(null)
	const touchPointsRef = useRef(new Map())
	const pinchStateRef = useRef(null)
	const svgRef = useRef(null)
	const rerouteInFlightRef = useRef(false)
	const lastBackendRefreshRef = useRef(0)

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
		const image = new window.Image()
		image.src = MAP_OVERLAY_URL
		image.onload = () => {
			if (image.naturalWidth > 0 && image.naturalHeight > 0) {
				const nextHeight = Math.round(
					(OVERLAY_BASE_WIDTH * image.naturalHeight) / image.naturalWidth,
				)
				setOverlaySize({ width: OVERLAY_BASE_WIDTH, height: nextHeight })
			}
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

	const projector = useMemo(() => {
		return buildCoordinateProjector(graph.nodes, {
			...locationState,
			overlayWidth: overlaySize.width,
			overlayHeight: overlaySize.height,
		}, geoCalibration)
	}, [graph.nodes, locationState, overlaySize, geoCalibration])

	const nodeRadiusBuilding = 7 / overlayTransform.scale
	const nodeRadiusWaypoint = 4 / overlayTransform.scale
	const userRadius = 9 / overlayTransform.scale

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
		if (!window.isSecureContext) {
			setLocationState((previous) => ({
				...previous,
				error: 'GPS tracking requires HTTPS. Use npm run dev:https or a trusted certificate for live location.',
			}))
			return
		}

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

	async function buildRouteToTarget(goalNodeId, options = {}) {
		const { silent = false } = options

		if (!goalNodeId) {
			if (!silent) {
				setRouteMessage('Select a building first.')
			}
			return
		}

		if (locationState.lat === null || locationState.lon === null) {
			if (!silent) {
				setRouteMessage('Start location tracking so your start position is known.')
			}
			return
		}

		const nearest = nearestNodeToLocation(graph.nodes, locationState.lat, locationState.lon)
		if (!nearest) {
			if (!silent) {
				setRouteMessage('No routable navigation node with coordinates was found.')
			}
			return
		}

		const goalNode = nodeMap.get(goalNodeId)
		if (!goalNode) {
			if (!silent) {
				setRouteMessage('Selected destination could not be resolved.')
			}
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
					if (!silent) {
						setRouteMessage('Route found, but no coordinates were available to draw it.')
					}
					return
				}

				setRoutePoints(resolvedPoints)
				setActiveRouteTargetId(goalNodeId)
				setAutoRerouteEnabled(true)
				lastBackendRefreshRef.current = Date.now()
				if (!silent) {
					setRouteMessage(`Route built from ${startName} to ${goalNode.name}.`)
				}
				return
			}
			}

		const startsTried = startCandidates.join(', ')
		if (!silent) {
			setRouteMessage(
				`Path request failed from [${startsTried}] to ${goalNode.name}. ${lastError || 'Directory_Processor.js did not return a route.'}`,
			)
		}
	}

	function buildRoute() {
		buildRouteToTarget(targetBuildingId)
	}

	useEffect(() => {
		if (!tracking || !autoRerouteEnabled || !activeRouteTargetId) {
			return
		}

		if (locationState.lat === null || locationState.lon === null) {
			return
		}

		if (rerouteInFlightRef.current) {
			return
		}

		const now = Date.now()
		if (now - lastBackendRefreshRef.current < BACKEND_REROUTE_INTERVAL_MS) {
			return
		}

		lastBackendRefreshRef.current = now

		rerouteInFlightRef.current = true
		buildRouteToTarget(activeRouteTargetId, { silent: true }).finally(() => {
			rerouteInFlightRef.current = false
		})
	}, [
		activeRouteTargetId,
		autoRerouteEnabled,
		locationState.lat,
		locationState.lon,
		tracking,
	])

	const renderedRoutePoints = useMemo(() => {
		if (routePoints.length === 0) {
			return []
		}

		if (locationState.lat === null || locationState.lon === null) {
			return routePoints
		}

		let nearestIndex = 0
		let nearestDistance = Number.POSITIVE_INFINITY

		for (let i = 0; i < routePoints.length; i += 1) {
			const point = routePoints[i]
			const distance = haversineMeters(locationState.lat, locationState.lon, point.lat, point.lon)
			if (distance < nearestDistance) {
				nearestDistance = distance
				nearestIndex = i
			}
		}

		return [
			{ lat: locationState.lat, lon: locationState.lon },
			...routePoints.slice(nearestIndex),
		]
	}, [locationState.lat, locationState.lon, routePoints])

	function startOverlayDrag(event) {
		if (event.pointerType === 'touch') {
			touchPointsRef.current.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			})
			event.currentTarget.setPointerCapture(event.pointerId)

			if (touchPointsRef.current.size === 1) {
				dragStateRef.current = {
					pointerId: event.pointerId,
					startClientX: event.clientX,
					startClientY: event.clientY,
					startX: overlayTransform.x,
					startY: overlayTransform.y,
				}
			}

			if (touchPointsRef.current.size === 2) {
				const [first, second] = [...touchPointsRef.current.values()]
				const dx = second.x - first.x
				const dy = second.y - first.y
				pinchStateRef.current = {
					distance: Math.hypot(dx, dy),
				}
				dragStateRef.current = null
			}

			return
		}

		if (event.button !== 0) {
			return
		}

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
		if (event.pointerType === 'touch') {
			if (!touchPointsRef.current.has(event.pointerId)) {
				return
			}

			touchPointsRef.current.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			})

			if (touchPointsRef.current.size === 2 && svgRef.current) {
				event.preventDefault()
				const [first, second] = [...touchPointsRef.current.values()]
				const dx = second.x - first.x
				const dy = second.y - first.y
				const distance = Math.hypot(dx, dy)

				if (pinchStateRef.current?.distance) {
					const rect = svgRef.current.getBoundingClientRect()
					const midpointX = (first.x + second.x) / 2 - rect.left
					const midpointY = (first.y + second.y) / 2 - rect.top

					setOverlayTransform((previous) => {
						const scaleDelta = distance / pinchStateRef.current.distance
						const nextScale = Math.min(8, Math.max(0.4, previous.scale * scaleDelta))
						const scaleFactor = nextScale / previous.scale

						return {
							scale: nextScale,
							x: midpointX - (midpointX - previous.x) * scaleFactor,
							y: midpointY - (midpointY - previous.y) * scaleFactor,
						}
					})
				}

				pinchStateRef.current = { distance }
				return
			}

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
			return
		}

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
		if (event.pointerType === 'touch') {
			touchPointsRef.current.delete(event.pointerId)

			if (touchPointsRef.current.size < 2) {
				pinchStateRef.current = null
			}

			if (touchPointsRef.current.size === 1) {
				const [remainingPointerId, remainingPoint] = [...touchPointsRef.current.entries()][0]
				dragStateRef.current = {
					pointerId: remainingPointerId,
					startClientX: remainingPoint.x,
					startClientY: remainingPoint.y,
					startX: overlayTransform.x,
					startY: overlayTransform.y,
				}
			} else if (touchPointsRef.current.size === 0) {
				dragStateRef.current = null
			}

			if (event.currentTarget.hasPointerCapture(event.pointerId)) {
				event.currentTarget.releasePointerCapture(event.pointerId)
			}
			return
		}

		if (dragStateRef.current?.pointerId === event.pointerId) {
			dragStateRef.current = null
		}

		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId)
		}
	}

	function handleOverlayWheel(event) {
		event.preventDefault()
		if (!svgRef.current) {
			return
		}

		const rect = svgRef.current.getBoundingClientRect()
		const pointerX = event.clientX - rect.left
		const pointerY = event.clientY - rect.top

		setOverlayTransform((previous) => {
			const delta = event.deltaY < 0 ? 1.08 : 0.92
			const nextScale = Math.min(8, Math.max(0.4, previous.scale * delta))
			const scaleFactor = nextScale / previous.scale

			return {
				scale: nextScale,
				x: pointerX - (pointerX - previous.x) * scaleFactor,
				y: pointerY - (pointerY - previous.y) * scaleFactor,
			}
		})
	}

	function handleNodeHover(node, point) {
		setHoveredNode(node)
		setHoverPoint(point)
	}

	function clearNodeHover() {
		setHoveredNode(null)
		setHoverPoint(null)
	}

	const routePolyline = renderedRoutePoints
		.map((pointData) => {
			const point = projector.project(pointData.lat, pointData.lon)
			return `${point.x},${point.y}`
		})
		.join(' ')

	const userPoint =
		locationState.lat !== null && locationState.lon !== null
			? projector.project(locationState.lat, locationState.lon)
			: null

	function renderLocationStatusCard(extraClassName = '') {
		const className = `status-card ${extraClassName}`.trim()

		return (
			<div className={className}>
				<h2>Live Location</h2>
				<p>Tracking: {tracking ? 'On' : 'Off'}</p>
				<p>Latitude: {locationState.lat ?? 'N/A'}</p>
				<p>Longitude: {locationState.lon ?? 'N/A'}</p>
				<p>Accuracy: {locationState.accuracy ? `${locationState.accuracy.toFixed(1)} m` : 'N/A'}</p>
				<p>Heading: {locationState.heading ?? 'N/A'}</p>
				<p>Speed: {locationState.speed ?? 'N/A'}</p>
				<p>Data Source: {graph.source}</p>
				<p>Overlay Scale: {overlayTransform.scale.toFixed(2)}x</p>
				<p>Auto Reroute: {autoRerouteEnabled && activeRouteTargetId ? 'On' : 'Off'}</p>
				{locationState.error ? <p className="error-text">{locationState.error}</p> : null}
				{routeMessage ? <p className="route-message">{routeMessage}</p> : null}
			</div>
		)
	}

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

				<div className="overlay-controls adjustment-controls">
					<button
						type="button"
						onClick={() => setShowSubnodes((previous) => !previous)}
						className="secondary-btn"
					>
						Subnodes: {showSubnodes ? 'Shown' : 'Hidden'}
					</button>
				</div>

				{renderLocationStatusCard('desktop-status-card')}

			</section>

			<section className="panel map-panel">
				<h2>Navigation Graph and Route</h2>
				<svg
					ref={svgRef}
					className="map-canvas"
					viewBox={`0 0 ${projector.width} ${projector.height}`}
					role="img"
					aria-label="Campus route map"
					onPointerDown={startOverlayDrag}
					onPointerMove={handleOverlayDrag}
					onPointerUp={stopOverlayDrag}
					onPointerCancel={stopOverlayDrag}
					onWheel={handleOverlayWheel}
					onDragStart={preventNativeDrag}
					onDragOver={preventNativeDrag}
					onDrop={preventNativeDrag}
					onClick={(event) => event.preventDefault()}
				>
					<g transform={`translate(${overlayTransform.x} ${overlayTransform.y}) scale(${overlayTransform.scale})`}>
						<image
							href={MAP_OVERLAY_URL}
							x={0}
							y={0}
							width={projector.width}
							height={projector.height}
							preserveAspectRatio="xMidYMid meet"
							className="map-overlay-image"
							draggable={false}
							onDragStart={preventNativeDrag}
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
							.filter((node) => showSubnodes || !node.name.toLowerCase().startsWith('sn'))
							.map((node) => {
								const point = projector.project(node.lat, node.lon)
								const isBuilding = !node.name.toLowerCase().startsWith('sn')

								return (
									<g key={`node-${node.id}`}>
										<circle
											cx={point.x}
											cy={point.y}
											r={isBuilding ? nodeRadiusBuilding : nodeRadiusWaypoint}
											className={isBuilding ? 'building-node' : 'waypoint-node'}
											onMouseEnter={() => handleNodeHover(node, point)}
											onMouseLeave={clearNodeHover}
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

						{userPoint ? <circle cx={userPoint.x} cy={userPoint.y} r={userRadius} className="user-node" /> : null}
					</g>
					</svg>
					<p className="map-help-text">
						Drag to pan, use mouse wheel to zoom, and pinch with two fingers on touch devices. Alignment calibration is applied automatically on all
						devices.
					</p>
					{renderLocationStatusCard('mobile-status-card')}
			</section>
		</main>
	)
}

export default App
