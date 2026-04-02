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
            print(f"\nChecking {current.name}")
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
                    print(f"Updating G Cost (path is cheaper): {current.name} to {neighbor.name}")
                    neighbor.g = tentative_g # Updates neighbor's g cost to cheaper path
                    print(f"\nRecalculating Heurisitc for {neighbor.name}")
                    neighbor.h = self.calcHeuristic(neighbor, goal)
                    neighbor.f = neighbor.g + neighbor.h # Sum of heuristic value and g cost
                    neighbor.setBacktrack(current)

                    if neighbor in queue:
                        print(f"Removing {neighbor.name} from queue")
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
    WarnerHall = Node("Warner Hall", 40.700580, -99.094852)

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
    sn214 = Node("sn214", 40.701839, -99.099033)
    sn215 = Node("sn215", 40.701733, -99.099204)
    sn216 = Node("sn216", 40.701635, -99.099429)
    sn187 = Node("sn187", 40.701603, -99.097875)
    sn178 = Node("sn178", 40.701587, -99.097446)
    sn180 = Node("sn180", 40.701812, -99.097435)
    sn176 = Node("sn176", 40.700966, -99.097446)
    sn177 = Node("sn177", 40.700754, -99.097457)
    sn175 = Node("sn175", 40.700956, -99.096964)
    sn173 = Node("sn173", 40.700932, -99.096535)
    sn174 = Node("sn174", 40.700924, -99.096235)
    sn212 = Node("sn212", 40.700623, -99.097502)
    sn232 = Node("sn232", 40.700501, -99.097823)
    sn234 = Node("sn234", 40.700501, -99.099485)
    sn238 = Node("sn238", 40.700555, -99.100889)
    sn239 = Node("sn239", 40.701629, -99.100825)
    sn245 = Node("sn245", 40.700549, -99.101600)
    sn246 = Node("sn246", 40.700322, -99.101771)
    sn247 = Node("sn247", 40.700546, -99.102354)
    sn256 = Node("sn256", 40.700551, -99.103584)
    sn254 = Node("sn254", 40.701633, -99.103530)
    sn253 = Node("sn253", 40.701527, -99.101605)
    sn251 = Node("sn251", 40.700567, -99.105579)
    sn249 = Node("sn249", 40.699607, -99.105579)
    sn244 = Node("sn244", 40.699635, -99.101905)
    sn231 = Node("sn231", 40.699957, -99.097855)
    sn227 = Node("sn227", 40.699965, -99.097485)
    sn209 = Node("sn209", 40.699961, -99.097281)
    sn207 = Node("sn207", 40.700107, -99.096981)
    sn208 = Node("sn208", 40.700103, -99.096761)
    sn199 = Node("sn199", 40.700242, -99.096393)
    sn200 = Node("sn200", 40.700174, -99.096549)
    sn202 = Node("sn202", 40.699767, -99.096651)
    sn85 = Node("sn85", 40.702315, -99.096454)
    sn196 = Node("sn196", 40.702323, -99.097237)
    sn198 = Node("sn198", 40.702481, -99.097548)
    sn222 = Node("sn222", 40.702521, -99.098096)
    sn221 = Node("sn221", 40.702586, -99.098981)
    sn220 = Node("sn220", 40.702301, -99.099002)
    sn219 = Node("sn219", 40.702273, -99.098273)
    sn218 = Node("sn218", 40.702179, -99.098273)
    sn217 = Node("sn217", 40.702163, -99.098986)
    sn186 = Node("sn186", 40.702113, -99.097470)
    sn195 = Node("sn195", 40.702234, -99.097298)
    sn84 = Node("sn84", 40.702309, -99.0962140)
    sn87 = Node("sn87", 40.702418, -99.0962080)
    sn86 = Node("sn86", 40.702402, -99.096401)
    sn97 = Node("sn97", 40.70241, -99.096316)
    sn91 = Node("sn91", 40.702549, -99.096337)
    sn81 = Node("sn81", 40.702581, -99.096187)
    sn64 = Node("sn64", 40.701646, -99.095955)
    sn57 = Node("sn57", 40.701625, -99.095504)
    sn226 = Node("sn226", 40.700163, -99.097488)
    sn210 = Node("sn210", 40.700142, -99.097295)
    sn126 = Node("sn126", 40.700588, -99.095635)
    sn121 = Node("sn121", 40.700751, -99.095833)
    sn147 = Node("sn147", 40.700597, -99.095099)
    sn119 = Node("sn119", 40.700702, -99.094949)
    sn128 = Node("sn128", 40.700491, -99.094943)
    sn148 = Node("sn148", 40.700142, -99.094961)
    sn156 = Node("sn156", 40.700024, -99.095144)
    sn161 = Node("sn161", 40.700167, -99.095390)
    sn112 = Node("sn112", 40.701038, -99.094936)
    sn236 = Node("sn236", 40.699751, -99.099528)
    sn237 = Node("sn237", 40.699772, -99.100895)
    sn149 = Node("sn149", 40.700302, -99.095222)
    sn171 = Node("sn171", 40.701445, -99.096505)
    sn9 = Node("sn9", 40.704516, -99.095955)
    sn11 = Node("sn11", 40.703770, -99.094413)
    sn10 = Node("sn10", 40.704291, -99.094343)
    sn21 = Node("sn21", 40.702902, -99.094032)
    sn24 = Node("sn24", 40.702128, -99.094056)
    sn25 = Node("sn25", 40.702145, -99.094538)
    sn32 = Node("sn32", 40.702307, -99.094522)
    sn26 = Node("sn26", 40.702136, -99.094667)
    sn60 = Node("sn60", 40.701724, -99.094049)
    sn61 = Node("sn61", 40.701590, -99.094065)
    sn98 = Node("sn98", 40.701263, -99.094081)
    sn101 = Node("sn101", 40.701255, -99.094359)
    sn99 = Node("sn99", 40.701109, -99.094086)
    sn100 = Node("sn100", 40.701093, -99.094531)
    sn47 = Node("sn47", 40.701719, -99.094513)
    sn59 = Node("sn59", 40.701625, -99.094508)
    sn18 = Node("sn18", 40.703179, -99.094023)
    sn22 = Node("sn22", 40.702870, -99.094945)
    sn94 = Node("sn94", 40.702310, -99.095771)
    sn75 = Node("sn75", 40.702204, -99.095669)
    sn110 = Node("sn110", 40.701139, -99.094886)

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
    x.addNode(WarnerHall)

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
    x.addNode(sn214)
    x.addNode(sn215)
    x.addNode(sn216)
    x.addNode(sn178)
    x.addNode(sn187)
    x.addNode(sn180)
    x.addNode(sn176)
    x.addNode(sn177)
    x.addNode(sn175)
    x.addNode(sn173)
    x.addNode(sn174)
    x.addNode(sn212)
    x.addNode(sn232)
    x.addNode(sn234)
    x.addNode(sn238)
    x.addNode(sn239)
    x.addNode(sn245)
    x.addNode(sn246)
    x.addNode(sn247)
    x.addNode(sn256)
    x.addNode(sn254)
    x.addNode(sn253)
    x.addNode(sn251)
    x.addNode(sn249)
    x.addNode(sn244)
    x.addNode(sn231)
    x.addNode(sn227)
    x.addNode(sn209)
    x.addNode(sn207)
    x.addNode(sn208)
    x.addNode(sn199)
    x.addNode(sn200)
    x.addNode(sn202)
    x.addNode(sn85)
    x.addNode(sn196)
    x.addNode(sn198)
    x.addNode(sn222)
    x.addNode(sn221)
    x.addNode(sn220)
    x.addNode(sn219)
    x.addNode(sn218)
    x.addNode(sn217)
    x.addNode(sn186)
    x.addNode(sn195)
    x.addNode(sn84)
    x.addNode(sn87)
    x.addNode(sn86)
    x.addNode(sn97)
    x.addNode(sn91)
    x.addNode(sn81)
    x.addNode(sn64)
    x.addNode(sn57)
    x.addNode(sn226)
    x.addNode(sn210)
    x.addNode(sn126)
    x.addNode(sn121)
    x.addNode(sn147)
    x.addNode(sn119)
    x.addNode(sn128)
    x.addNode(sn148)
    x.addNode(sn156)
    x.addNode(sn161)
    x.addNode(sn112)
    x.addNode(sn236)
    x.addNode(sn237)
    x.addNode(sn149)
    x.addNode(sn171)
    x.addNode(sn9)
    x.addNode(sn11)
    x.addNode(sn10)
    x.addNode(sn21)
    x.addNode(sn24)
    x.addNode(sn25)
    x.addNode(sn32)
    x.addNode(sn26)
    x.addNode(sn60)
    x.addNode(sn61)
    x.addNode(sn98)
    x.addNode(sn101)
    x.addNode(sn99)
    x.addNode(sn100)
    x.addNode(sn47)
    x.addNode(sn59)
    x.addNode(sn18)
    x.addNode(sn22)
    x.addNode(sn94)
    x.addNode(sn75)
    x.addNode(sn110)

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
    x.addConnection(sn45, NesterNorth, 1) # Southern Nester North Entrance
    x.addConnection(sn50, sn67, 39.82)
    x.addConnection(sn67, sn120, 181.36)
    x.addConnection(sn30, sn29, 53.92)
    x.addConnection(sn20, sn29, 123.43)
    x.addConnection(sn29, sn28, 47.97)
    x.addConnection(sn28, sn27, 37.28)
    x.addConnection(sn27, sn31, 45.42)
    x.addConnection(sn31, NesterNorth, 1) # Northern Nester North Entrance
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
    x.addConnection(sn188, sn214, 298.2)
    x.addConnection(sn214, sn216, 108.32)
    x.addConnection(sn216, sn239, 413.51)
    x.addConnection(sn216, HealthSports, 100) # Health and Sports Center North Entrance
    x.addConnection(sn239, sn238, 389.8)
    x.addConnection(sn238, HealthSports, 50) # Health and Sports Center West Entrance
    x.addConnection(sn238, sn245, 201.31)
    x.addConnection(sn245, sn246, 98.38)
    x.addConnection(sn246, COE, 5) # COE South-East Entrance
    x.addConnection(sn245, sn253, 378.62)
    x.addConnection(sn253, sn239, 212.69)
    x.addConnection(sn245, sn247, 197.47)
    x.addConnection(sn247, COE, 30) # COE North Entrance
    x.addConnection(sn247, sn256, 671.63)
    x.addConnection(sn256, sn254, 410.7)
    x.addConnection(sn254, sn253, 823.74)
    x.addConnection(sn256, Discovery, 100) # Discovery Hall East Entrance
    x.addConnection(sn256, sn251, 200)
    x.addConnection(sn251, WestCenter, 25) # West Center East Entrance
    x.addConnection(sn251, sn249, 381.61)
    x.addConnection(sn249, sn244, 992.43)
    x.addConnection(sn244, sn245, 345.4)
    x.addConnection(sn232, sn231, 214.39)
    x.addConnection(sn231, sn227, 110.86)
    x.addConnection(sn227, sn209, 56.28)
    x.addConnection(sn209, sn207, 101.34)
    x.addConnection(sn207, sn208, 42.75)
    x.addConnection(sn208, Thomas, 20) # Thomas Hall North Entrance
    x.addConnection(sn208, sn200, 78.91)
    x.addConnection(sn200, sn202, 95.74)
    x.addConnection(sn202, Thomas, 15) # Thomas Hall East Entrance
    x.addConnection(sn141, sn85, 182.56)
    x.addConnection(sn85, sn196, 207.94)
    x.addConnection(sn196, sn198, 91.92)
    x.addConnection(sn198, sn222, 142.75)
    x.addConnection(sn222, sn221, 263.94)
    x.addConnection(sn221, sn220, 119.91)
    x.addConnection(sn220, sn219, 226.51)
    x.addConnection(sn219, sn218, 24.25)
    x.addConnection(sn218, sn217, 226.51)
    x.addConnection(sn217, sn214, 137.38)
    x.addConnection(sn232, sn234, 454.59)
    x.addConnection(sn234, HealthSports, 5) # Health and Sport Center East Entrance
    x.addConnection(sn234, sn238, 386.47)
    x.addConnection(sn234, sn216, 388.61)
    x.addConnection(sn186, sn194, 187.35)
    x.addConnection(sn186, sn195, 56.32)
    x.addConnection(sn195, sn196, 29.32)
    x.addConnection(sn195, sn85, 206.61)
    x.addConnection(sn85, sn84, 79.18)
    x.addConnection(sn84, sn65, 182.56)
    x.addConnection(sn84, sn87, 23.72)
    x.addConnection(sn85, sn86, 42.68)
    x.addConnection(sn86, sn97, 23.78)
    x.addConnection(sn87, sn97, 32.24)
    x.addConnection(sn97, sn91, 33.3)
    x.addConnection(sn91, Union, 25) # Union Southern Entrance
    x.addConnection(sn91, sn81, 85.09)
    x.addConnection(sn81, sn78, 113.53)
    x.addConnection(sn66, sn64, 70.93)
    x.addConnection(sn64, sn57, 115.52)
    x.addConnection(sn57, sn67, 67.55)
    x.addConnection(sn227, sn226, 66.02)
    x.addConnection(sn209, sn210, 75.55)
    x.addConnection(sn226, sn210, 61.73)
    x.addConnection(sn210, sn207, 86.54)
    x.addConnection(sn163, sn126, 57.91)
    x.addConnection(sn164, sn121, 57.91)
    x.addConnection(sn121, sn120, 158.1)
    x.addConnection(sn126, sn113, 232.25)
    x.addConnection(sn126, sn147, 142.47)
    x.addConnection(sn147, sn119, 56.65)
    x.addConnection(sn147, sn128, 56.65)
    x.addConnection(sn119, WarnerHall, 10) # Warner Hall West Entrance
    x.addConnection(sn128, WarnerHall, 10) # Warner Hall West Entrance
    x.addConnection(sn119, sn112, 116.92)
    x.addConnection(sn112, sn113, 24.52)
    x.addConnection(sn119, sn128, 83.1)
    x.addConnection(sn128, sn148, 120.19)
    x.addConnection(sn148, sn156, 43.85)
    x.addConnection(sn156, Bruner, 20) # Bruner Hall East Entrance
    x.addConnection(sn156, sn161, 88.81)
    x.addConnection(sn161, sn162, 123.54)
    x.addConnection(sn234, sn236, 363.65)
    x.addConnection(sn236, sn237, 395.04)
    x.addConnection(sn237, sn238, 365.04)
    x.addConnection(sn126, sn149, 145.57)
    x.addConnection(sn149, sn161, 60.59)
    x.addConnection(sn149, sn128, 97.77)
    x.addConnection(sn149, sn148, 91.4)
    x.addConnection(sn142, sn171, 60.18)
    x.addConnection(sn171, sn170, 70.14)
    x.addConnection(sn171, sn173, 178.15)
    x.addConnection(sn6, sn9, 167.56)
    x.addConnection(sn9, sn10, 516.64)
    x.addConnection(sn10, sn11, 192.97)
    x.addConnection(sn11, sn8, 87.85)
    x.addConnection(sn17, sn18, 149.43)
    x.addConnection(sn18, Armstrong, 15) # Armstrong Hall North Entrance
    x.addConnection(sn18, sn23, 36.36)
    x.addConnection(sn23, sn22, 55.68)
    x.addConnection(sn23, Armstrong, 15) # Armstrong Hall South Entrnace
    x.addConnection(sn23, sn21, 42.28)
    x.addConnection(sn21, sn18, 61.68)
    x.addConnection(sn21, sn24, 174.43)
    x.addConnection(sn24, sn25, 114.33)
    x.addConnection(sn25, sn32, 57.16)
    x.addConnection(sn32, Martin, 1) # Martin Hall Entrance
    x.addConnection(sn32, sn26, 82.88)
    x.addConnection(sn26, sn25, 51.4)
    x.addConnection(sn25, sn31, 72.79)
    x.addConnection(sn26, sn27, 45.28)
    x.addConnection(sn24, sn60, 161.31)
    x.addConnection(sn60, sn47, 131.71)
    x.addConnection(sn47, sn45, 59.79)
    x.addConnection(sn60, sn61, 42.94)
    x.addConnection(sn61, sn59, 131.71)
    x.addConnection(sn59, sn47, 36.26)
    x.addConnection(sn59, sn68, 59.79)
    x.addConnection(sn59, sn58, 94.79)
    x.addConnection(sn47, sn49, 94.79)
    x.addConnection(sn68, sn45, 114.02)
    x.addConnection(sn61, sn98, 127.34)
    x.addConnection(sn98, sn101, 73.31)
    x.addConnection(sn98, sn99, 56.24)
    x.addConnection(sn99, sn100, 119.88)
    x.addConnection(sn100, sn101, 100)
    x.addConnection(sn100, sn110, 89.54)
    x.addConnection(sn110, sn112, 34.46)
    x.addConnection(sn44, sn50, 37.74)
    x.addConnection(sn178, sn176, 212.68)
    x.addConnection(sn178, sn180, 72.76)
    x.addConnection(sn176, sn177, 79.2)
    x.addConnection(sn177, sn212, 88.23)
    x.addConnection(sn177, sn175, 148.84)
    x.addConnection(sn176, sn175, 144.27)
    x.addConnection(sn175, sn173, 121.31)
    x.addConnection(sn173, sn174, 77.89)
    x.addConnection(sn180, sn181, 77.9)
    x.addConnection(sn180, sn188, 145.3)


    # Calculates A* based on specified nodes (start, end)
    s1 = x.a_star(Martin, Thomas)
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
