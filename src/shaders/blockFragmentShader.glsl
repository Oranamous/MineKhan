  
#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

uniform sampler2D uSampler;
uniform float uTime;
uniform bool uTrans;
uniform vec3 uSky; // vec3(0.33, 0.54, 0.72)
varying float vShadow;
varying float vTemperature;
varying float vMaterial;
varying vec2 vTexture;
varying float vFog;

void main(){
    vec4 color = texture2D(uSampler, vTexture);
    // 0.6, 0.6, 0.4 - Hot
    // 0.4, 0.7, 0.6 - Cold
    // output = (a - b) * (1.0 - vTemperature) + b;
    if(color.r == color.g && color.r == color.b && (vMaterial == 2.0 || vMaterial == 3.0)){
        color.r *= (0.4 - 0.6) * (1.0 - vTemperature) + 0.6;
        color.g *= (0.7 - 0.6) * (1.0 - vTemperature) + 0.6;
        color.b *= (0.6 - 0.4) * (1.0 - vTemperature) + 0.4;
    }
    gl_FragColor = vec4(mix(color.rgb * vShadow, uSky * uTime, vFog), color.a);
    if (!uTrans && gl_FragColor.a != 1.0) discard;
    else if (uTrans && gl_FragColor.a == 1.0) discard;
}