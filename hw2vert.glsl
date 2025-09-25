#version 300 es
layout (location = 0) in vec3 aPos;

uniform vec2 movement;

void main() {
    gl_Position = vec4(aPos[0] + movement.x, 
                       aPos[1] + movement.y,
                       aPos[2],
                       1.0);
}