from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sgp4.api import Satrec, jday
from datetime import datetime
import numpy as np
import math
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Fetch TLE from CelesTrak GP API
# -----------------------------
def fetch_tle(query):
    url = f"https://celestrak.org/NORAD/elements/gp.php?{query}&FORMAT=TLE"
    r = requests.get(url, timeout=10)
    lines = r.text.strip().splitlines()
    if len(lines) >= 3:
        return lines[0], lines[1], lines[2]
    return None

SAT_QUERIES = [
    "CATNR=25544",      # ISS
    "NAME=HUBBLE",
    "NAME=NOAA 19",
    "NAME=TERRA"
]

satellites = {}

for q in SAT_QUERIES:
    tle = fetch_tle(q)
    if tle:
        name, l1, l2 = tle
        satellites[name] = Satrec.twoline2rv(l1, l2)

# -----------------------------
# Coordinate conversion
# -----------------------------
def eci_to_ecef(r, t):
    x, y, z = r
    omega = 7.2921159e-5
    seconds = t.hour * 3600 + t.minute * 60 + t.second
    theta = omega * seconds
    return np.array([
        x * math.cos(theta) + y * math.sin(theta),
        -x * math.sin(theta) + y * math.cos(theta),
        z
    ])

def ecef_to_latlonalt(r):
    x, y, z = r
    rmag = np.linalg.norm(r)
    lat = math.degrees(math.asin(z / rmag))
    lon = math.degrees(math.atan2(y, x))
    alt = rmag - 6371
    return lat, lon, alt

# -----------------------------
# API
# -----------------------------
@app.get("/telemetry")
def telemetry():
    now = datetime.utcnow()
    jd, fr = jday(now.year, now.month, now.day,
                  now.hour, now.minute, now.second)

    data = []

    for name, sat in satellites.items():
        err, r, v = sat.sgp4(jd, fr)
        if err == 0:
            r_ecef = eci_to_ecef(r, now)
            lat, lon, alt = ecef_to_latlonalt(r_ecef)
            data.append({
                "name": name,
                "latitude": lat,
                "longitude": lon,
                "altitude": alt
            })

    return data
