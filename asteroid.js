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

var astNormBuf;
var astPosBuf;
function initAsteroidBuffers() {
    //data for tetrahedron division
    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

    var pointsArray = [];
    var normalsArray = [];

    tetrahedron(va, vb, vc, vd, 2, false, pointsArray, normalsArray);
//    tetrahedron(va, vb, vc, vd, 1, false, pointsArray5, normalsArray5);

    //binding buffers and passing data for the different spheres
    astNormBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, astNormBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    astNormBuf.itemSize = 4;
    astNormBuf.numItems = flatten(normalsArray).length / 4;

    astPosBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, astPosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    astPosBuf.itemSize = 4;
    astPosBuf.numItems = flatten(pointsArray).length / 4;
}

function Asteroid()
{
    this.pos = [0.0, 0.0, 0.0];
    this.vel = [0.0, 0.0, 0.0];
    this.rotPos = 0.0;
    this.rotSpeed = 0.0;
    this.rotAxis = [0.0, 0.0, 0.0];
    this.radius = 1.0;
    this.scale = 1.0;
    this.alive = true;
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

var asteroids = [];
function makeAsteroid(difficulty)
{
    var asteroid = new Asteroid();
    asteroid.pos = [Math.random() * 200 - 100,
                    Math.random() * 30 - 15,
                    -200.0];
    target = [Math.random() * 26 - 13,
              Math.random() * 16 - 8,
              -20.0];
    travelTime = (1.5 * difficulty + 5) / difficulty;
    asteroid.vel = [(target[0] - asteroid.pos[0]) / travelTime,
                    (target[1] - asteroid.pos[1]) / travelTime,
                    (target[2] - asteroid.pos[2]) / travelTime];
    asteroid.scale = 1 + Math.random() * 3;

    asteroid.rotPos = Math.random() * 360.0;
    asteroid.rotSpeed = 5 + Math.random() * 30;
    asteroid.rotAxis = randomDirection();
    
//    asteroid.radius = .665 * asteroid.scale;
    asteroid.radius = asteroid.scale;
    asteroids.push(asteroid);
}

function drawAsteroids()
{
    shine = 32.0;
    pointR = 0.5;
    pointG = 0.5;
    pointB = 1.0;
/*
    specularR = 0.8;
    specularG = 0.8;
    specularB = 0.8;
    ambientR = 0.6;
    ambientG = 0.6;
    ambientB = 0.6;
*/
    specularR = 0.8;
    specularG = 0.8;
    specularB = 0.8;
    ambientR = 0.2;
    ambientG = 0.2;
    ambientB = 0.2;
/*
    gl.uniform4f(
        shaderProgram.ambientColorUniform,
        parseFloat(ambientR),
        parseFloat(ambientG),
        parseFloat(ambientB),
        1.0
    );

    gl.uniform4f(
        shaderProgram.plcUniform,
        parseFloat(pointR),
        parseFloat(pointG),
        parseFloat(pointB),
        1.0
    );

    gl.uniform4f(
        shaderProgram.plsUniform,
        parseFloat(specularR),
        parseFloat(specularG),
        parseFloat(specularB),
        1.0
    );
*/
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

    gl.bindBuffer(gl.ARRAY_BUFFER, astNormBuf);
    gl.vertexAttribPointer(cubeShaderProgram.normalPositionAttribute, astNormBuf.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, astPosBuf);
    gl.vertexAttribPointer(cubeShaderProgram.vertexPositionAttribute, astPosBuf.itemSize, gl.FLOAT, false, 0, 0);

//    gl.activeTexture(gl.TEXTURE0);
//    gl.bindTexture(gl.TEXTURE_2D, metalTexture); 
//    gl.uniform1i(cubeShaderProgram.samplerUniform, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, asteroidTexture);
    gl.uniform1i(cubeShaderProgram.cubeSamplerUniform, 1);

    gl.uniform1i(gl.getUniformLocation(cubeShaderProgram, "uRenderType"), 3);

    if (cubeShaderProgram.textureCoordAttribute != -1)
        gl.disableVertexAttribArray(cubeShaderProgram.textureCoordAttribute);
    
    for (var i = 0; i < asteroids.length; i++)
    { 
        mvMatrix = scale(asteroids[i].scale, asteroids[i].scale, asteroids[i].scale);
        mvMatrix = mult(rotate(asteroids[i].rotPos, asteroids[i].rotAxis[0],
                                                    asteroids[i].rotAxis[1],
                                                    asteroids[i].rotAxis[2]), mvMatrix);
        mvMatrix = mult(translate(asteroids[i].pos), mvMatrix);
        setMatrixUniformsCube();
        if (asteroids[i].alive)
            gl.drawArrays(gl.TRIANGLES, 0, astNormBuf.numItems);
    }

    if (cubeShaderProgram.textureCoordAttribute != -1)
        gl.enableVertexAttribArray(cubeShaderProgram.textureCoordAttribute);

    gl.useProgram(shaderProgram);
}
