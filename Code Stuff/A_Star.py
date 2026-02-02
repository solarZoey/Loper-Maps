import math

# Node Class representing each building on campus
class Node:
    def __init__(self, building: str, lat: float, long: float):
        self.name = building
        self.latitude = lat
        self.longitude = long

        # Set to infinity until cost is calculated
        self.f = float('inf')
        self.g = float('inf')
        self.h = float('inf')

        self.edges = []
        self.backtrack = None

    # Adds an edge to the edge list
    def addEdge(self, _e) -> None:
        self.edges.append(_e)

    # Allows node to track path
    def setBacktrack(self, _n) -> None:
        self.backTrack = _n

    # Returns nodes in the path
    def getBacktrack(self):
        return self.backtrack

# Class representing edges (paths) between nodes (buildings)
class Edge:
    def __init__(self, cost: int):
        self.connections = []
        self.weight = cost

    # Connects two nodes and tells each node they are connected
    def connectNodes(self, _n1: Node, _n2: Node) -> None:
        if len(self.connections) == 0:
            self.connections.append(_n1)
            self.connections.append(_n2)
            _n1.addEdge(self)
            _n2.addEdge(self)

    # Given the first node, gets the other node
    def getOther(self, _n: Node) -> Node:
        if len(self.connections) > 0:
            if _n == self.connections[0]:
                return self.connections[1]
            else:
                return self.connections[0]
            
# Class represneting the graph data structure
class Graph:
    def __init__(self):
        self._nodes = []
        self._edges = []

    # Adds node to graph by adding it to end of node list
    def addNode(self, _n: Node):
        self._nodes.append(_n)

    # Connects two nodes by creating an edge and assigning it to the two parameter nodes
    def addConnection(self, _n1: Node, _n2: Node, cost: int):
        e = Edge(cost)
        e.connectNodes(_n1, _n2)
        self._edges.append(e)

    # Calculates heuristic using Euclidean Distance
    def calcHeuristic(self, _n1: Node, _n2: Node) -> float:
        return math.sqrt((_n1.latitude - _n2.latitude) ** 2 + (_n1.longitude -_n2.longitude) ** 2)
    
    # A* Algorithm
    def a_star(self, start: Node, goal: Node):
        start.g = 0
        start.h = self.calcHeuristic(start, goal)
        start.f = start.g + start.h

        queue = [start]
        processed = []

        while queue:
            current = queue.pop(0)
            print(f"\nVisiting {current.name}")
            print(f"G Cost: {current.g}")
            print(f"Heuristic Value: {current.h:.2f}")
            print(f"F Cost: {current.f:.2f}")
            processed.append(current)

            if current == goal:
                print("\nFOUND GOAL\n")
                path = [] # Initializes list for the path
                total_cost = current.g # Total cost of path
                
                while current:
                    print(f"Adding {current.name} to path")
                    path.append(current.name)
                    current = current.getBacktrack() # Sets current to previous node from the goal
                    print(f"\nTotal Cost: {total_cost}")
                    return path[::-1] # Returns reversed path for correct order of nodes
                
            for edge in current.edges:
                neighbor = edge.getOther(current)
                print(f"\nFound neighbor {neighbor.name}")
                tentative_g = current.g + edge.weight # Calculates tentative cost to reach neighbor from initial node

                if tentative_g < neighbor.g: # If new path is better
                    print(f"Updating G Cost: ")
