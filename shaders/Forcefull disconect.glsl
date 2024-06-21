// DECODE NTSC AND CRT EFFECTS

const float XRES = 54.0 * 8.0;
const float YRES = 33.0 * 8.0;

#define BRIGHTNESS 1.1
#define SATURATION 0.6
#define BLUR 0.7
#define BLURSIZE 0.2
#define CHROMABLUR 0.7
#define CHROMASIZE 6.0
#define SUBCARRIER 2.1
#define CROSSTALK 0.1
#define SCANFLICKER 0.33
#define INTERFERENCE1 1.0
#define INTERFERENCE2 0.001

const float fishEyeX = 0.1;
const float fishEyeY = 0.24;
const float vignetteRounding = 160.0;
const float vignetteSmoothness = 0.7;

// ------------


#define PI 3.14159265
#define CHROMA_MOD_FREQ (0.4 * PI)

#define IFRINGE (1.0 - FRINGE)

// Fish-eye effect
vec2 fisheye(vec2 uv) {
    uv *= vec2(1.0+(uv.y*uv.y)*fishEyeX,1.0+(uv.x*uv.x)*fishEyeY);
    return uv * 1.02;
}

float vignette(vec2 uv) {
    uv *= 1.99;
    float amount = 1.0 - sqrt(pow(abs(uv.x), vignetteRounding) + pow(abs(uv.y), vignetteRounding));
    float vhard = smoothstep(0., vignetteSmoothness, amount);
    return(vhard);
}


const mat3 yiq2rgb_mat = mat3(
    1.0, 1.0, 1.0,
    0.956, -0.2720, -1.1060,
    0.6210, -0.6474, 1.7046
);

vec3 yiq2rgb(vec3 yiq) {
    return yiq2rgb_mat * yiq;
}

#define KERNEL 25
const float luma_filter[KERNEL] = float[KERNEL](0.0105,0.0134,0.0057,-0.0242,-0.0824,-0.1562,-0.2078,-0.185,-0.0546,0.1626,0.3852,0.5095,0.5163,0.4678,0.2844,0.0515,-0.1308,-0.2082,-0.1891,-0.1206,-0.0511,-0.0065,0.0114,0.0127,0.008);
const float chroma_filter[KERNEL] = float[KERNEL](0.001,0.001,0.0001,0.0002,-0.0003,0.0062,0.012,-0.0079,0.0978,0.1059,-0.0394,0.2732,0.2941,0.1529,-0.021,0.1347,0.0415,-0.0032,0.0115,0.002,-0.0001,0.0002,0.001,0.001,0.001);

vec3 get(vec2 uv, float off, float d, float yscale) {
    float offd = off * d;
    return texture(iChannel0, uv + vec2(offd, yscale * offd)).xyz;
}

float peak(float x, float xpos, float scale) {
    return clamp((1.0 - x) * scale * log(1.0 / abs(x - xpos)), 0.0, 1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    float scany = round(uv.y * YRES);
    /*
    fragColor = vec4(texture(iChannel0, uv).xyz, 1.0);
    return;
    */
    uv -= vec2(0.5);
    uv = fisheye(uv);
    float vign = vignette(uv);
    uv += vec2(0.5);
    float mframe = float(iFrame % 2);
    uv.y += mframe * 1.0 / YRES * SCANFLICKER;
    
    // interference
    
    float r = random(vec2(0.0, scany), iTime);
    if (r > 0.995) {r *= 3.0;}
    float ifx1 = INTERFERENCE1 * 2.0 / iResolution.x * r;
    float ifx2 = INTERFERENCE2 * (r * peak(uv.y, 0.2, 0.2));
    uv.x += ifx1 + -ifx2;
    
    // luma fringing and chroma blur
    
    float d = 1.0 / XRES * (BLURSIZE + ifx2 * 100.0);
    vec3 lsignal = vec3(0.0);
    vec3 csignal = vec3(0.0);
    for (int i = 0; i < KERNEL; i++) {
        float offset = float(i) - 12.0;
        vec3 suml = get(uv, offset, d, 0.67);
        lsignal += suml * vec3(luma_filter[i], 0.0, 0.0);
        vec3 sumc = get(uv, offset, d * CHROMASIZE, 0.67);
        csignal += sumc * vec3(0.0, chroma_filter[i], chroma_filter[i]);
    }
    vec3 sat = texture(iChannel0, uv).xyz;
    vec3 lumat = sat * vec3(1.0, 0.0, 0.0);
    vec3 chroat = sat * vec3(0.0, 1.0, 1.0);
    vec3 signal = lumat * (1.0 - BLUR) + BLUR * lsignal + chroat * (1.0 - CHROMABLUR) + CHROMABLUR * csignal;

    float scanl = 0.5 + 0.5 * abs(sin(PI * uv.y * YRES));
    
    // decoding chroma saturation and phase
    
    float lchroma = signal.y * SATURATION;
    float phase = signal.z * 6.28318530718;
    
    signal.x *= BRIGHTNESS;
    signal.y = lchroma * sin(phase);
    signal.z = lchroma * cos(phase);
    
    // color subcarrier signal, crosstalk
    
    float chroma_phase = iTime * 60.0 * PI * 0.6667;
    float mod_phase = chroma_phase + (uv.x + uv.y * 0.1) * CHROMA_MOD_FREQ * XRES * 2.0;
    float scarrier = SUBCARRIER * lchroma;
    float i_mod = cos(mod_phase);
    float q_mod = sin(mod_phase);
    
    signal.x *= CROSSTALK * scarrier * q_mod + 1.0 - ifx2 * 30.0;
    signal.y *= scarrier * i_mod + 1.0;
    signal.z *= scarrier * q_mod + 1.0;
    
    vec3 out_color = signal;
    vec3 rgb = vign * scanl * yiq2rgb(out_color);
    fragColor = vec4(rgb, 1.0);
}
