# Import Files/Modules
import requests
import time
import math
import subprocess
import js2py
import pyexecjs2

class Live_Tracking:
    # data attributes
    __live_lat = -1
    __live_long = -1
    __wait_time = -1
    __live_lat_rad = -1
    __live_long_rad = -1
    __closest_value = -1

    # init
    def __init__(self):
        self.set_live_lat(float(self.retrieve_location()[0]))
        self.set_live_long(float(self.retrieve_location()[1]))
        self.set_live_lat_rad(self.get_live_lat() * (math.pi / 180))
        self.set_live_long_rad(self.get_live_long() * (math.pi / 180))
        self.set_closest_value(100000)

    # helpers
    def retrieve_location(self):
        response = requests.get('https://ipinfo.io/')
        data = response.json()
        location = data['loc'].split(',')
        return location

    def node_library(self):
        campus_nodes = {
            "CTW": (40.703959, -99.095886),
            "CTE": (40.703985, -99.094998),
            "Union": (40.702917, -99.095996),
            "Armstrong": (40.703009, -99.094536),
            "Martin": (40.702407, -99.094504),
            "NesterNorth": (40.701908, -99.094708),
            "NesterSouth": (40.701423, -99.094741),
            "Antelope": (40.701887, -99.095653),
            "Copeland": (40.701393, -99.096007),
            "Mens": (40.702109, -99.097037),
            "StudentAffairs": (40.701328, -99.096801),
            "Library": (40.700602, -99.096529),
            "Bruner": (40.699967, -99.095878),
            "Thomas": (40.699804, -99.096887),
            "FineArts": (40.700211, -99.097982),
            "MantorRandall": (40.702114, -99.098104),
            "Stadium": (40.703302, -99.097857),
            "HealthSports": (40.700572, -99.099714),
            "COE": (40.700184, -99.102187),
            "Facilities": (40.700978, -99.104978),
            "GeneralServices": (40.701491, -99.105131),
            "Discovery": (40.700734, -99.105743),
            "WestCenter": (40.700246, -99.106301),
            "Ockinga": (40.701404, -99.106287),
            "CommunicationsCenter": (40.701355, -99.107382),
            "FrankHouse": (40.700802, -99.108659),
            "RuralHealth": (40.701008, -99.109933),
            "UNMC": (40.699967, -99.110094),
            "VillageFlats": (40.698015, -99.108817),

            "sn6": (40.703747, -99.096263),
            "sn8": (40.703727, -99.094843),
            "sn14": (40.703576, -99.095031),
            "sn15": (40.703568, -99.094017),
            "sn17": (40.703175, -99.094021),
            "sn16": (40.703216, -99.095034),
            "sn19": (40.702841, -99.095029),
            "sn23": (40.702858, -99.094225),
            "sn20": (40.702574, -99.095227),
            "sn80": (40.702752, -99.095789),
            "sn39": (40.702595, -99.095380),
            "sn30": (40.702161, -99.095252),
            "sn44": (40.701766, -99.095252),
            "sn49": (40.701718, -99.094866),
            "sn45": (40.701819, -99.094683),
            "sn68": (40.701543, -99.094689),
            "sn58": (40.701608, -99.094855),
            "sn50": (40.701628, -99.095262),
            "sn67": (40.701571, -99.095384),
            "sn120": (40.701063, -99.095405),
            "sn29": (40.702185, -99.095019),
            "sn28": (40.702124, -99.094933),
            "sn27": (40.702136, -99.094804),
            "sn31": (40.702014, -99.094692),
            "sn43": (40.702132, -99.094536),
            "sn54": (40.701720, -99.095492),
            "sn52": (40.701830, -99.095712),
            "sn53": (40.701753, -99.095937),
            "sn65": (40.701802, -99.096178),
            "sn78": (40.702752, -99.095670),
            "sn37": (40.702435, -99.095393),
            "sn141": (40.701804, -99.096478),
            "sn142": (40.701577, -99.096483),
            "sn66": (40.701585, -99.096232),
            "sn182": (40.701827, -99.096957),
            "sn181": (40.701831, -99.097225),
            "sn188": (40.701836, -99.097965),
            "sn194": (40.701978, -99.097943),
            "sn170": (40.701436, -99.096217),
            "sn166": (40.701053, -99.096228),
            "sn124": (40.701053, -99.095863),
            "sn123": (40.701135, -99.095847),
            "sn168": (40.700603, -99.096242),
            "sn169": (40.700225, -99.096253),
            "sn162": (40.700172, -99.095824),
            "sn125": (40.701026, -99.095824),
            "sn164": (40.700597, -99.096018),
            "sn163": (40.700588, -99.095825),
            "sn113": (40.701041, -99.094981),
            "sn108": (40.701265, -99.094713),
        }
        return campus_nodes

    def get_check_node_radians(self):
        for nodes in self.node_library().items():
            check_node_lat_rad = nodes[1][0] * (math.pi/180)
            check_node_long_rad = nodes[1][1] * (math.pi/180)
            self.haversine_formula(check_node_lat_rad, check_node_long_rad, nodes)

    def haversine_formula(self, check_node_lat_rad, check_node_long_rad, nodes):
        earth_radius = 3959
        distance = 2 * earth_radius * math.asin(
            math.sqrt(
                math.sin((self.get_live_lat_rad() - check_node_lat_rad) / 2) ** 2 +
                math.cos(self.get_live_lat_rad()) *
                math.cos(check_node_lat_rad) *
                math.sin((self.get_live_long_rad() - check_node_long_rad) / 2) ** 2
            )
        )
        if distance<self.get_closest_value():
            self.set_closest_value(distance)
            print(self.get_closest_value(), nodes)


    def run_java_script(self):
        test_code = """
            let map;
            let marker;
            let watchId;

        """
        result = js2py.eval_js6(test_code)
        print(result)

    def find_nearest_node(self):
        print(self.retrieve_location())

    # getters
    def get_live_lat(self):
        return self.__live_lat

    def get_live_long(self):
        return self.__live_long

    def get_wait_time(self):
        return self.__wait_time

    def get_live_lat_rad(self):
        return self.__live_lat_rad

    def get_live_long_rad(self):
        return self.__live_long_rad

    def get_closest_value(self):
        return self.__closest_value

    # setters
    def set_live_lat(self, live_lat):
        self.__live_lat = live_lat

    def set_live_long(self, live_long):
        self.__live_long = live_long

    def set_wait_time(self, wait_time):
        self.__wait_time = wait_time

    def set_live_lat_rad(self, live_lat_rad):
        self.__live_lat_rad = live_lat_rad

    def set_live_long_rad(self, live_long_rad):
        self.__live_long_rad = live_long_rad

    def set_closest_value(self, closest_value):
        self.__closest_value = closest_value
    # tostring


test = Live_Tracking()
test.run_java_script()