# Import Files/Modules
import requests
import time

class Live_Tracking:
    # data attributes
    __live_lat = -1
    __live_long = -1
    __wait_time = -1

    # init

    # helpers

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

response = requests.get('https://ipinfo.io/')
data = response.json()


while(True):
    time.sleep(.01)
    loc = data['loc'].split(',')
    lat, long = float(loc[0]), float(loc[1])
    print(lat, long)