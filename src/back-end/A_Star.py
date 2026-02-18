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

    # Main building node creation
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

    # Subnode Creation (pathways/sidewalks between buildings)
    sn6 = Node("sn6", 40.703747, -99.096263)
    sn8 = Node("sn8", 40.703727, -99.094843)
    sn14 = Node("sn14", 40.703576, -99.095031)
    sn15 = Node("sn15", 40.703568, -99.094017)
    sn17 = Node("sn17", 40.703175, -99.094021)
    sn16 = Node("sn16", 40.703216, -99.095034)
    sn19 = Node("sn19", 40.702841, -99.095029)
    sn23 = Node("sn23", 40.702858, -99.094225)
    sn20 = Node("sn20", 40.702574, -99.095227)
    sn80 = Node("sn80", 40.702752, -99.095789)
    sn39 = Node("sn39", 40.702557, -99.095382)
    sn30 = Node("sn30", 40.702161, -99.095252)
    sn44 = Node("sn44", 40.701766, -99.095252)
    sn49 = Node("sn49", 40.701718, -99.094866)
    sn45 = Node("sn45", 40.701819, -99.094683)
    sn68 = Node("sn68", 40.701543, -99.094689)
    sn58 = Node("sn58", 40.701608, -99.094855)
    sn50 = Node("sn50", 40.701628, -99.095262)

    # Initialized building nodes into graph
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

    # Initialized subnodes into graph
    x.addNode(sn6)
    x.addNode(sn8)
    x.addNode(sn14)
    x.addNode(sn15)
    x.addNode(sn17)
    x.addNode(sn16)
    x.addNode(sn19)
    x.addNode(sn23)
    x.addNode(sn20)
    x.addNode(sn80)
    x.addNode(sn39)
    x.addNode(sn30)
    x.addNode(sn44)
    x.addNode(sn49)
    x.addNode(sn45)
    x.addNode(sn68)
    x.addNode(sn58)
    x.addNode(sn50)

    # Connect nodes together
    x.addConnection(CTW, CTE, 351.24)
    x.addConnection(CTW, Union, 272.49)
    x.addConnection(CTE, Union, 457.87)
    x.addConnection(CTW, sn6, 82.93)
    x.addConnection(sn6, Union, 189.56)
    x.addConnection(sn6, sn8, 200)
    x.addConnection(sn8, CTE, 68.31)
    x.addConnection(sn8, sn14, 99.58)
    x.addConnection(sn14, sn16, 132.17)
    x.addConnection(sn16, Union, 338.08)
    x.addConnection(sn16, sn19, 149.43)
    x.addConnection(sn19, sn80, 157.49)
    x.addConnection(sn19, sn20, 58.11)
    x.addConnection(sn20, sn30, 211.54)
    x.addConnection(sn30, sn44, 166.5)
    x.addConnection(sn44, sn49, 115.47)
    x.addConnection(sn49, sn45, 66.33)
    x.addConnection(sn45, NesterNorth, 0)

    # Calculates A* based on specified nodes (start, end)
    s1 = x.a_star(CTW, NesterNorth)
    print(f"\nA* Path: {s1}\n")

if __name__ == "__main__":
    test()
