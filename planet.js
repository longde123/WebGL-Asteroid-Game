var index;
function flatTriangle(a, b, c, pointsArray, normalsArray) {
    var t1 = subtract(b, a);
    var t2 = subtract(c, a);
    var normal = normalize(cross(t2, t1));
    normal = vec4(normal);

    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);

    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    index += 3;
}

function triangle(a, b, c, pointsArray, normalsArray) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    // normals are vectors
    normalsArray.push(a[0],a[1], a[2], 0.0);
    normalsArray.push(b[0],b[1], b[2], 0.0);
    normalsArray.push(c[0],c[1], c[2], 0.0);

    index += 3;
}

function divideTriangle(a, b, c, count, flat, pointsArray, normalsArray) {
    if (count > 0) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);

        divideTriangle(a, ab, ac, count - 1, flat, pointsArray, normalsArray);
        divideTriangle(ab, b, bc, count - 1, flat, pointsArray, normalsArray);
        divideTriangle(bc, c, ac, count - 1, flat, pointsArray, normalsArray);
        divideTriangle(ab, bc, ac, count - 1, flat, pointsArray, normalsArray);
    }
    else if (flat) { // draw tetrahedron at end of recursion
        flatTriangle(a, b, c, pointsArray, normalsArray);
    }
    else {
        triangle(a, b, c, pointsArray, normalsArray);
    }
}

function tetrahedron(a, b, c, d, n, flat, pointsArray, normalsArray) {
    divideTriangle(a, b, c, n, flat, pointsArray, normalsArray);
    divideTriangle(d, c, b, n, flat, pointsArray, normalsArray);
    divideTriangle(a, d, b, n, flat, pointsArray, normalsArray);
    divideTriangle(a, c, d, n, flat, pointsArray, normalsArray);
}

var plntNormBuf;
var plntPosBuf;
function initPlanetBuffers() {
    //data for tetrahedron division
    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

    var pointsArray = [];
    var normalsArray = [];

    tetrahedron(va, vb, vc, vd, 5, false, pointsArray, normalsArray);

    //binding buffers and passing data for the different spheres
    plntNormBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, plntNormBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    plntNormBuf.itemSize = 4;
    plntNormBuf.numItems = flatten(normalsArray).length / 4;

    plntPosBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, plntPosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    plntPosBuf.itemSize = 4;
    plntPosBuf.numItems = flatten(pointsArray).length / 4;
    makePlanet();
}

function Planet()
{
    this.pos = [0.0, 0.0, 0.0];
    this.vel = [0.0, 0.0, 0.0];
    this.rotPos = 0.0;
    this.rotSpeed = 0.0;
    this.rotAxis = [0.0, 0.0, 0.0];
    this.radius = 1.0;
    this.scale = 1.0;
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

var planets = [];
function makePlanet()
{
    var planet = new Planet();
    planet.pos = [0, 0, -220.0];
    planet.vel = [0,0,0];
    planet.scale = 5;
    planet.rotPos = Math.random() * 360.0;
    planet.rotSpeed = 20;
    planet.rotAxis = [0, 1.0, 0];
    planet.radius = planet.scale;
    planets.push(planet);
}

function drawPlanet()
{
    shine = 32.0;
    pointR = 0.5;
    pointG = 0.5;
    pointB = 1.0;
    specularR = 0.8;
    specularG = 0.8;
    specularB = 0.8;
    ambientR = 0.2;
    ambientG = 0.2;
    ambientB = 0.2;

    gl.useProgram(cubeShaderProgram);

    gl.uniform4f(
        cubeShaderProgram.ambientColorUniform,
        parseFloat(ambientR),
        parseFloat(ambientG),
        parseFloat(ambientB),
        1.0
    );

    gl.uniform1f(
        cubeShaderProgram.shineUniform,
        parseFloat(shine)
    );

    gl.uniform4fv(cubeShaderProgram.plsUniform, flatten(specularColor));
    gl.uniform4fv(cubeShaderProgram.pldUniform, flatten(diffuseColor));
    gl.uniform4fv(cubeShaderProgram.ambientColorUniform, flatten(ambientColor));
    gl.uniform4fv(cubeShaderProgram.pllUniform, flatten(lightPosition));
    gl.uniform1f(cubeShaderProgram.shineUniform, parseFloat(shine));

    gl.bindBuffer(gl.ARRAY_BUFFER, plntNormBuf);
    gl.vertexAttribPointer(cubeShaderProgram.normalPositionAttribute, plntNormBuf.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, plntPosBuf);
    gl.vertexAttribPointer(cubeShaderProgram.vertexPositionAttribute, plntPosBuf.itemSize, gl.FLOAT, false, 0, 0);


    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, planetTexture);
    gl.uniform1i(cubeShaderProgram.cubeSamplerUniform, 1);

    gl.uniform1i(gl.getUniformLocation(cubeShaderProgram, "uRenderType"), 3);

    if (cubeShaderProgram.textureCoordAttribute != -1)
        gl.disableVertexAttribArray(cubeShaderProgram.textureCoordAttribute);
    
    var i = 0;
    if(curState == GameState.GAME)
        planets[i].scale += .01;
    mvMatrix = scale(planets[i].scale, planets[i].scale, planets[i].scale);
    mvMatrix = mult(rotate(planets[i].rotPos, planets[i].rotAxis[0],
                                            planets[i].rotAxis[1],
                                            planets[i].rotAxis[2]), mvMatrix);
    mvMatrix = mult(translate(planets[i].pos), mvMatrix);
    setMatrixUniformsCube();
    gl.drawArrays(gl.TRIANGLES, 0, plntNormBuf.numItems);

    if (cubeShaderProgram.textureCoordAttribute != -1)
        gl.enableVertexAttribArray(cubeShaderProgram.textureCoordAttribute);

    gl.useProgram(shaderProgram);
}

