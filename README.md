# Asteroids

### Setup Instructions

Please load `final.html` from the `master` branch. To download the source code click on the release tab and choose the tag `RELEASE-1.0`. Aside from the standard WebGL implementation, your browser will also need to support the ANGLE extensions to WebGL.

### How to Play

Controls:
* W - Up
* A - Left
* S - Down
* D - Right
* Spacebar - For shooting the missle and navigation

Your goal is to get to planet Friedman without getting hit by asteroids. The asteroids will speed up as the game progresses, and they will also spawn more frequently as time progresses. You can not continuously fire your missle, and must wait a period of three seconds before each fire. Your ship explodes after 3 hits.

### Advanced Features

#### Particle System

The particle system is used to render the player death explosion and the player's thrusters.

#### Collision Detection

Collision detection is used to determine when a player is hit by an asteroid, and when a player's missile hits an asteroid.

#### Cube Mapping

Added a cube mapping feature to map texture maps to spheres. We mapped the background planet using this technique.

#### Demo
![](http://i.imgur.com/FE11sex.gif?1)
