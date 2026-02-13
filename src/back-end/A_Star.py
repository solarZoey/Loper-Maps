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
                    print(f"Updating G Cost: {current.name} to {neighbor.name}")
                    neighbor.g = tentative_g # Updates neighbor's g cost to cheaper path
                    print(f"\nCalculating Heurisitc for {neighbor.name}")
                    neighbor.h = self.calcHeuristic(neighbor, goal)
                    neighbor.f = neighbor.g + neighbor.h # Sum of heuristic value and g cost

                    if neighbor in queue:
                        queue.remove(neighbor)
                    if neighbor not in processed:
                        queue.append(neighbor)
                    
                queue.sort(key=lambda node: node.f)

        print("\nNo Goal Found...")

def test():
    x = Graph()

    CTW = Node("CTW", 40.703959, -99.095886)
    CTE = Node("CTE", 40.703985, -99.094998)
    Union = Node("Union", 40.702917, -99.095996)
    Armstrong = Node("Armstrong", 40.703009, -99.094536)
    Martin = Node("Martin", 40.702407, -99.094504)
    NesterNorth = Node("Nester North", 40.701908, -99.094708)
    NesterSouth = Node("Nester South", 40.701423, -99.094741)
    Antelope = Node("Antelope", 40.701887, -99.095653)
    Copeland = Node("Copeland", 40.701393, -99.096007)
    Mens = Node("Mens", 40.702109, -99.097037)
    StudentAffairs = Node("Student Affairs", 40.701328, -99.096801)
    Library = Node("Library", 40.700602, -99.096529)
    Bruner = Node("Bruner", 40.699967, -99.095878)
    Thomas = Node("Thomas", 40.699804, -99.096887)
    FineArts = Node("Fine Arts", 40.700211, -99.097982)
    MantorRandall = Node("Mantor/Randall", 40.702114, -99.098104)
    Stadium = Node("Stadium", 40.703302, -99.097857)
    HealthSports = Node("Health and Sports Center", 40.700572, -99.099714)
    COE = Node("COE", 40.700184, -99.102187)
    Facilities = Node("Facilities", 40.700978, -99.104978)
    GeneralServices = Node("General Services", 40.701491, -99.105131)
    Discovery = Node("Discovery", 40.700734, -99.105743)
    WestCenter = Node("West Center", 40.700246, -99.106301)
    Ockinga = Node("Ockinga", 40.701404, -99.106287)
    CommunicationsCenter = Node("Communications Center", 40.701355, -99.107382)
    FrankHouse = Node("Frank House", 40.700802, -99.108659)
    RuralHealth = Node("Rural Health", 40.701008, -99.109933)
    UNMC = Node("UNMC", 40.699967, -99.110094)
    VillageFlats = Node("Village Flats", 40.698015, -99.108817)

    x.addNode(CTW)
    x.addNode(CTE)
    x.addNode(Union)
    x.addNode(Armstrong)
    x.addNode(Martin)
    x.addNode(NesterNorth)
    x.addNode(NesterSouth)
    x.addNode(Antelope)
    x.addNode(Copeland)
    x.addNode(Mens)
    x.addNode(StudentAffairs)
    x.addNode(Library)
    x.addNode(Bruner)
    x.addNode(Thomas)
    x.addNode(FineArts)
    x.addNode(MantorRandall)
    x.addNode(Stadium)
    x.addNode(HealthSports)
    x.addNode(COE)
    x.addNode(Facilities)
    x.addNode(GeneralServices)
    x.addNode(Discovery)
    x.addNode(WestCenter)
    x.addNode(Ockinga)
    x.addNode(CommunicationsCenter)
    x.addNode(FrankHouse)
    x.addNode(RuralHealth)
    x.addNode(UNMC)
    x.addNode(VillageFlats)

    x.addConnection(CTW, CTE, 351.24)
    x.addConnection(CTW, Union, 272.49)
    x.addConnection(CTE, Union, 457.87)

    s1 = x.a_star(CTW, Union)
    print(f"\nA* Path: {s1}\n")

if __name__ == "__main__":
    test()
