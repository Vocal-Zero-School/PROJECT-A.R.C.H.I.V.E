float random (in float x) {
    return fract(sin(x)*1e4);
}

float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}

float drawRect(in vec2 st, in vec2 bottomleft, in float xl, in float yl){
    	//draw shape
        vec2 leftBottom = step(vec2(0.0), st-bottomleft);
        vec2 rightTop = step(vec2(0.0),bottomleft+vec2(xl,yl)-st);
        float rec = leftBottom.x*leftBottom.y*rightTop.x*rightTop.y;
        return rec;
    }

float pattern(vec2 st, vec2 v, float t) {
    vec2 fractUv = fract(st+v);
    vec2 p = floor(st+v);
    
    float pct = smoothstep(t-0.2,t+0.2, random(100.+p*.000001)+random(p.y)*0.5 );
    if(mod(floor(sin(p.y+iTime)),2.0)==1.0){
        pct += drawRect(fractUv, vec2(0.0,0.0),1.0,0.1);
        pct += drawRect(fractUv, vec2(0.0),0.2,1.0);
        pct += drawRect(fractUv, vec2(0.7,0.0),0.3,1.0);
        pct += drawRect(fractUv, vec2(0.35,0.20),0.15,0.7);
    }else{
        pct += drawRect(fractUv, vec2(0.0),0.3,1.0);
        pct += drawRect(fractUv, vec2(0.6,0.0),0.4,1.0);
        pct += drawRect(fractUv, vec2(0.0,0.0),1.0,0.1);
    }
    
       
    return pct;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
	uv = uv*2.0-1.0;
    uv.x *= iResolution.x/iResolution.y;
    
    //grid
    vec2 grid = vec2(15.0,15.0);
    uv *= grid;
    
    
    vec2 intUv = floor(uv);
    vec2 velocity = vec2(0.0,20.0)*random(intUv.x)+vec2(0.0,1.0);
    
    vec3 col = vec3(0.0);
	col = 1.0- vec3( pattern(uv,velocity*iTime, 0.33));
    
    
    // Output to screen
    fragColor = vec4(0.0,col.g,0.0 ,1.0);
}