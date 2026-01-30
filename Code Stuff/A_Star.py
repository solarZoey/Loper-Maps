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
            
