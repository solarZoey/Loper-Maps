# Import Files/Modules
import requests
import time

class Live_Tracking:
    # data attributes
    __live_lat = -1
    __live_long = -1
    __wait_time = -1


    # init
    def __init__(self):
        self.set_live_lat(float(self.retrieve_location()[0]))
        self.set_live_long(float(self.retrieve_location()[1]))

    # helpers
    def retrieve_location(self):
        response = requests.get('https://ipinfo.io/')
        data = response.json()
        location = data['loc'].split(',')
        return location

    def find_nearest_node(self):
        pass

    # getters
    def get_live_lat(self):
        return self.__live_lat

    def get_live_long(self):
        return self.__live_long

    def get_wait_time(self):
        return self.__wait_time

    # setters
    def set_live_lat(self, live_lat):
        self.__live_lat = live_lat

    def set_live_long(self, live_long):
        self.__live_long = live_long

    def set_wait_time(self, wait_time):
        self.__wait_time = wait_time

    # tostring
