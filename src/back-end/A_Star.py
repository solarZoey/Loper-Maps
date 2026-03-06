import math
import sys

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
    def addEdge(self, _e):
        self.edges.append(_e)

    # Allows node to track path
    def setBacktrack(self, _n):
        self.backtrack = _n

    # Returns nodes in the path
    def getBacktrack(self):
        return self.backtrack

# Class representing edges (paths) between nodes (buildings)
class Edge:
    def __init__(self, cost: int):
        self.connections = []
        self.weight = cost

    # Connects two nodes and tells each node they are connected
    def connectNodes(self, _n1: Node, _n2: Node):
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

    # Calculates heuristic
    def calcHeuristic(self, a, b):
        R_feet = 20925524.9 # Earth's radius in feet

        lat1 = math.radians(a.latitude)
        lat2 = math.radians(b.latitude)
        lon1 = math.radians(a.longitude)
        lon2 = math.radians(b.longitude)

        x = (lon2 - lon1) * math.cos((lat1 + lat2) / 2)
        y = lat2 -lat1

        return math.sqrt(x * x + y * y) * R_feet
    
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
                    neighbor.setBacktrack(current)

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
    sn39 = Node("sn39", 40.702595, -99.095380)
    sn30 = Node("sn30", 40.702161, -99.095252)
    sn44 = Node("sn44", 40.701766, -99.095252)
    sn49 = Node("sn49", 40.701718, -99.094866)
    sn45 = Node("sn45", 40.701819, -99.094683)
    sn68 = Node("sn68", 40.701543, -99.094689)
    sn58 = Node("sn58", 40.701608, -99.094855)
    sn50 = Node("sn50", 40.701628, -99.095262)
    sn67 = Node("sn67", 40.701571, -99.095384)
    sn120 = Node("sn120", 40.701063, -99.095405)
    sn29 = Node("sn29", 40.702185, -99.095019)
    sn28 = Node("sn28", 40.702124, -99.094933)
    sn27 = Node("sn27", 40.702136, -99.094804)
    sn31 = Node("sn31", 40.702014, -99.094692)
    sn43 = Node("sn43", 40.702132, -99.094536)
    sn54 = Node("sn54", 40.701720, -99.095492)
    sn52 = Node("sn52", 40.701830, -99.095712)
    sn53 = Node("sn53", 40.701753, -99.095937)
    sn65 = Node("sn65", 40.701802, -99.096178)
    sn78 = Node("sn78", 40.702752, -99.095670)
    sn37 = Node("sn37", 40.702435, -99.095393)
    sn141 = Node("sn141", 40.701804, -99.096478)
    sn142 = Node("sn142", 40.701577, -99.096483)
    sn66 = Node("sn66", 40.701585, -99.096232)
    sn182 = Node("sn182", 40.701827, -99.096957)
    sn181 = Node("sn181", 40.701831, -99.097225)
    sn188 = Node("sn188", 40.701836, -99.097965)
    sn194 = Node("sn194", 40.701978, -99.097943)
    sn170 = Node("sn170", 40.701436, -99.096217)
    sn166 = Node("sn166", 40.701053, -99.096228)
    sn124 = Node("sn124", 40.701053, -99.095863)
    sn123 = Node("sn123", 40.701135, -99.095847)
    sn168 = Node("sn168", 40.700603, -99.096242)
    sn169 = Node("sn169", 40.700225, -99.096253)
    sn162 = Node("sn162", 40.700172, -99.095824)
    sn125 = Node("sn125", 40.701026, -99.095824)
    sn164 = Node("sn164", 40.700597, -99.096018)
    sn163 = Node("sn163", 40.700588, -99.095825)
    sn113 = Node("sn113", 40.701041, -99.094981)
    sn108 = Node("sn108", 40.701265, -99.094713)


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
    x.addNode(sn67)
    x.addNode(sn120)
    x.addNode(sn29)
    x.addNode(sn28)
    x.addNode(sn27)
    x.addNode(sn31)
    x.addNode(sn43)
    x.addNode(sn54)
    x.addNode(sn52)
    x.addNode(sn53)
    x.addNode(sn65)
    x.addNode(sn78)
    x.addNode(sn37)
    x.addNode(sn141)
    x.addNode(sn142)
    x.addNode(sn66)
    x.addNode(sn182)
    x.addNode(sn181)
    x.addNode(sn188)
    x.addNode(sn194)
    x.addNode(sn170)
    x.addNode(sn166)
    x.addNode(sn124)
    x.addNode(sn123)
    x.addNode(sn168)
    x.addNode(sn169)
    x.addNode(sn162)
    x.addNode(sn125)
    x.addNode(sn164)
    x.addNode(sn163)
    x.addNode(sn113)
    x.addNode(sn108)


    # Connect nodes together
    x.addConnection(CTW, sn6, 82.92)
    x.addConnection(CTE, sn8, 68.31)
    x.addConnection(sn6, Union, 189.56) # Northern Union Entrance
    x.addConnection(sn6, sn8, 200)
    x.addConnection(sn8, sn14, 99.58)
    x.addConnection(sn14, sn16, 132.17)
    x.addConnection(sn16, Union, 338.08) # Northern Union Entrance
    x.addConnection(sn16, sn19, 149.43)
    x.addConnection(sn19, sn80, 157.49)
    x.addConnection(sn19, sn20, 58.11)
    x.addConnection(sn30, sn44, 166.5)
    x.addConnection(sn44, sn49, 115.47)
    x.addConnection(sn49, sn45, 66.33)
    x.addConnection(sn45, NesterNorth, 1) # Souther Nester North Entrance
    x.addConnection(sn50, sn67, 39.82)
    x.addConnection(sn67, sn120, 181.36)
    x.addConnection(sn30, sn29, 53.92)
    x.addConnection(sn20, sn29, 123.43)
    x.addConnection(sn29, sn28, 47.97)
    x.addConnection(sn28, sn27, 37.28)
    x.addConnection(sn27, sn31, 45.42)
    x.addConnection(sn31, NesterNorth, 1) # Norther Nester North Entrance
    x.addConnection(sn31, sn43, 45.42)
    x.addConnection(sn44, sn54, 68.82)
    x.addConnection(sn54, sn52, 67.74)
    x.addConnection(sn52, Antelope, 1) # Southern Antelope Entrance
    x.addConnection(sn52, sn53, 75.54)
    x.addConnection(sn53, sn65, 70.93)
    x.addConnection(sn80, sn78, 52.37)
    x.addConnection(sn78, sn39, 127.73)
    x.addConnection(sn39, sn37, 75.92)
    x.addConnection(sn37, sn30, 97.28)
    x.addConnection(sn65, sn141, 73.5)
    x.addConnection(sn141, sn142, 73.5)
    x.addConnection(sn142, sn66, 73.5)
    x.addConnection(sn66, sn65, 73.5)
    x.addConnection(sn141, sn182, 119.09)
    x.addConnection(sn182, Mens, 70)
    x.addConnection(sn182, sn181, 60.09)
    x.addConnection(sn181, Mens, 70)
    x.addConnection(sn181, sn188, 223.3)
    x.addConnection(sn188, sn194, 42.76)
    x.addConnection(sn194, MantorRandall, 1) # Mantor/Randall Entrance
    x.addConnection(sn66, sn170, 60.18)
    x.addConnection(sn170, sn166, 138.05)
    x.addConnection(sn166, sn124, 105.81)
    x.addConnection(sn124, sn123, 32.13)
    x.addConnection(sn123, Copeland, 1) # Copeland South Entrance
    x.addConnection(sn124, sn125, 23.86)
    x.addConnection(sn125, sn163, 151.15)
    x.addConnection(sn163, sn168, 122.6)
    x.addConnection(sn168, Library, 10) # East Library Entrance
    x.addConnection(sn168,sn166, 168.16)
    x.addConnection(sn168, sn169, 135.8)
    x.addConnection(sn169, sn162, 124.12)
    x.addConnection(sn162, Bruner, 5) # North Bruner Entrance
    x.addConnection(sn162, sn163, 165.9)
    x.addConnection(sn44, sn50, 37.74)
    x.addConnection(sn50, sn58, 115.47)
    x.addConnection(sn58, sn68, 66.33)
    x.addConnection(sn68, NesterSouth, 1) # Nester South, North Entrance
    x.addConnection(sn120, sn113, 104.4)
    x.addConnection(sn120, sn124, 132.06)
    x.addConnection(sn113, sn108, 136.87)
    x.addConnection(sn108, NesterSouth, 10) # Nester South, South Entrance
    x.addConnection(sn170, Copeland, 10) # Copeland East Entrance


    # Calculates A* based on specified nodes (start, end)
    s1 = x.a_star(MantorRandall, Bruner)
    print(f"\nA* Path: {s1}\n")


    # Christian's Playground
    """
    start_building = sys.argv[1]
    goal_building = sys.argv[2]
    node_dict = {node.name: node for node in x._nodes}
    start_node = node_dict[start_building]
    goal_node = node_dict[goal_building]
    if not start_node or not goal_node:
        print(f"Error: Building not found")
        sys.exit(1)
    s2 = x.a_star(start_node, goal_node)
    print((f"\nA* Path: {s2}\n"))
    """

    # Errors are not handling correctly yet, just returning python exit
    try:
        start_building = sys.argv[1]
        goal_building = sys.argv[2]
                
        # Create normalized lookup dictionary
        node_dict = {node.name.replace(" ", "").lower(): node for node in x._nodes}
                
        # Normalize and get nodes
        start_node = node_dict[start_building.replace(" ", "").lower()]
        goal_node = node_dict[goal_building.replace(" ", "").lower()]
                
        s2 = x.a_star(start_node, goal_node)
        print(f"\nA* Path: {s2}\n")
        print(f"Total Cost: {goal_node.g}\n")
    except KeyError:
        print(f"Error: Building not found. Please check your input and try again.")
        sys.exit(1)

if __name__ == "__main__":
    test()
