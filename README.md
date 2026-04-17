**The Project description (PORTFOLIO)**

**3D Real-Time Satellite Orbit Tracking System**
This project tracks real satellites currently in orbit using live data fetched directly from CelesTrak, a public database of Two-Line Element (TLE) sets. 

TLE data encodes a satellite's orbital parameters - inclination, eccentricity, mean motion, which are then fed into an SGP4 orbit propagation algorithm to compute the satellite's exact position and velocity at any given moment in time. 
The system renders the satellite's trajectory in a 3D globe using Three.js, updating the position in real time as the satellite moves. 
It outputs telemetry-style data including latitude, longitude, altitude, and velocity. 
This is a real system tracking real satellites — the data is live.


**CubeSat Simulation with FDIR Logic**
This project simulates a fictional CubeSat called AETHER-1 in Low Earth Orbit at 550 km altitude, modeling the physics of how a real spacecraft behaves over time. Every simulated minute, the spacecraft advances through its orbit — cycling between sunlight and eclipse. 
In sunlight, the solar panels charge the battery and the spacecraft heats up. In eclipse, the battery drains and temperature drops. 
On top of this, the attitude control system gradually drifts, and the communication link with the ground station only operates during short pass windows each orbit. 

The core of the project is the FDIR layer - Fault Detection, Isolation, and Recovery, which monitors all subsystems autonomously. When something goes wrong, such as the battery dropping critically low, the system detects the fault, shuts off the payload to conserve power, enters Safe Mode, prioritizes charging, and then restores normal operations once the battery recovers, all without any human input. 

The physics engine was originally built in Python across multiple files modeling power, thermal, ADCS, and communications subsystems. 
It runs live in the browser as a real-time mission control dashboard, with charts, subsystem health indicators, a fault log, and ground command buttons updating every 1.5 seconds.
