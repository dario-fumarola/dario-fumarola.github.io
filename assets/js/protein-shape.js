// C-alpha backbone of villin headpiece, PDB 1YRF, shared with the project illustration.
const backbone = [[-3.35145,7.06135,-6.50449],[-6.46789,5.52424,-8.06056],[-7.09954,1.91847,-7.17879],[-10.03095,3.08868,-5.08974],[-7.90365,5.55476,-3.15007],[-5.19763,2.9504,-2.63364],[-7.66709,0.54104,-1.12224],[-9.00172,3.29163,1.15641],[-5.50385,4.3211,2.33942],[-3.98974,0.86738,2.79941],[-7.0409,-1.25446,3.60021],[-6.49301,-3.79166,0.84919],[-6.12603,-3.88401,-2.90162],[-2.86513,-3.2998,-4.75883],[-2.83075,-6.94863,-5.62863],[-3.04105,-7.91628,-1.96228],[-0.41341,-5.41129,-0.91117],[1.95872,-6.70504,-3.53404],[2.06781,-10.05164,-1.65883],[3.58037,-8.47545,1.43749],[7.39368,-8.48034,1.94148],[9.02855,-5.75758,-0.07352],[10.44879,-4.00132,2.98094],[6.96641,-4.01985,4.51359],[5.38509,-2.48766,1.41214],[8.02375,0.25618,1.63204],[7.36657,0.7535,5.35035],[3.613,0.90469,5.02334],[3.81106,3.40447,2.21172],[6.31198,5.63299,4.05757],[4.19794,5.52052,7.20983],[1.315,6.96448,5.14136],[3.58635,9.60208,3.55972],[3.62706,7.87478,0.11774],[6.34164,6.45225,-2.1655]];

export function proteinPose(angle, yaw) {
  const pivot = backbone[12], axis = pivot.map((v, i) => v - backbone[11][i]);
  const length = Math.hypot(...axis), u = axis.map(v => v / length);
  const c = Math.cos(angle), s = Math.sin(angle);
  const points = backbone.map((point, i) => {
    if (i <= 12) return [...point];
    const v = point.map((n, j) => n - pivot[j]);
    const dot = u.reduce((sum, n, j) => sum + n * v[j], 0);
    const cross = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
    return v.map((n, j) => pivot[j] + n*c + cross[j]*s + u[j]*dot*(1-c));
  });
  const center = [0,1,2].map(i => points.reduce((sum,p) => sum+p[i],0)/points.length);
  return points.map(point => {
    const [x,y,z] = point.map((v,i) => v-center[i]);
    const a = x*Math.cos(yaw)+z*Math.sin(yaw), depth = z*Math.cos(yaw)-x*Math.sin(yaw);
    return [60+a*2.9,48-(y*.94-depth*.34)*2.9,depth*.94+y*.34];
  });
}
export function proteinSegment(points, i) {
  const p0=points[Math.max(0,i-1)], p1=points[i], p2=points[i+1], p3=points[Math.min(points.length-1,i+2)];
  const c1=p1.slice(0,2).map((v,j)=>v+(p2[j]-p0[j])/6);
  const c2=p2.slice(0,2).map((v,j)=>v-(p3[j]-p1[j])/6);
  const pair=p=>p.slice(0,2).map(v=>v.toFixed(2)).join(' ');
  return 'M'+pair(p1)+'C'+pair(c1)+' '+pair(c2)+' '+pair(p2);
}
