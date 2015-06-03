var program;     // Shader program
var ext;         // WebGL ANGLE extension interface

var explosionSystem;
var thrusterSystem;

function ParticleSystem()
{
    this.baseModel = 0;
    this.baseModelCount = 0;
    this.modelType = gl.POINTS;
    this.partPos = new Float32Array();
    this.partColor = new Float32Array();
    this.partScale = new Float32Array();
    this.partRand = new Float32Array();

    this.partVel = new Array();
    this.partColorVel = new Array();
    this.partTtl = new Array();
    
    this.nValid = 0;
    this.nParts = 0;
    
    this.posBuf = gl.createBuffer();
    this.colorBuf = gl.createBuffer();
    this.scaleBuf = gl.createBuffer();
    this.randBuf = gl.createBuffer();
}

ParticleSystem.prototype.requestAdditionalSize = function (size)
{
    if (this.nValid + size > this.nParts)
    {
	this.nParts = this.nValid + size;
	
	var expandedPartPos = new Float32Array(this.nParts * 3);
	var expandedPartVel = new Array(this.nParts * 3);
	for (var i = 0; i < this.nValid * 3; i++)
	{
	    expandedPartPos[i] = this.partPos[i];
	    expandedPartVel[i] = this.partVel[i];
	}
	this.partPos = expandedPartPos;
	this.partVel = expandedPartVel;
	
	var expandedPartColor = new Float32Array(this.nParts * 4);
	var expandedPartColorVel = new Array(this.nParts * 4);
	for (var i = 0; i < this.nValid * 4; i++)
	{
	    expandedPartColor[i] = this.partColor[i];
	    expandedPartColorVel[i] = this.partColorVel[i];
	}
	this.partColor = expandedPartColor;
	this.partColorVel = expandedPartColorVel;
	
	var expandedPartTtl = new Array(this.nParts);
	var expandedPartScale = new Float32Array(this.nParts);
	var expandedPartRand = new Float32Array(this.nParts);
	var i;
	for (i = 0; i < this.nValid; i++)
	{
	    expandedPartTtl[i] = this.partTtl[i];
	    expandedPartScale[i] = this.partScale[i];
	    expandedPartRand[i] = this.partRand[i];
	}
	for (; i < this.nParts; i++)
	    expandedPartRand[i] = Math.random();
	this.partTtl = expandedPartTtl;
	this.partScale = expandedPartScale;
	this.partRand = expandedPartRand;
    }
}

// You must call requestAdditionalSize before this function.
ParticleSystem.prototype.addParticle = function (particle)
{
    var baseIndex = this.nValid * 3;
    for (var i = 0; i < 3; i++)
    {
	this.partPos[baseIndex+i] = particle.pos[i];
	this.partVel[baseIndex+i] = particle.vel[i];
    }
    
    baseIndex = this.nValid * 4;
    for (var i = 0; i < 4; i++)
    {
	this.partColor[baseIndex+i] = particle.color[i];
	this.partColorVel[baseIndex+i] = particle.colorVel[i];
    }
    
    baseIndex = this.nValid;
    this.partTtl[baseIndex] = particle.ttl;
    this.partScale[baseIndex] = particle.scale;
    
    this.nValid++;
}

ParticleSystem.prototype.update = function (dt)
{
    for (var i = 0; i < this.nValid; i++)
    {
	this.partTtl[i] -= dt;
	if (this.partTtl[i] <= 0)
	{	
	    this.nValid--;
	    
	    var destIndex = i * 3;
	    var srcIndex = this.nValid * 3;
	    for (var j = 0; j < 3; j++)
	    {
		this.partPos[destIndex+j] = this.partPos[srcIndex+j];
		this.partVel[destIndex+j] = this.partVel[srcIndex+j];
	    }
	    
	    destIndex = i * 4;
	    srcIndex = this.nValid * 4;
	    for (var j = 0; j < 4; j++)
	    {
		this.partColor[destIndex+j] = this.partColor[srcIndex+j];
		this.partColorVel[destIndex+j] = this.partColorVel[srcIndex+j];
	    }
	    
	    this.partTtl[i] = this.partTtl[this.nValid];
	    this.partScale[i] = this.partScale[this.nValid];
	    this.partRand[i] = this.partRand[this.nValid];
	    
	    i--;
	    continue;
	}
	
	var baseIndex = i * 3;
	for (var j = 0; j < 3; j++)
	    this.partPos[baseIndex+j] += this.partVel[baseIndex+j] * dt;
	baseIndex = i * 4;
	for (var j = 0; j < 4; j++)
	    this.partColor[baseIndex+j] += this.partColorVel[baseIndex+j] * dt;
    }
}

ParticleSystem.prototype.render = function ()
{
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

/*
    var vPosition = gl.getAttribLocation(program, "vPosition");
    var vOffset = gl.getAttribLocation(program, "vOffset");
    var vColor = gl.getAttribLocation(program, "vColor");
    var vScale = gl.getAttribLocation(program, "vScale");
    var vRand = gl.getAttribLocation(program, "vRand");
    var uTransform = gl.getUniformLocation(program, "uTransform");
*/
    var vPosition = shaderProgram.vertexPositionAttribute;
    var vOffset = gl.getAttribLocation(shaderProgram, "aPartOffset");
    var vColor = gl.getAttribLocation(shaderProgram, "aPartColor");
    var vScale = gl.getAttribLocation(shaderProgram, "aPartScale");
    var vRand = gl.getAttribLocation(shaderProgram, "aPartRand");
    var uIsParticle = gl.getUniformLocation(shaderProgram, "uRenderType");

    gl.enableVertexAttribArray(vColor);
    gl.enableVertexAttribArray(vScale);
    gl.enableVertexAttribArray(vOffset);
    gl.enableVertexAttribArray(vRand);
    gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
    gl.disableVertexAttribArray(shaderProgram.normalPositionAttribute);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.baseModel);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.partPos, gl.STREAM_DRAW);
    gl.vertexAttribPointer(vOffset, 3, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(vOffset, 1);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.partColor, gl.STREAM_DRAW);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(vColor, 1);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.scaleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.partScale, gl.STREAM_DRAW);
    gl.vertexAttribPointer(vScale, 1, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(vScale, 1);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.randBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.partRand, gl.STREAM_DRAW);
    gl.vertexAttribPointer(vRand, 1, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(vRand, 1);
    
    gl.uniform1i(uIsParticle, 1);

    setMatrixUniforms();
    
    ext.drawArraysInstancedANGLE(this.modelType, 0, this.baseModelCount / 3, this.nValid);
    
    gl.disable(gl.BLEND);
    gl.depthMask(true);

    gl.disableVertexAttribArray(vOffset);
    gl.disableVertexAttribArray(vColor);
    gl.disableVertexAttribArray(vScale);
    gl.disableVertexAttribArray(vRand);
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
    gl.enableVertexAttribArray(shaderProgram.normalPositionAttribute);
}

function Particle()
{
    this.ttl = 1;
    this.size = 0;
    this.scale = 0;
    this.color = [1.0, 0.0, 0.0, 0.1];
    this.vel = [0.0, 0.0, 0.0];
    this.pos = [0.0, 0.0, 0.0];
    this.modelData = null;
    this.modelCount = 0;
    this.modelType = 0;
    this.modelPointSize = 1.0;
    this.valid = false;
}

// Initialization function
function initParticleSystem()
{
    makeExplosionSystem();
    makeThrusterSystem();
}

function getNewParticle()
{
    if (deadParticles.length > 0)
        return deadParticles.pop();
    var particle = new Particle();
    particles.push(particle);
    return particle;
}

function makeExplosionSystem()
{
    explosionSystem = new ParticleSystem();
    
    var sphere = getSphere(20);
    explosionSystem.baseModel = sphere.buf;
    explosionSystem.baseModelCount = sphere.n;
    
    explosionSystem.modelType = gl.TRIANGLES;
    
    explosionSystem.requestAdditionalSize(10000);
}

function makeThrusterSystem()
{
    thrusterSystem = new ParticleSystem();

    var sphere = getSphere(20);
    thrusterSystem.baseModel = sphere.buf;
    thrusterSystem.baseModelCount = sphere.n;

    thrusterSystem.modelType = gl.TRIANGLES;

    thrusterSystem.requestAdditionalSize(10000);
}

function makeExplosion(x, y, z, scale, num)
{
    makeExplosionWithSystem(x, y, z, scale, num);
}

function makeThruster(x, y, z)
{
    x = x || 0.0;
    y = y || 0.0;
    z = z || 0.0;

    var particle = new Particle();
    
    thrusterSystem.requestAdditionalSize(40);
    for (var i = 0; i < 40; i++)
    {
        var posMag = 0.4 * Math.random();
        var velMag = 5.0 * Math.random();
        var theta = Math.random() * 2 * Math.PI;
        var phi = Math.random() * 2 * Math.PI;
/*
	particle.pos = [x - 0.4 + 0.8 * Math.random(),
                        y - 0.4 + 0.8 * Math.random(),
                        z];
	particle.vel = [-2.0 + 4.0 * Math.random(),
                        -2.0 + 4.0 * Math.random(),
                        1.0]; 
*/
        particle.pos = [x + Math.cos(theta) * posMag,
                        y + Math.sin(theta) * posMag,
                        z];
        particle.vel = [Math.cos(phi) * velMag,
                        Math.sin(phi) * velMag,
                        1.0];
	var velMag = 0.1 + 0.7 * Math.sqrt(Math.random());
	for (var j = 0; j < 3; j++)
	    particle.vel[j] *= velMag;
	particle.color = [0.1 + 0.1 * Math.random(),
			  0.1 + 0.2 * Math.random(),
			  0.8 + 0.1 * Math.random(),
			  0.05 + 0.05 * Math.random()];
	particle.ttl = 0.05 + Math.random() * 0.1;
	particle.colorVel = [-0.1 / particle.ttl,
			     -0.1 / particle.ttl,
			     -0.1 / particle.ttl,
			     -particle.color[3] / particle.ttl];
	particle.scale = 0.25 + 0.05 * Math.random();
	thrusterSystem.addParticle(particle);
    }
}

/// DEPRECATED
function makeExplosionWithSystem(x, y, z, scale, num)
{
    x = x || 0.0;
    y = y || 0.0;
    z = z || 0.0;
    scale = scale || 1.0;
    num = num || 1000;

    var particle = new Particle();
    
    explosionSystem.requestAdditionalSize(num);
    for (var i = 0; i < num; i++)
    {
	particle.pos = [x, y, z];
	particle.vel = randomDirection();
	var velMag = (0.1 + 0.7 * Math.sqrt(Math.random())) * scale;
	for (var j = 0; j < 3; j++)
	    particle.vel[j] *= velMag;
	particle.color = [0.9 + 0.1 * Math.random(),
			  0.1 + 0.2 * Math.random(),
			  0.1,
			  0.1 + 0.1 * Math.random()];
	particle.ttl = 0.5 + Math.random() * 0.2;
	particle.colorVel = [-0.1 / particle.ttl,
			     -0.1 / particle.ttl,
			     -0.1 / particle.ttl,
			     -particle.color[3] / particle.ttl];
	particle.scale = (0.05 + 0.1 * Math.random()) * scale;
	explosionSystem.addParticle(particle);
    }
}

// The equal-area projection of a sphere onto a rectangle allows us to use this algorithm
// to generate a uniformly distributed direction in 3D space:
function randomDirection()
{
    var theta = 2 * Math.PI * Math.random();
    var z = -1 + 2 * Math.random();
    var coeff = Math.sqrt(1 - z * z);
    
    return [coeff * Math.cos(theta), coeff * Math.sin(theta), z];
}

// Produces an icosphere with at least as many vertices as nVerts.
function getSphere(nVerts)
{
    // Define a Triangle and Vertex class for convenience
    function Triangle(v0, v1, v2)
    {
        this.v = [v0, v1, v2];
    }

    function Vertex(x, y, z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Begin with a tetrahedron with unit radius
    var a = 1.0;
    var b = 1.0 / Math.sqrt(2.0);
    var mag = Math.sqrt(a*a + b*b);
    a = a / mag; b = b / mag;
    var baseVerts = [new Vertex(a, 0.0, -b), new Vertex(-a, 0.0, -b),
                     new Vertex(0.0, a, b), new Vertex(0.0, -a, b)];
    var faces = [new Triangle(baseVerts[0], baseVerts[2], baseVerts[3]),
                 new Triangle(baseVerts[0], baseVerts[1], baseVerts[2]),
                 new Triangle(baseVerts[0], baseVerts[3], baseVerts[1]),
                 new Triangle(baseVerts[1], baseVerts[3], baseVerts[2])];
    var curNVerts = 4;
    var curNEdges = 6;

    // While we still need more vertices, split all faces into more triangles
    while (curNVerts < nVerts)
    {
        var tempFaces = new Array();
        for (var i = 0; i < faces.length; i++)
        {
            // Generate new vertices from the midpoints of each triangle
            var faceVerts = faces[i].v;
            var nextVerts = new Array(3);
            for (var j = 0; j < 3; j++)
            {
                var u = faceVerts[j];
                var v = faceVerts[(j+1) % 3];

                var x = (u.x + v.x) / 2;
                var y = (u.y + v.y) / 2;
                var z = (u.z + v.z) / 2;
                
                // Normalize vertex to be at radius 1
                var mag = Math.sqrt(x*x + y*y + z*z);
                nextVerts[j] = new Vertex(x/mag, y/mag, z/mag);
            }

            // Generate faces
            tempFaces.push(new Triangle(faceVerts[0], nextVerts[0], nextVerts[2]));
            tempFaces.push(new Triangle(faceVerts[1], nextVerts[1], nextVerts[0]));
            tempFaces.push(new Triangle(faceVerts[2], nextVerts[2], nextVerts[1]));
            tempFaces.push(new Triangle(nextVerts[0], nextVerts[1], nextVerts[2]));
        }
        curNVerts += curNEdges;
        curNEdges += 3 * faces.length;
        faces = tempFaces;
    }
    
    // Flatten vertex array into OpenGL-friendly format
    var verts = new Array();
    for (var i = 0; i < faces.length; i++)
    {
        for (var j = 0; j < 3; j++)
        {
            verts.push(faces[i].v[j].x);
            verts.push(faces[i].v[j].y);
            verts.push(faces[i].v[j].z);
        }
    }

    verts = new Float32Array(verts);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    
    var retObj = new Object();
    retObj.buf = buf;
    retObj.n = verts.length;
    
    return retObj;
}
