const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const CSV_PATH = path.join(__dirname, "Database", "campusBuilding_longlat.csv");
const PYTHON_SCRIPT = path.join(__dirname, "..", "A_Star.py");

function normalizeName(raw) {
	if (!raw) return "";
	return raw.toString().trim().toLowerCase();
}

function parseCsvLine(line) {
	const parts = line.split(",");
	if (parts.length < 3) return null;
	const name = parts[0].trim();
	const latitude = Number(parts[1]);
	const longitude = Number(parts[2]);
	if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
	return { name, latitude, longitude };
}

function loadBuildingDirectory(csvPath = CSV_PATH) {
	const raw = fs.readFileSync(csvPath, "utf8");
	const lines = raw.split(/\r?\n/).filter(Boolean);
	const directory = new Map();

	for (let i = 1; i < lines.length; i += 1) {
		const parsed = parseCsvLine(lines[i]);
		if (!parsed) continue;
		const key = normalizeName(parsed.name);
		directory.set(key, parsed);
	}

	return directory;
}

function resolveBuilding(name, directory) {
	const normalized = normalizeName(name);
	if (!normalized) return null;
	if (directory.has(normalized)) return directory.get(normalized);
	return null;
}

function sanitizePath(pathList) {
	if (!Array.isArray(pathList)) return [];
	const cleaned = [];
	for (const item of pathList) {
		if (typeof item !== "string") continue;
		const name = item.trim();
		if (!name) continue;
		if (cleaned.length > 0 && cleaned[cleaned.length - 1] === name) continue;
		cleaned.push(name);
	}
	return cleaned;
}

function buildPathPayload(aStarResult, csvPath = CSV_PATH) {
	const pathList = Array.isArray(aStarResult)
		? aStarResult: Array.isArray(aStarResult?.path)
			? aStarResult.path: [];

	const directory = loadBuildingDirectory(csvPath);
	const cleanedPath = sanitizePath(pathList);

	const missing = [];
	const nodes = cleanedPath
		.map((name, index) => {
			const match = resolveBuilding(name, directory);
			if (!match) {
				missing.push(name);
				// Include node even without coordinates
				return {
					index,
					name: name,
					latitude: null,
					longitude: null,
					hasCoordinates: false,
				};
			}
			return {
				index,
				name: match.name,
				latitude: match.latitude,
				longitude: match.longitude,
				hasCoordinates: true,
			};
		});

	return {
		nodes,
		totalNodes: cleanedPath.length,
		nodesWithCoordinates: nodes.filter(n => n.hasCoordinates).length,
		totalCost: aStarResult?.totalCost,
		missingCoordinates: missing,
	};
}

function buildPathJson(aStarResult, csvPath = CSV_PATH) {
	return JSON.stringify(buildPathPayload(aStarResult, csvPath));
}

/**
 * Executes the Python A* pathfinding script
 * @param {string} startBuilding
 * @param {string} goalBuilding
 * @returns {Promise<Object>} - Promise resolving to { path, totalCost }
 */
function runPythonPathfinding(startBuilding, goalBuilding) {
	return new Promise((resolve, reject) => {
		// Pass start and goal as command line arguments to Python
		// NOTE: Current A_Star.py does not read sys.argv - it runs a hardcoded test
		// To use these arguments, A_Star.py needs to be modified
		const pythonProcess = spawn("python", [PYTHON_SCRIPT, startBuilding, goalBuilding]);
		
		let stdout = "";
		let stderr = "";
		
		pythonProcess.stdout.on("data", (data) => {
			stdout += data.toString();
		});
		
		pythonProcess.stderr.on("data", (data) => {
			stderr += data.toString();
		});
		
		pythonProcess.on("close", (code) => {
			if (code !== 0) {
				reject(new Error(`Python script exited with code ${code}\n${stderr}`));
				return;
			}
			
			try {
				const result = parsePythonOutput(stdout);
				resolve(result);
			} catch (error) {
				reject(new Error(`Failed to parse Python output: ${error.message}\nOutput: ${stdout}`));
			}
		});
		
		pythonProcess.on("error", (error) => {
			reject(new Error(`Failed to start Python process: ${error.message}`));
		});
	});
}

/**
 * Parses the output from A_Star.py to extract path and total cost
 * @param {string} output - Raw output from Python script
 * @returns {Object} - { path: string[], totalCost: number }
 */
function parsePythonOutput(output) {
	const lines = output.split(/\r?\n/);
	let path = null;
	let totalCost = null;
	
	// Debug: log the raw output
	if (process.env.DEBUG) {
		console.log("=== RAW PYTHON OUTPUT ===");
		console.log(output);
		console.log("=== END RAW OUTPUT ===\n");
	}
	
	for (const line of lines) {
		// Look for "A* Path: ['Building1', 'Building2', ...]"
		const pathMatch = line.match(/A\*\s+Path:\s*\[([^\]]*)\]/);
		if (pathMatch) {
			const pathContent = pathMatch[1];
			// Parse the Python list format: 'Building1', 'Building2', etc.
			path = pathContent
				.split(",")
				.map(item => item.trim().replace(/^['"]|['"]$/g, ""))
				.filter(Boolean);
			
			if (process.env.DEBUG) {
				console.log(`Parsed path: ${JSON.stringify(path)}`);
			}
		}
		
		// Look for "Total Cost: <number>"
		const costMatch = line.match(/Total\s+Cost:\s*(\d+\.?\d*)/);
		if (costMatch) {
			totalCost = parseFloat(costMatch[1]);
			
			if (process.env.DEBUG) {
				console.log(`Parsed totalCost: ${totalCost}`);
			}
		}
	}
	
	if (!path) {
		throw new Error("Could not find path in Python output");
	}
	
	if (process.env.DEBUG) {
		console.log(`\nFinal parsed result: path=${JSON.stringify(path)}, totalCost=${totalCost}\n`);
	}
	
	return { path, totalCost };
}

/**
 * Main function to get pathfinding results from Python and format for frontend
 * @param {string} startBuilding
 * @param {string} goalBuilding
 * @param {string} csvPath - Optional path to CSV file
 * @returns {Promise<Object>} - Promise resolving to formatted path data
 */
async function getPathForFrontend(startBuilding, goalBuilding, csvPath = CSV_PATH) {
	const pythonResult = await runPythonPathfinding(startBuilding, goalBuilding);
	return buildPathPayload(pythonResult, csvPath);
}

/**
 * Main function to get pathfinding results as JSON string
 * @param {string} startBuilding
 * @param {string} goalBuilding
 * @param {string} csvPath - Optional path to CSV file
 * @returns {Promise<string>} - Promise resolving to JSON string
 */
async function getPathJsonForFrontend(startBuilding, goalBuilding, csvPath = CSV_PATH) {
	const result = await getPathForFrontend(startBuilding, goalBuilding, csvPath);
	return JSON.stringify(result, null, 2);
}

module.exports = {
	loadBuildingDirectory,
	buildPathPayload,
	buildPathJson,
	runPythonPathfinding,
	parsePythonOutput,
	getPathForFrontend,
	getPathJsonForFrontend,
};

// CLI Interface - to test pathfinding
if (require.main === module) {
	const args = process.argv.slice(2);
	
	if (args.length < 1) {
		console.log("Usage: node Directory_Processor.js START_BUILDING [GOAL_BUILDING]");
		console.log("");
		console.log("Examples:");
		console.log('  node Directory_Processor.js CTW Armstrong');
		console.log('  node Directory_Processor.js "Mens Hall" CTW');
		console.log('  node Directory_Processor.js "Student Affairs" "Nester North"');
		console.log("");
		console.log("Note: Use quotes around building names with spaces");
		console.log("");
		console.log("WARNING: A_Star.py currently runs a hardcoded test (CTW to Nester North)");
		console.log("and does not accept command line arguments. To use custom start/goal,");
		console.log("A_Star.py needs to be modified to accept sys.argv arguments.");
		process.exit(1);
	}
	
	// Handle case where building names might have spaces without quotes
	let start, goal;
	
	if (args.length === 1) {
		console.log("Error: Please provide both start and goal buildings");
		process.exit(1);
	} else if (args.length === 2) {
		[start, goal] = args;
	} else {
		// More than 2 args - try to split
		// Assume last argument is goal, everything else is start
		goal = args[args.length - 1];
		start = args.slice(0, -1).join(" ");
		console.log(`Note: Interpreted as start="${start}", goal="${goal}"`);
		console.log("Tip: Use quotes to avoid ambiguity\n");
	}
	
	console.log(`Requesting path from "${start}" to "${goal}"...\n`);
	
	getPathJsonForFrontend(start, goal)
		.then((json) => {
			console.log("=== PATH RESULT FOR FRONTEND ===");
			console.log(json);
		})
		.catch((error) => {
			console.error("\n=== ERROR ===");
			console.error(error.message);
			process.exit(1);
		});
}
