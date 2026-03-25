# Import Files/Modules
import requests
import time

class Live_Tracking:
    # data attributes

    # helpers

    # getters

    # setters

    # tostring

response = requests.get('https://ipinfo.io/')
data = response.json()


while(True):
    time.sleep(.01)
    loc = data['loc'].split(',')
    lat, long = float(loc[0]), float(loc[1])
    print(lat, long)