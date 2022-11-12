attribute vec3  aVertex;
attribute vec2  aTexture;
attribute float aShadow;
attribute float aSkylight;
attribute float aBlocklight;
attribute float aTemperature;
attribute float aMaterial;
varying vec2  vTexture;
varying float vShadow;
varying float vFog;
varying float vTemperature;
varying float vMaterial;
uniform mat4 uView;
uniform float uDist;
uniform vec3 uPos;
uniform float uTime;
uniform float uTicks;
uniform float uAnimation;

void main() {
    vTexture = aTexture;
    // If you are going to change this final lightlevel calculation
    // you have to change line 4487 as well since it calculates lightlevel of entity based on this
    vShadow = aShadow * min(max(aSkylight * uTime, aBlocklight) * 0.9 + 0.1, 1.0);
    vTemperature = aTemperature;
    vMaterial = aMaterial;
    vec3 vertex = aVertex;
    vertex.y -= uAnimation;
    if(aMaterial == 3.0){
        vertex.x += sin(aVertex.x * 0.5 + uTicks) * 0.05;
        vertex.y += sin(aVertex.y * 0.5 + uTicks) * 0.05;
        vertex.z += sin(aVertex.z * 0.5 + uTicks) * 0.05;
    }
    if(aMaterial == 4.0){
        vertex.y += (sin((aVertex.x + aVertex.y + aVertex.z) * 0.25 + uTicks * 0.4) - 1.0) * 0.1;
    }
    gl_Position = uView * vec4(vertex, 1.0);

    float range = max(uDist / 5.0, 8.0);
    //vFog = clamp((length(uPos.xz - aVertex.xz) - uDist + range) / range, 0.0, 1.0);
    vFog = clamp(uAnimation * 0.01, 0.0, 1.0);
}