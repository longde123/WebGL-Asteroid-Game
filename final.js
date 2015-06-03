var gl;
var ext;
function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;

        ext = gl.getExtension("ANGLE_instanced_arrays");
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var shaderProgram;
var cubeShaderProgram;
function initShaders() {
    // shaders are created by initShaders.js
    shaderProgram = handleShaders(gl, "shader-vs", "shader-fs");
    gl.useProgram(shaderProgram);

    // attach shader variables to be used later
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTexCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.normalPositionAttribute = gl.getAttribLocation(shaderProgram, "aNormal");
    gl.enableVertexAttribArray(shaderProgram.normalPositionAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.pllUniform = gl.getUniformLocation(shaderProgram, "uPLLocation");
    shaderProgram.pldUniform = gl.getUniformLocation(shaderProgram, "uPLDiffuse");
    shaderProgram.plsUniform = gl.getUniformLocation(shaderProgram, "uPLSpecular");
    shaderProgram.shineUniform = gl.getUniformLocation(shaderProgram, "uShine");

    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.cubeSamplerUniform = gl.getUniformLocation(shaderProgram, "uSamplerCube");
    
    cubeShaderProgram = handleShaders(gl, "shader-vs", "shader-fs-cube");
    gl.useProgram(cubeShaderProgram);
    cubeShaderProgram.vertexPositionAttribute = gl.getAttribLocation(cubeShaderProgram, "aPosition");
//    gl.enableVertexAttribArray(cubeShaderProgram.vertexPositionAttribute);

    cubeShaderProgram.textureCoordAttribute = gl.getAttribLocation(cubeShaderProgram, "aTexCoord");
//    gl.enableVertexAttribArray(cubeShaderProgram.textureCoordAttribute);

    cubeShaderProgram.normalPositionAttribute = gl.getAttribLocation(cubeShaderProgram, "aNormal");
//    gl.enableVertexAttribArray(cubeShaderProgram.normalPositionAttribute);

    cubeShaderProgram.pMatrixUniform = gl.getUniformLocation(cubeShaderProgram, "uPMatrix");
    cubeShaderProgram.mvMatrixUniform = gl.getUniformLocation(cubeShaderProgram, "uMVMatrix");
    cubeShaderProgram.nMatrixUniform = gl.getUniformLocation(cubeShaderProgram, "uNMatrix");
    cubeShaderProgram.ambientColorUniform = gl.getUniformLocation(cubeShaderProgram, "uAmbientColor");
    cubeShaderProgram.pllUniform = gl.getUniformLocation(cubeShaderProgram, "uPLLocation");
    cubeShaderProgram.pldUniform = gl.getUniformLocation(cubeShaderProgram, "uPLDiffuse");
    cubeShaderProgram.plsUniform = gl.getUniformLocation(cubeShaderProgram, "uPLSpecular");
    cubeShaderProgram.shineUniform = gl.getUniformLocation(cubeShaderProgram, "uShine");

    cubeShaderProgram.samplerUniform = gl.getUniformLocation(cubeShaderProgram, "uSampler");
    cubeShaderProgram.cubeSamplerUniform = gl.getUniformLocation(cubeShaderProgram, "uSamplerCube");
}

var mvMatrix;
var pMatrix;
var nMatrix;
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, flatten(pMatrix));
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, flatten(mvMatrix));
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, flatten(nMatrix));
}

function setMatrixUniformsCube() {
    gl.uniformMatrix4fv(cubeShaderProgram.pMatrixUniform, false, flatten(pMatrix));
    gl.uniformMatrix4fv(cubeShaderProgram.mvMatrixUniform, false, flatten(mvMatrix));
    gl.uniformMatrix3fv(cubeShaderProgram.nMatrixUniform, false, flatten(nMatrix));
}

// handles loaded textures; takes in a mipmap parameter to determine whether to use mipmapping or not
function handleLoadedTexture(texture, mipmap) {
    if (!mipmap) {
        // nearest neighbor filtering
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // flips the picture right-side up
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // upload image to graphics card
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        // scaling parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
    else {
        // mip mapping with tri-linear filtering
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        // used to repeat the texture (tile effect in this project)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function handleLoadedCubeTexture(texture, image, side) {
    // mip mapping with tri-linear filtering
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(side, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

//    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
}

var metalTexture;
var dogeTexture;
var bgTexture;
var loseTexture, winTexture, menuTexture;
// create the texture buffers
function initTexture() {
    // similar to creating buffers for vertices or indices
    metalTexture = gl.createTexture();
    // create an image object
    metalTexture.image = new Image();
    metalTexture.image.onload = function () {
        handleLoadedTexture(metalTexture, true)
    }
    // attach the image file to the object
    metalTexture.image.src = "spaceshipTexture.png";

    bgTexture = gl.createTexture();
    bgTexture.image = new Image();
    bgTexture.image.onload = function() {
        handleLoadedTexture(bgTexture, true);
    }
    bgTexture.image.src = "stars.jpg";

     missileTexture = gl.createTexture();
     missileTexture.image = new Image();
     missileTexture.image.onload = function () {
         handleLoadedTexture(missileTexture, true);
     }
     missileTexture.image.src = "orange.jpg";

    loseTexture = gl.createTexture();
    loseTexture.image = new Image();
    loseTexture.image.onload = function() {
        handleLoadedTexture(loseTexture, true);
    }
    loseTexture.image.src = "screenTextures/defeat.png";
    
    winTexture = gl.createTexture();
    winTexture.image = new Image();
    winTexture.image.onload = function() {
        handleLoadedTexture(winTexture, true);
    }
    winTexture.image.src = "screenTextures/victory.png";
    
    menuTexture = gl.createTexture();
    menuTexture.image = new Image();
    menuTexture.image.onload = function() {
        handleLoadedTexture(menuTexture, true);
    }
    menuTexture.image.src = "screenTextures/menu.png";
    /////////////////////////////asteroid texture///////////////////////////////

    asteroidTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, asteroidTexture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    asteroidTexture.imagePosX = new Image();
    asteroidTexture.imagePosX.onload = function() {
        handleLoadedCubeTexture(asteroidTexture, asteroidTexture.imagePosX, gl.TEXTURE_CUBE_MAP_POSITIVE_X);
    }
    asteroidTexture.imagePosX.src = "rock1.jpg";
    asteroidTexture.imageNegX = new Image();
    asteroidTexture.imageNegX.onload = function() {
        handleLoadedCubeTexture(asteroidTexture, asteroidTexture.imageNegX, gl.TEXTURE_CUBE_MAP_NEGATIVE_X);
    }
    asteroidTexture.imageNegX.src = "rock1.jpg";
    asteroidTexture.imagePosY = new Image();
    asteroidTexture.imagePosY.onload = function() {
        handleLoadedCubeTexture(asteroidTexture, asteroidTexture.imagePosY, gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
    }
    asteroidTexture.imagePosY.src = "rock2.jpg";
    asteroidTexture.imageNegY = new Image();
    asteroidTexture.imageNegY.onload = function() {
        handleLoadedCubeTexture(asteroidTexture, asteroidTexture.imageNegY, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);
    }
    asteroidTexture.imageNegY.src = "rock1.jpg";
    asteroidTexture.imagePosZ = new Image();
    asteroidTexture.imagePosZ.onload = function() {
        handleLoadedCubeTexture(asteroidTexture, asteroidTexture.imagePosZ, gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
    }
    asteroidTexture.imagePosZ.src = "rock1.jpg";
    asteroidTexture.imageNegZ = new Image();
    asteroidTexture.imageNegZ.onload = function() {
        handleLoadedCubeTexture(asteroidTexture, asteroidTexture.imageNegZ, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
    }
    asteroidTexture.imageNegZ.src = "rock2.jpg"
     
         /////////////////////////////planet texture///////////////////////////////
     
     planetTexture = gl.createTexture();
     gl.bindTexture(gl.TEXTURE_CUBE_MAP, planetTexture);
     gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
     gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
 
     planetTexture.imagePosX = new Image();
     planetTexture.imagePosX.onload = function() {
         handleLoadedCubeTexture(planetTexture, planetTexture.imagePosX, gl.TEXTURE_CUBE_MAP_POSITIVE_X);
     }
     planetTexture.imagePosX.src = "planetTextures/face5.png";
     planetTexture.imageNegX = new Image();
     planetTexture.imageNegX.onload = function() {
         handleLoadedCubeTexture(planetTexture, planetTexture.imageNegX, gl.TEXTURE_CUBE_MAP_NEGATIVE_X);
     }
     planetTexture.imageNegX.src = "planetTextures/face1.png";
     planetTexture.imagePosY = new Image();
     planetTexture.imagePosY.onload = function() {
         handleLoadedCubeTexture(planetTexture, planetTexture.imagePosY, gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
     }
     planetTexture.imagePosY.src = "planetTextures/face2.png";
     planetTexture.imageNegY = new Image();
     planetTexture.imageNegY.onload = function() {
         handleLoadedCubeTexture(planetTexture, planetTexture.imageNegY, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);
     }
     planetTexture.imageNegY.src = "planetTextures/face6.png";
     planetTexture.imagePosZ = new Image();
     planetTexture.imagePosZ.onload = function() {
         handleLoadedCubeTexture(planetTexture, planetTexture.imagePosZ, gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
     }
     planetTexture.imagePosZ.src = "planetTextures/face3.png";
     planetTexture.imageNegZ = new Image();
     planetTexture.imageNegZ.onload = function() {
         handleLoadedCubeTexture(planetTexture, planetTexture.imageNegZ, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
     }
     planetTexture.imageNegZ.src = "planetTextures/face4.png";
}

var cubePosBuf;
var cubeNormBuf;
var cube1TexBuf;
var cube2TexBuf;
var cubeIndBuf;
var cubeVertices;

var bgPosBuf;
var bgTexBuf;
var bgIndBuf;

var spaceship_pos;
var spaceship_intial_pos;
var spaceship_radius;
// initialize vertex and index buffers
function initBuffers() {
    // (0,0, -1
    spaceship_initial_pos = vec3( 0, 0, -1); //initial center will need to modify as ship moves
    spaceship_pos = vec3( spaceship_initial_pos[0] + xPos,
                         spaceship_initial_pos[1] + yPos,
                         spaceship_initial_pos[2] + zPos);
    spaceship_radius = 1; // for now lets pick 1
    // cube vertices
    cubeVertices = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -3.0,
        -1.0,  1.0, -3.0,
         1.0,  1.0, -3.0,
         1.0, -1.0, -3.0,

        // Top face
        -1.0,  1.0, -3.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -3.0,

        // Bottom face
        -1.0, -1.0, -3.0,
         1.0, -1.0, -3.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
         1.0, -1.0, -3.0,
         1.0,  1.0, -3.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -3.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -3.0
    ];
    cubePosBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeVertices), gl.STATIC_DRAW);
    cubePosBuf.itemSize = 3;
//    cubePosBuf.numItems = 27;
    cubePosBuf.numItems = 24;

    var cubeNormals = [
        // Front face
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,

        // Back face
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,

        // Top face
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,

        // Bottom face
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,

        // Right face
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,

        // Left face
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
    ];
    cubeNormBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeNormals), gl.STATIC_DRAW);
    cubeNormBuf.itemSize = 3;
//    cubeNormBuf.numItems = 27;
    cubeNormBuf.numItems = 24;

    var cube1TexCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    cube1TexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cube1TexBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube1TexCoords), gl.STATIC_DRAW);
    cube1TexBuf.itemSize = 2;
    cube1TexBuf.numItems = 24;

    var cubeIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23,  // Left face
    ];
    cubeIndBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
    cubeIndBuf.itemSize = 1;
    cubeIndBuf.numItems = 36;

    var bgPosCoords = new Float32Array([
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0
    ]);
    bgPosBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgPosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, bgPosCoords, gl.STATIC_DRAW);
    bgPosBuf.itemSize = 3;
    bgPosBuf.numItems = 12;

    var bgTexCoords = new Float32Array([
        0.0, 0.21875,
        1.0, 0.21875,
        0.0, 0.78125,
        1.0, 0.78125
    ]);
    bgTexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgTexBuf);
    gl.bufferData(gl.ARRAY_BUFFER, bgTexCoords, gl.STATIC_DRAW);
    bgTexBuf.itemSize = 2;
    bgTexBuf.numItems = 8;

    var bgIndices = new Uint16Array([
        0, 1, 2,
        1, 3, 2
    ]);
    bgIndBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bgIndBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bgIndices, gl.STATIC_DRAW);
    bgIndBuf.itemSize = 1;
    bgIndBuf.numItems = 6;
 
     var missileVertices = [
         // Front face
         -0.25, -0.25,  0.25,
          0.25, -0.25,  0.25,
          0.25,  0.25,  0.25,
         -0.25,  0.25,  0.25,
 
         // Back face
         -0.25, -0.25, -0.25,
         -0.25,  0.25, -0.25,
          0.25,  0.25, -0.25,
          0.25, -0.25, -0.25,
 
         // Top face
         -0.25,  0.25, -0.25,
         -0.25,  0.25,  0.25,
          0.25,  0.25,  0.25,
          0.25,  0.25, -0.25,
 
         // Bottom face
         -0.25, -0.25, -0.25,
          0.25, -0.25, -0.25,
          0.25, -0.25,  0.25,
         -0.25, -0.25,  0.25,
 
         // Right face
          0.25, -0.25, -0.25,
          0.25,  0.25, -0.25,
          0.25,  0.25,  0.25,
          0.25, -0.25,  0.25,
 
         // Left face
         -0.25, -0.25, -0.25,
         -0.25, -0.25,  0.25,
         -0.25,  0.25,  0.25,
         -0.25,  0.25, -0.25
     ];
     missilePosBuf = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, missilePosBuf);
     gl.bufferData(gl.ARRAY_BUFFER, flatten(missileVertices), gl.STATIC_DRAW);
     missilePosBuf.itemSize = 3;
     missilePosBuf.numItems = 24;
}

var hitSound;
var missileShootSound;
var missileExplodeSound;
var deathSound;
var music;
function initSounds() {
    hitSound = new Audio("hitSound.mp3");
    missileShootSound = new Audio("missileShoot.mp3");
    missileExplodeSound = new Audio("missileExplode.mp3");
    deathSound = new Audio("playerDeath.mp3");
    music = new Audio("bgm.mp3");
    music.loop = true;
    music.play();
}

// for translation
var xPos = -1.5;
var yPos = -6;
var zPos = -20.0;
var turnRotAngle = 0.0;
var health = 3;
var isInvulnerable = false;
var invulFlash = false;
var invulTimer = 0.0;
var flashEnable = false;
var flashTimer = 0.0;
var maxFlashTimer = 0.25;
var gameOverTimer = 0.0;
var victoryTimer = 0.0;

function resetPlayer() {
    xPos = -1.5;
    yPos = -6;
    zPos = -20.0;
    turnRotAngle = 0.0;
    spaceship_pos = vec3( spaceship_initial_pos[0] + xPos,
                          spaceship_initial_pos[1] + yPos,
                          spaceship_initial_pos[2] + zPos);
    totalTime = 0.0;
    health = 3;
    isInvulnerable = false;
    invulFlash = false;
    invulTimer = 0.0;
    flashEnable = false;
    flashTimer = 0.0;
    gameOverTimer = 0.0;
	victoryTimer = 0.0;
    planets[0].scale = 40.0;
    timeSinceLastMissile = 2.5;
    asteroids = [];
}

// perspective
var fovy = 45.0;
//var near = 0.1;
var near = 1;
var far = 350.0;

var lightPosition = [20.0, 10.0, -30.0, 1.0];
var missilePosx;
var missilePosy;
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    /// TODO: Clean this up when it works
    var uIsParticle = gl.getUniformLocation(shaderProgram, "uRenderType");
    gl.uniform1i(uIsParticle, 0);

    // setting 45 FOV with 960/540 aspect ratio
    pMatrix = perspective(45, gl.viewportWidth/gl.viewportHeight, near, far);
    mvMatrix = rotate(turnRotAngle, [0, 0, -1.0]);
    mvMatrix = mult(translate(xPos, yPos, zPos), mvMatrix);
    
    // assigning values to normal matrix
    nMatrix = [
        vec3(mvMatrix[0][0], mvMatrix[0][1], mvMatrix[0][2]),
        vec3(mvMatrix[1][0], mvMatrix[1][1], mvMatrix[1][2]),
        vec3(mvMatrix[2][0], mvMatrix[2][1], mvMatrix[2][2])
    ];
    if (rotation) {
        mvMatrix = mult(mvMatrix, rotate(cube1, [0, 1, 0]));
    }

    // setting colors and shine
    diffuseColor = [.8, .8, .8, 1.0];
    ambientColor = [0.2, 0.2, 0.2, 1.0];
    specularColor = [0.2, 0.2, 0.2, 1.0];
    shine = 30.0;

    // sending info to shaders to handle lighting
    gl.uniform4fv(shaderProgram.plsUniform, flatten(specularColor));
    gl.uniform4fv(shaderProgram.pldUniform, flatten(diffuseColor));
    gl.uniform4fv(shaderProgram.ambientColorUniform, flatten(ambientColor));
    gl.uniform4fv(shaderProgram.pllUniform, flatten(lightPosition));
    gl.uniform1f(shaderProgram.shineUniform, parseFloat(shine));

    // attaching texture and buffers to draw first cube
    if (curState != GameState.TITLE
        && health > 0 && !(isInvulnerable && invulFlash))
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, cubePosBuf);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubePosBuf.itemSize, gl.FLOAT, false, 0, 0);    
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormBuf);
        gl.vertexAttribPointer(shaderProgram.normalPositionAttribute, cubeNormBuf.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cube1TexBuf);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cube1TexBuf.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, metalTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndBuf);
        
        setMatrixUniforms();

        gl.drawElements(gl.TRIANGLES, cubeIndBuf.numItems, gl.UNSIGNED_SHORT, 0);

        // for rotations (r key)
        if (rotation) {
            mvMatrix = mult(mvMatrix, rotate(-cube1, [0, 1, 0]));
        }
        mvMatrix = translate(1, 0, 1);
        mvMatrix = mult(mvMatrix, rotate(90, [0, 1, 0]));
        mvMatrix = mult(rotate(turnRotAngle, [0, 0, -1]), mvMatrix);
        mvMatrix = mult(translate(xPos, yPos, zPos), mvMatrix);

        if (rotation) {
            mvMatrix = mult(mvMatrix, rotate(cube2, [1, 0, 0]));
        }
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, cubeIndBuf.numItems, gl.UNSIGNED_SHORT, 0);

        if(missileFired) {
            gl.bindBuffer(gl.ARRAY_BUFFER, missilePosBuf);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, missilePosBuf.itemSize, gl.FLOAT, false, 0, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, missileTexture);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndBuf);
            mvMatrix = scale(2.0, 2.0, 2.0);
            mvMatrix = mult(translate(missilePosx, missilePosy, missilePos + missileSpeed - 20), mvMatrix);
            setMatrixUniforms();
            gl.drawElements(gl.TRIANGLES, cubeIndBuf.numItems, gl.UNSIGNED_SHORT, 0);
        }
    }
        
    if (curState != GameState.TITLE)
    {
        drawAsteroids();
        drawPlanet();
    }

    // Render background
    gl.disableVertexAttribArray(shaderProgram.normalPositionAttribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, bgPosBuf);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bgPosBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bgTexBuf);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, bgTexBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bgTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    gl.uniform1i(uIsParticle, 2);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bgIndBuf);
    gl.drawElements(gl.TRIANGLES, bgIndBuf.numItems, gl.UNSIGNED_SHORT, 0);

    gl.enableVertexAttribArray(shaderProgram.normalPositionAttribute);

    // Render particle systems (has transparent geometry)
    explosionSystem.render();
    thrusterSystem.render();

    if (curState == GameState.TITLE)
        renderScreen(menuTexture);
    else if (curState == GameState.VICTORY)
        renderScreen(winTexture);
    else if (curState == GameState.DEATH)
        renderScreen(loseTexture);

    // Render screen flash, if applicable
    if (flashEnable)
    {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);

        gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
        gl.disableVertexAttribArray(shaderProgram.normalPositionAttribute);

        // Re-use the background vertex data, it's more or less the same
        gl.bindBuffer(gl.ARRAY_BUFFER, bgPosBuf);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bgPosBuf.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.uniform1i(uIsParticle, 4);
        gl.uniform4f(shaderProgram.ambientColorUniform, 0.7, 0.1, 0.1, flashTimer / maxFlashTimer);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bgIndBuf);
        gl.drawElements(gl.TRIANGLES, bgIndBuf.numItems, gl.UNSIGNED_SHORT, 0);

        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
        gl.enableVertexAttribArray(shaderProgram.normalPositionAttribute);

        gl.disable(gl.BLEND);
        gl.depthMask(true);
    }
}

function renderScreen(texture) {
    gl.enable(gl.BLEND);
    gl.depthMask(false);

    gl.disableVertexAttribArray(shaderProgram.normalPositionAttribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, bgPosBuf);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bgPosBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bgTexBuf);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, bgTexBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    u = gl.getUniformLocation(shaderProgram , "uRenderType");
    gl.uniform1i(u, 5);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bgIndBuf);
    gl.drawElements(gl.TRIANGLES, bgIndBuf.numItems, gl.UNSIGNED_SHORT, 0);

    gl.enableVertexAttribArray(shaderProgram.normalPositionAttribute);

    gl.disable(gl.BLEND);
    gl.depthMask(true);
}

function renderVictoryScreen() {
}

function renderDeathScreen() {
}

var missileFired = 0;
var missileReady = 0;
var currentlyPressedKeys = {};
var rotation;
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
    // movement
    // move light in opposite direction to keep it centered on sun
    if (currentlyPressedKeys[65]) {
        // 'a'
        if (xPos > -13){
            xPos -= 0.25;
            // calculate translated spaceship position
            spaceship_pos = vec3( spaceship_initial_pos[0] + xPos,
                         spaceship_initial_pos[1] + yPos,
                         spaceship_initial_pos[2] + zPos);
            //console.log(spaceship_pos);
        }
        if (turnRotAngle > 0.0) // Turn faster if already turned right
            turnRotAngle -= 6.0;
        else
            turnRotAngle -= 2.0;
        if (turnRotAngle < -30.0)
            turnRotAngle = -30.0;
        lightPosition.x -= 0.25;
    }
    if (currentlyPressedKeys[68]) {
        // 'd'
        if (xPos < 13){
            xPos += 0.25;
            // calculate translated spaceship position
            spaceship_pos = vec3( spaceship_initial_pos[0] + xPos,
                         spaceship_initial_pos[1] + yPos,
                         spaceship_initial_pos[2] + zPos);
            //console.log(spaceship_pos);
        }
        if (turnRotAngle < 0.0)  // Turn faster if already turned left
            turnRotAngle += 6.0;
        else
            turnRotAngle += 2.0;
        if (turnRotAngle > 30.0)
            turnRotAngle = 30.0;
        lightPosition.x += 0.25;
    }
    if (currentlyPressedKeys[87]) {
        // 'w'
        if (yPos < 8){
            yPos += 0.25;
            // calculate translated spaceship position
            spaceship_pos = vec3( spaceship_initial_pos[0] + xPos,
                         spaceship_initial_pos[1] + yPos,
                         spaceship_initial_pos[2] + zPos);
            //console.log(spaceship_pos);
        }
        lightPosition.y += 0.25;
    }
    if (currentlyPressedKeys[83]) {
        // 's'
        if (yPos > -8){
            yPos -= 0.25;
            // calculate translated spaceship position
            spaceship_pos = vec3( spaceship_initial_pos[0] + xPos,
                         spaceship_initial_pos[1] + yPos,
                         spaceship_initial_pos[2] + zPos);
            //console.log(spaceship_pos);
        }
        lightPosition.y -= 0.25;
    }
    if (currentlyPressedKeys[32]) {
        if (curState == GameState.TITLE
           || (curState == GameState.VICTORY
		      && victoryTimer <= 0)
           || (curState == GameState.DEATH
              && gameOverTimer <= 0))
        {
            curState = GameState.GAME;
            resetPlayer();
        }
        else if (curState == GameState.GAME)
            if (missileReady) {
                missileShootSound.currentTime = 0;
                missileShootSound.play();
                missileFired = 1;
                missilePosx = xPos;
                missilePosy = yPos;
            }
    }

    if (!currentlyPressedKeys[65] && !currentlyPressedKeys[68])
    {
        if (turnRotAngle > 0.0)
            turnRotAngle = Math.max(0, turnRotAngle - 2.0);
        else
            turnRotAngle = Math.min(0, turnRotAngle + 2.0);
    }
}

// orbiting animations
var totalTime = 0;

var lastTime = 0;
var cube1 = 0;
var cube2 = 0;
var cube1Tex = 0;

var missileSpeed = 0;
var timeSinceLastMissile = 3.0;

var timeSinceLastAsteroid = 0.5;

var respawnTimer = 0.0;
function animate(timestamp) {
    //    var timeNow = new Date().getTime();
    if (curState != GameState.TITLE && lastTime != 0) {
        var elapsed = (timestamp - lastTime) / 1000.0;
        cube1 += 60.0 * elapsed;
        cube2 += 30.0 * elapsed;

        totalTime += elapsed;

        if (planets[0].scale >= 150 && curState != GameState.VICTORY)
		{
            curState = GameState.VICTORY;
			victoryTimer = 2.0;
		}

        if (gameOverTimer > 0)
            gameOverTimer -= elapsed;
			
		if (victoryTimer > 0)
			victoryTimer -= elapsed;

        // need to check each asteroid and see if thezre is a collision with the ship and the asteroid.
        if (curState == GameState.GAME && health > 0 && !isInvulnerable) {
            for( var i = 0 ; i < asteroids.length ; i ++){
                if (asteroids[i].alive) {
                    var asteroidsCoordinates = [];
                    asteroidsCoordinates.push(asteroids[i].pos);
                    asteroidsCoordinates.push(asteroids[i].radius);
                    var spaceshipCoordinates = [];
                    spaceshipCoordinates.push(spaceship_pos);
                    spaceshipCoordinates.push(spaceship_radius);
                    if(collisionDetection(asteroidsCoordinates, 2, spaceshipCoordinates, 3)){
                        health--;
                        if (health == 0)
                        {
                            deathSound.currenttime = 0;
                            deathSound.play();
                            makeExplosion(spaceship_pos[0], spaceship_pos[1], spaceship_pos[2], 10, 300);
                            curState = GameState.DEATH;
							gameOverTimer = 2.0;
                        }
                        else {
                            hitSound.currenttime = 0;
                            hitSound.play();
                            isInvulnerable = true;
                            invulTimer = 2.0;
                            flashEnable = true;
                            flashTimer = maxFlashTimer;
                        }

                        break;
                    }
                }
            }
        }

        if (isInvulnerable) {
            invulFlash = invulFlash ? false : true;
            invulTimer -= elapsed;
            if (invulTimer <= 0.0)
            {
                isInvulnerable = false;
                invulFlash = false;
            }
        }

        if (flashEnable) {
            flashTimer -= elapsed;
            if (flashTimer <= 0.0)
                flashEnable = false;
        }

        // Spawn rate == (1 + totalTime / 20.0) per second
        if (curState == GameState.GAME) {
            timeSinceLastAsteroid += elapsed;
            if (timeSinceLastAsteroid >= 1.0 / (1.0 + totalTime / 20.0)) {
                timeSinceLastAsteroid = 0.0;
                makeAsteroid(1.0 + totalTime / 5.0);
            }
        }

        for (var i = 0; i < asteroids.length; i++)
        {
            for (var j = 0; j < 3; j ++)
                asteroids[i].pos[j] += asteroids[i].vel[j] * elapsed;
            asteroids[i].rotPos += asteroids[i].rotSpeed * elapsed;

            if (asteroids[i].pos[2] > 0)
            {
                asteroids.splice(i, 1);
                i--;
            }
        }

         for (var i = 0; i < planets.length; i++)
         {
             for (var j = 0; j < 3; j ++)
                 planets[i].pos[j] += planets[i].vel[j] * elapsed;
             planets[i].rotPos += planets[i].rotSpeed * elapsed;
 
             if (planets[i].pos[2] > 0)
             {
                 planets.splice(i, 1);
                 i--;
             }
         }

         timeSinceLastMissile += elapsed;
         if (timeSinceLastMissile >= 3.0) {
             timeSinceLastMissile = 0.0;
             missileReady = 1;
             missilePos = 0;
         }
 
         if (missileSpeed <= -200) {
             missileSpeed = 0;
             missileFired = 0;
         }
 
         if (missileFired) {
             missileSpeed -= 3;
             missileReady = 0;
             for( var i = 0 ; i < asteroids.length ; i ++){
                 var asteroidsCoordinates = [];
                 asteroidsCoordinates.push(asteroids[i].pos);
                 asteroidsCoordinates.push(asteroids[i].radius);
                 var missileCoordinates = [];
                 missileCoordinates.push(vec3(missilePosx, missilePosy,
                          missilePos + missileSpeed));
                 missileCoordinates.push(1.4);
                 if(collisionDetection(asteroidsCoordinates, 2, missileCoordinates, 3)){
                     missileExplodeSound.currentTime = 0;
                     missileExplodeSound.play();
                     makeExplosion(asteroids[i].pos[0], asteroids[i].pos[1], asteroids[i].pos[2], 10, 300);
                     makeExplosion(missilePosx, missilePosy, missilePos + missileSpeed, 5, 100);
                     asteroids.splice(i, 1);
                     missileFired = 0;
                     missileSpeed = 0;
                     break;
                 }
             }
         }

        if (health > 0)
        {
            var theta = degToRad(turnRotAngle);
            makeThruster(xPos - 1.5 * Math.cos(theta), yPos + 1.5 * Math.sin(theta), zPos + 2.5);
            makeThruster(xPos + 1.5 * Math.cos(theta), yPos - 1.5 * Math.sin(theta), zPos + 2.5);
        }

        explosionSystem.update(elapsed);
        thrusterSystem.update(elapsed);

    }
    lastTime = timestamp;
}

function tick(timestamp) {
    drawScene();
    handleKeys();
    animate(timestamp);
    requestAnimFrame(tick);
}

var GameState = {
    TITLE : 0,
    GAME: 1,
    VICTORY: 2,
    DEATH: 3
}
var curState;
window.onload = function webGLStart() {
    var canvas = document.getElementById("gl-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initAsteroidBuffers();
    initPlanetBuffers();
    initParticleSystem();
    initTexture();
    initSounds();

    curState = GameState.TITLE;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    //    tick();
    requestAnimFrame(tick);
}


